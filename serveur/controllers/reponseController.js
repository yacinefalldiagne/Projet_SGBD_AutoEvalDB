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



// Nouvelle fonction pour récupérer les corrections d'un étudiant
const getCorrectionsByStudent = async (req, res) => {
    try {
        // Vérifier l’authentification
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Vous devez être connecté pour consulter vos corrections." });
        }

        const userId = req.user._id.toString(); // ID de l’utilisateur connecté

        // Récupérer les corrections
        const corrections = await Correction.find({ student: userId })
            .populate('reponse', 'file createdAt')
            .populate('topic', 'title')

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

        // Si aucune correction, retourner un tableau vide (pas une erreur)
        if (!corrections.length) {
            return res.status(200).json([]); // Retourner un tableau vide au lieu de 404
        }

        // Formater les données
        const formattedCorrections = await Promise.all(corrections.map(async (correction) => {
            const reponse = correction.reponse;
            let submissionFileUrl = null;
            if (reponse && reponse.file) {
                const encryptedFilePath = path.join('uploads', reponse.file);
                try {
                    const decryptedFilePath = await decryptFile(encryptedFilePath);
                    submissionFileUrl = decryptedFilePath ? `/uploads/${path.basename(decryptedFilePath)}` : null;
                } catch (decryptError) {
                    console.error(`Erreur lors du déchiffrement du fichier ${reponse.file}:`, decryptError);
                    submissionFileUrl = null; // Ne bloque pas la réponse
                }
            }
            return {
                submission_id: reponse ? reponse._id.toString() : null,
                title: correction.topic ? correction.topic.title : "Sujet inconnu",
                grade: correction.score,
                feedback: correction.correction,
                submission_file_url: submissionFileUrl,
                correction_file_url: null,
                description: reponse ? `Soumis le ${new Date(reponse.createdAt).toLocaleDateString()}` : "N/A",
            };
        }));

        res.status(200).json(formattedCorrections);
    } catch (error) {
        console.error("Erreur dans getCorrectionsByStudent:", error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
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
module.exports = {
    createReponse,
    getReponse,
    getReponsesByStudent,
    getAssignments,
    getAllCorrections,
    generateCorrectionForReponse,
    getCorrectionsForStudent,
    updateCorrectionFeedback,
    updateCorrectionScore

};