const jwt = require('jsonwebtoken');
const Reponse = require('../models/reponse');
const User = require('../models/user');
const Topic = require('../models/topic');
const Correction = require('../models/correction');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { extractTextFromPDF } = require('../services/pdfServices');
const { generateCorrectionStudent } = require('../services/ollamaService');

const availableModels = ['deepseek-coder'];

// Vérifier l'authentification de l'utilisateur et obtenir son ID
const verifyToken = (req) => {
    const token = req.cookies.token;
    if (!token) {
        throw new Error('Token non fourni');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        throw new Error('Token invalide');
    }
};

// Configuration de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|doc|docx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Seuls les fichiers PDF, DOC, DOCX sont acceptés'));
    },
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('file');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const IV_LENGTH = 16;

// Fonction pour chiffrer le fichier
const encryptFile = (filePath) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const input = fs.createReadStream(filePath);
    const encryptedFilePath = filePath + '.enc';
    const output = fs.createWriteStream(encryptedFilePath);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
        fs.unlinkSync(filePath);
    });

    return encryptedFilePath;
};

// Fonction pour déchiffrer le fichier
const decryptFile = (encryptedFilePath) => {
    return new Promise((resolve, reject) => {
        const iv = Buffer.from(encryptedFilePath.slice(-IV_LENGTH)); // Note : ceci est incorrect, voir explication ci-dessous
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const input = fs.createReadStream(encryptedFilePath);
        const decryptedFilePath = encryptedFilePath.replace('.enc', '');
        const output = fs.createWriteStream(decryptedFilePath);

        input.pipe(decipher).pipe(output);

        output.on('finish', () => {
            resolve(decryptedFilePath);
        });

        output.on('error', (error) => {
            reject(error);
        });

        input.on('error', (error) => {
            reject(error);
        });

        decipher.on('error', (error) => {
            reject(error);
        });
    });
};

const createReponse = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const userId = verifyToken(req);
            const { title, student } = req.body;
            const filename = req.file ? req.file.filename : undefined;

            const filePath = path.join('uploads', filename);
            const encryptedFilePath = encryptFile(filePath);
            const encryptedFilename = path.basename(encryptedFilePath);

            const studentId = student || userId;
            if (!studentId) {
                return res.status(400).json({ message: "L'identifiant de l'étudiant est requis." });
            }

            const newReponse = new Reponse({
                title: title,
                student: studentId,
                file: encryptedFilename,
            });

            await newReponse.save();

            res.status(201).json({
                message: 'Réponse soumise avec succès !',
                reponse: {
                    ...newReponse._doc,
                    fileUrl: encryptedFilename ? `/uploads/${encryptedFilename}` : null,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
        }
    });
};

const getReponse = async (req, res) => {
    try {
        const reponses = await Reponse.find()
            .populate('student', 'name email')
            .populate('title');

        if (!reponses.length) {
            return res.status(404).json({ message: "Aucun sujet trouvé." });
        }

        const reponsesWithFileUrls = await Promise.all(reponses.map(async (reponse) => {
            const reponseObj = reponse.toObject();

            if (reponse.file) {
                const encryptedFilePath = path.join('uploads', reponse.file);
                const decryptedFilePath = await decryptFile(encryptedFilePath);
                reponseObj.fileUrl = decryptedFilePath ? `/uploads/${path.basename(decryptedFilePath)}` : null;
            } else {
                reponseObj.fileUrl = null;
            }

            const correction = await Correction.findOne({ reponse: reponse._id });
            if (correction) {
                reponseObj.correction = {
                    correction: correction.correction,
                    score: correction.score,
                    feedback: correction.feedback,
                };
            }

            return reponseObj;
        }));

        res.status(200).json(reponsesWithFileUrls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

const generateCorrectionForReponse = async (req, res) => {
    try {
        const { reponseId } = req.params;

        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (user.role !== 'enseignant') {
            return res.status(403).json({ message: "Seuls les enseignants peuvent générer des corrections automatiques." });
        }

        const reponse = await Reponse.findById(reponseId)
            .populate('title')
            .populate('student', 'name email');
        if (!reponse) {
            return res.status(404).json({ message: "Réponse non trouvée." });
        }

        const topic = await Topic.findById(reponse.title);
        if (!topic) {
            return res.status(400).json({ message: "Le sujet spécifié n'existe pas." });
        }
        if (!topic.corrections || topic.corrections.length === 0) {
            return res.status(400).json({ message: "Aucune correction modèle n'est disponible dans ce sujet." });
        }

        const encryptedFilePath = path.join('uploads', reponse.file);
        if (!fs.existsSync(encryptedFilePath)) {
            return res.status(404).json({ message: `Fichier chiffré non trouvé : ${reponse.file}` });
        }

        const decryptedFilePath = await decryptFile(encryptedFilePath);
        const submittedText = await extractTextFromPDF(decryptedFilePath);
        fs.unlinkSync(decryptedFilePath); // Supprimer le fichier déchiffré après usage

        const teacherCorrectionText = topic.corrections[0].correction;
        const correctionResult = await generateCorrectionStudent(submittedText, teacherCorrectionText, availableModels[0]);

        console.log('Résultat de la correction :', correctionResult); // Log pour diagnostiquer

        const newCorrection = new Correction({
            reponse: reponse._id,
            topic: reponse.title,
            student: reponse.student,
            submittedText: submittedText,
            correction: correctionResult.correction,
            model: correctionResult.model,
            score: correctionResult.score,
            feedback: correctionResult.feedback,
        });

        await newCorrection.save();

        res.status(200).json({
            message: 'Correction générée avec succès !',
            correction: {
                correction: correctionResult.correction,
                score: correctionResult.score,
                feedback: correctionResult.feedback,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
    }
};

const getAllCorrections = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const user = await User.findById(userId);

        if (user.role !== 'enseignant') {
            return res.status(403).json({ message: "Seuls les enseignants peuvent voir toutes les corrections." });
        }

        const corrections = await Correction.find()
            .populate('reponse')
            .populate('topic', 'title')
            .populate('student', 'name email');

        if (!corrections.length) {
            return res.status(404).json({ message: "Aucune correction trouvée." });
        }

        res.status(200).json(corrections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

const getAssignments = async (req, res) => {
    try {
        const topics = await Topic.find();
        res.status(200).json(topics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer.' });
    }
};

const getReponsesByStudent = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const reponses = await Reponse.find({ student: userId })
            .populate('student', 'name email')
            .populate('title');

        if (!reponses.length) {
            return res.status(404).json({ message: "Aucune réponse trouvée pour cet étudiant." });
        }

        res.status(200).json(reponses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

const getCorrectionsForStudent = async (req, res) => {
    try {
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        let corrections;
        if (user.role === 'etudiant') {
            corrections = await Correction.find({ student: userId })
                .populate('student', 'name email')
                .populate('topic', 'title description')
                .select('submittedText correction score feedback createdAt');
        } else if (user.role === 'enseignant') {
            corrections = await Correction.find()
                .populate('student', 'name email')
                .populate('topic', 'title description')
                .select('submittedText correction score feedback createdAt');
        } else {
            return res.status(403).json({ message: "Rôle non autorisé." });
        }

        if (!corrections.length) {
            return res.status(404).json({ message: "Aucune correction trouvée." });
        }

        res.status(200).json(corrections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

// Mettre à jour la note d'une correction
const updateCorrectionScore = async (req, res) => {
    try {
        const { correctionId } = req.params;
        const { score } = req.body;

        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (user.role !== 'enseignant') {
            return res.status(403).json({ message: "Seuls les enseignants peuvent ajuster les notes." });
        }

        if (score < 0 || score > 20) {
            return res.status(400).json({ message: "La note doit être comprise entre 0 et 20." });
        }

        const correction = await Correction.findById(correctionId);
        if (!correction) {
            return res.status(404).json({ message: "Correction non trouvée." });
        }

        correction.score = score;
        await correction.save();

        res.status(200).json({ message: "Note mise à jour avec succès.", correction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

// Mettre à jour le feedback d'une correction
const updateCorrectionFeedback = async (req, res) => {
    try {
        const { correctionId } = req.params;
        const { feedback } = req.body;

        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (user.role !== 'enseignant') {
            return res.status(403).json({ message: "Seuls les enseignants peuvent ajuster le feedback." });
        }

        if (!feedback || feedback.trim() === '') {
            return res.status(400).json({ message: "Le feedback ne peut pas être vide." });
        }

        const correction = await Correction.findById(correctionId);
        if (!correction) {
            return res.status(404).json({ message: "Correction non trouvée." });
        }

        correction.feedback = feedback;
        await correction.save();

        res.status(200).json({ message: "Feedback mis à jour avec succès.", correction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

const getDashboard = async (req, res) => {
    try {
        // Vérifier l'authentification via JWT
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: "Vous devez être connecté pour accéder au tableau de bord." });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token invalide ou expiré." });
        }

        const userId = decoded.id; // Ou decoded.userId selon ton payload JWT
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Récupérer les réponses de l'étudiant
        const reponses = await Reponse.find({ student: userId })
            .populate('title', 'title description');

        // Récupérer les corrections associées à ces réponses
        const corrections = await Correction.find({ student: userId })
            .populate('reponse', 'file createdAt')
            .populate('topic', 'title');

        // Calculer la moyenne de l'étudiant
        const totalScore = corrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
        const averageGrade = corrections.length > 0 ? totalScore / corrections.length : 0;

        // Formater les soumissions pour le frontend
        const submissions = corrections.map((correction) => ({
            id: correction._id.toString(),
            exerciseName: correction.topic?.title || "Sans titre",
            date: correction.createdAt,
            grade: correction.score || 0,
            feedback: correction.feedback || "Aucun feedback",
        }));

        // Données pour la progression (par date)
        const progression = corrections.map((correction) => ({
            date: new Date(correction.createdAt).toLocaleDateString(),
            grade: correction.score || 0,
            classAverage: null, // Calculé ci-dessous
        }));

        // Calculer la moyenne de la classe (toutes les corrections)
        const allCorrections = await Correction.find()
            .populate('student', 'role')
            .lean();
        const studentCorrections = allCorrections.filter(corr => {
            const student = corr.student;
            return student && student.role === 'etudiant';
        });
        const classTotalScore = studentCorrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
        const classAverage = studentCorrections.length > 0 ? classTotalScore / studentCorrections.length : 0;

        // Ajouter la moyenne de la classe à la progression
        progression.forEach((item) => {
            item.classAverage = classAverage;
        });

        // Réponse finale
        const dashboardData = {
            name: user.name || "Étudiant",
            averageGrade,
            submissions,
            progression,
            classAverage,
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error("Erreur dans getDashboard:", error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

const getCorrectionsByStudent = async (req, res) => {
    try {
        // Vérifier l'authentification via JWT (comme dans ton setup)
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: "Vous devez être connecté pour consulter vos corrections." });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token invalide ou expiré." });
        }

        const userId = decoded.id; // Ou decoded.userId selon ton JWT payload
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Récupérer les corrections pour l'étudiant connecté
        const corrections = await Correction.find({ student: userId })
            .populate('reponse', 'file createdAt') // Récupère le fichier et la date de la réponse
            .populate('topic', 'title') // Récupère le titre du sujet
            .populate('student', 'name email'); // Récupère le nom et email de l'étudiant

        // Si aucune correction n'est trouvée, retourner un tableau vide
        if (!corrections.length) {
            return res.status(200).json([]);
        }

        // Formater les données pour le frontend
        const formattedCorrections = corrections.map((correction) => ({
            _id: correction._id,
            submission_id: correction.reponse?._id?.toString(),
            title: correction.topic?.title || "Sans titre",
            submittedText: correction.submittedText,
            correction: correction.correction,
            model: correction.model,
            score: correction.score,
            feedback: correction.feedback,
            description: correction.reponse?.createdAt
                ? `Soumis le ${new Date(correction.reponse.createdAt).toLocaleDateString()}`
                : "Date non disponible",
            submission_file_url: correction.reponse?.file ? `/uploads/${correction.reponse.file}` : null,
            correction_file_url: null, // Ajoute une logique si tu as un fichier de correction
            createdAt: correction.createdAt,
        }));

        res.status(200).json(formattedCorrections);
    } catch (error) {
        console.error("Erreur dans getCorrectionsByStudent:", error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

//test

module.exports = {
    createReponse,
    getReponse,
    getReponsesByStudent,
    getAssignments,
    getAllCorrections,
    generateCorrectionForReponse,
    getCorrectionsForStudent,
    updateCorrectionFeedback,
    updateCorrectionScore,
    getCorrectionsByStudent,
    getDashboard,

};