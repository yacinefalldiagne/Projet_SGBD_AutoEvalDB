const jwt = require('jsonwebtoken');
const Reponse = require('../models/reponse');
const User = require('../models/user');
const Topic = require('../models/topic');
const Correction = require('../models/correction');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { extractTextFromPDF } = require('../services/pdfServices');
const { generateCorrectionStudent } = require('../services/ollamaService');
const minioClient = require('../minio');

const availableModels = ['deepseek-coder'];
const BUCKET_NAME = 'autoeval';
const DEFAULT_REGION = 'us-east-1';

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

// Configuration de Multer pour stocker en mémoire
const upload = multer({
    storage: multer.memoryStorage(),
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

// Clé de chiffrement
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const IV_LENGTH = 16;

// Fonction pour chiffrer le fichier
const encryptFileBuffer = (buffer) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
};

// Fonction pour déchiffrer le fichier
const decryptFileBuffer = (buffer) => {
    const iv = buffer.slice(0, IV_LENGTH);
    const encryptedData = buffer.slice(IV_LENGTH);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};

// Vérifier et créer le bucket si nécessaire
const ensureBucketExists = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, DEFAULT_REGION);
            console.log(`Bucket ${BUCKET_NAME} créé avec succès dans la région ${DEFAULT_REGION}.`);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification/création du bucket:', error);
        throw error;
    }
};

// Créer une nouvelle réponse
const createReponse = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const userId = verifyToken(req);
            const { title, student } = req.body;
            const file = req.file; // Utilisation de req.file car .single('file') est configuré

            console.log('Données reçues:', { title, student });
            console.log('Fichier réponse:', file ? { name: file.originalname, size: file.size } : 'Aucun');

            await ensureBucketExists();

            let encryptedFilename = null;
            if (file) {
                if (!file.buffer || file.size === 0) {
                    throw new Error('Le fichier réponse est vide ou corrompu.');
                }
                const fileName = `${Date.now()}${path.extname(file.originalname)}`;
                const encryptedBuffer = encryptFileBuffer(file.buffer);
                encryptedFilename = `${fileName}.enc`;

                await minioClient.putObject(
                    BUCKET_NAME,
                    encryptedFilename,
                    encryptedBuffer,
                    encryptedBuffer.length,
                    { 'Content-Type': file.mimetype }
                );
                console.log(`Fichier chiffré ${encryptedFilename} téléversé avec succès vers MinIO.`);
            }

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

            const fileUrl = encryptedFilename
                ? await minioClient.presignedUrl('GET', BUCKET_NAME, encryptedFilename, 24 * 60 * 60, { region: DEFAULT_REGION })
                : null;

            res.status(201).json({
                message: 'Réponse soumise avec succès !',
                reponse: {
                    ...newReponse._doc,
                    fileUrl,
                },
            });
        } catch (error) {
            console.error('Erreur dans createReponse:', error);
            res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
        }
    });
};

const downloadReponseFile = async (req, res) => {
    try {
        const { reponseId } = req.params;

        // Vérifier l'utilisateur connecté
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (!user || (user.role !== 'enseignant' && user.role !== 'etudiant')) {
            return res.status(403).json({ message: "Accès non autorisé." });
        }

        const reponse = await Reponse.findById(reponseId);
        if (!reponse || !reponse.file) {
            return res.status(404).json({ message: "Réponse ou fichier non trouvé." });
        }

        // Si étudiant, vérifier qu'il est le propriétaire de la réponse
        if (user.role === 'etudiant' && reponse.student.toString() !== userId) {
            return res.status(403).json({ message: "Vous ne pouvez consulter que vos propres réponses." });
        }

        // Récupérer le fichier chiffré depuis MinIO
        const fileStream = await minioClient.getObject(BUCKET_NAME, reponse.file);
        const chunks = [];
        for await (const chunk of fileStream) {
            chunks.push(chunk);
        }
        const encryptedBuffer = Buffer.concat(chunks);

        // Déchiffrer le fichier
        const decryptedBuffer = decryptFileBuffer(encryptedBuffer);

        // Définir les en-têtes pour le téléchargement ou l'affichage
        const originalFileName = reponse.file.replace('.enc', '');
        res.setHeader('Content-Type', 'application/pdf'); // Supposons que c'est un PDF
        res.setHeader('Content-Disposition', `inline; filename="${originalFileName}"`);

        // Envoyer le buffer déchiffré au client
        res.send(decryptedBuffer);
    } catch (error) {
        console.error('Erreur dans downloadReponseFile:', error);
        res.status(500).json({ message: "Erreur lors de la récupération du fichier." });
    }
};
// Récupérer toutes les réponses
const getReponse = async (req, res) => {
    try {
        const reponses = await Reponse.find()
            .populate('student', 'name email')
            .populate('title');

        if (!reponses.length) {
            return res.status(404).json({ message: "Aucune réponse trouvée." });
        }

        const reponsesWithFileUrls = await Promise.all(reponses.map(async (reponse) => {
            const reponseObj = reponse.toObject();

            if (reponse.file) {
                reponseObj.fileUrl = await minioClient.presignedUrl(
                    'GET',
                    BUCKET_NAME,
                    reponse.file,
                    24 * 60 * 60,
                    { region: DEFAULT_REGION }
                );
                console.log(`URL présignée générée pour ${reponse.file}: ${reponseObj.fileUrl}`);
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
        console.error('Erreur dans getReponse:', error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Générer une correction pour une réponse
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

        if (!reponse.file) {
            return res.status(404).json({ message: "Aucun fichier associé à cette réponse." });
        }

        // Récupérer et déchiffrer le fichier depuis MinIO
        const fileStream = await minioClient.getObject(BUCKET_NAME, reponse.file);
        const chunks = [];
        for await (const chunk of fileStream) {
            chunks.push(chunk);
        }
        const encryptedBuffer = Buffer.concat(chunks);
        const decryptedBuffer = decryptFileBuffer(encryptedBuffer);

        const submittedText = await extractTextFromPDF(decryptedBuffer);
        const teacherCorrectionText = topic.corrections[0].correction;
        const correctionResult = await generateCorrectionStudent(submittedText, teacherCorrectionText, availableModels[0]);

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
        console.error('Erreur dans generateCorrectionForReponse:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
    }
};

// Récupérer toutes les corrections
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
        console.error('Erreur dans getAllCorrections:', error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Récupérer tous les devoirs
const getAssignments = async (req, res) => {
    try {
        const topics = await Topic.find();
        res.status(200).json(topics);
    } catch (error) {
        console.error('Erreur dans getAssignments:', error);
        res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer.' });
    }
};

// Récupérer les réponses d'un étudiant
const getReponsesByStudent = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const reponses = await Reponse.find({ student: userId })
            .populate('student', 'name email')
            .populate('title');

        if (!reponses.length) {
            return res.status(404).json({ message: "Aucune réponse trouvée pour cet étudiant." });
        }

        const reponsesWithFileUrls = await Promise.all(reponses.map(async (reponse) => {
            const reponseObj = reponse.toObject();
            if (reponse.file) {
                reponseObj.fileUrl = await minioClient.presignedUrl(
                    'GET',
                    BUCKET_NAME,
                    reponse.file,
                    24 * 60 * 60,
                    { region: DEFAULT_REGION }
                );
            }
            return reponseObj;
        }));

        res.status(200).json(reponsesWithFileUrls);
    } catch (error) {
        console.error('Erreur dans getReponsesByStudent:', error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Récupérer les corrections pour un étudiant ou un enseignant
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
        console.error('Erreur dans getCorrectionsForStudent:', error);
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
        console.error('Erreur dans updateCorrectionScore:', error);
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
        console.error('Erreur dans updateCorrectionFeedback:', error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

// Tableau de bord étudiant
const getDashboard = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: "Vous devez être connecté pour accéder au tableau de bord." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const reponses = await Reponse.find({ student: userId })
            .populate('title', 'title description');

        const corrections = await Correction.find({ student: userId })
            .populate('reponse', 'file createdAt')
            .populate('topic', 'title');

        const totalScore = corrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
        const averageGrade = corrections.length > 0 ? totalScore / corrections.length : 0;

        const submissions = corrections.map((correction) => ({
            id: correction._id.toString(),
            exerciseName: correction.topic?.title || "Sans titre",
            date: correction.createdAt,
            grade: correction.score || 0,
            feedback: correction.feedback || "Aucun feedback",
        }));

        const progression = corrections.map((correction) => ({
            date: new Date(correction.createdAt).toLocaleDateString(),
            grade: correction.score || 0,
            classAverage: null,
        }));

        const allCorrections = await Correction.find()
            .populate('student', 'role')
            .lean();
        const studentCorrections = allCorrections.filter(corr => corr.student && corr.student.role === 'etudiant');
        const classTotalScore = studentCorrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
        const classAverage = studentCorrections.length > 0 ? classTotalScore / studentCorrections.length : 0;

        progression.forEach((item) => {
            item.classAverage = classAverage;
        });

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

// Récupérer les corrections par étudiant
const getCorrectionsByStudent = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: "Vous devez être connecté pour consulter vos corrections." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const corrections = await Correction.find({ student: userId })
            .populate('reponse', 'file createdAt')
            .populate('topic', 'title')
            .populate('student', 'name email');

        if (!corrections.length) {
            return res.status(200).json([]);
        }

        const formattedCorrections = await Promise.all(corrections.map(async (correction) => {
            let submissionFileUrl = null;
            if (correction.reponse?.file) {
                submissionFileUrl = await minioClient.presignedUrl(
                    'GET',
                    BUCKET_NAME,
                    correction.reponse.file,
                    24 * 60 * 60,
                    { region: DEFAULT_REGION }
                );
            }

            return {
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
                submission_file_url: submissionFileUrl,
                correction_file_url: null, // À implémenter si nécessaire
                createdAt: correction.createdAt,
            };
        }));

        res.status(200).json(formattedCorrections);
    } catch (error) {
        console.error("Erreur dans getCorrectionsByStudent:", error);
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
    updateCorrectionScore,
    getCorrectionsByStudent,
    getDashboard,
    downloadReponseFile
};