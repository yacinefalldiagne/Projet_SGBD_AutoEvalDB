const jwt = require('jsonwebtoken');
const Topic = require('../models/topic');
const User = require('../models/user');
const Correction = require('../models/correction');
const Reponse = require('../models/reponse');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { extractTextFromPDF } = require('../services/pdfServices');
const { generateCorrection } = require('../services/ollamaService');
const PDFDocument = require('pdfkit');
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
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'correction', maxCount: 1 }
]);

const ensureBucketExists = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1'); // Région par défaut
            console.log(`Bucket ${BUCKET_NAME} créé avec succès.`);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification/création du bucket:', error);
        throw error;
    }
};
// Créer un nouveau topic
const createTopic = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const userId = verifyToken(req);
            const { title, description, teacher, deadline } = req.body;
            const file = req.files?.file ? req.files.file[0] : null;
            // const correctionFile = req.files?.correction ? req.files.correction[0] : null;

            console.log('Données reçues:', { title, description, teacher, deadline });
            console.log('Fichier sujet:', file ? { name: file.originalname, size: file.size } : 'Aucun');
            // console.log('Fichier correction:', correctionFile ? { name: correctionFile.originalname, size: correctionFile.size } : 'Aucun');

            // Vérifier et créer le bucket si nécessaire
            await ensureBucketExists();

            let fileName;

            // Téléverser le fichier principal vers MinIO
            if (file) {
                if (!file.buffer || file.size === 0) {
                    throw new Error('Le fichier sujet est vide ou corrompu.');
                }
                fileName = `${Date.now()}${path.extname(file.originalname)}`;
                await minioClient.putObject(
                    BUCKET_NAME,
                    fileName,
                    file.buffer,
                    file.size,
                    { 'Content-Type': file.mimetype }
                );
                console.log(`Fichier ${fileName} téléversé avec succès.`);
            }

            // // Téléverser le fichier de correction vers MinIO
            // if (correctionFile) {
            //     if (!correctionFile.buffer || correctionFile.size === 0) {
            //         throw new Error('Le fichier de correction est vide ou corrompu.');
            //     }
            //     correctionFileName = `${Date.now()}_correction${path.extname(correctionFile.originalname)}`;
            //     await minioClient.putObject(
            //         BUCKET_NAME,
            //         correctionFileName,
            //         correctionFile.buffer,
            //         correctionFile.size,
            //         { 'Content-Type': correctionFile.mimetype }
            //     );
            //     console.log(`Fichier ${correctionFileName} téléversé avec succès.`);
            // }

            const teacherId = teacher || userId;

            const newTopic = new Topic({
                title: title,
                description: description,
                teacher: teacherId,
                deadline: deadline ? new Date(deadline) : null,
                file: fileName,
            });

            await newTopic.save();

            const fileUrl = fileName
                ? await minioClient.presignedUrl('GET', BUCKET_NAME, fileName, 24 * 60 * 60,
                    { region: DEFAULT_REGION })
                : null;

            res.status(201).json({
                message: 'Sujet créé avec succès !',
                topic: {
                    ...newTopic._doc,
                    fileUrl
                }
            });
        } catch (error) {
            console.error('Erreur dans createTopic:', error);
            res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
        }
    });
};

// Récupérer tous les topics
const getTopic = async (req, res) => {
    try {
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé. Veuillez vous reconnecter." });
        }

        let topics;
        if (user.role === 'enseignant') {
            topics = await Topic.find({ teacher: userId }).populate('teacher', 'name email');
        } else if (user.role === 'etudiant') {
            topics = await Topic.find({ status: 'public' }).populate('teacher', 'name email');
        } else {
            return res.status(403).json({ message: "Rôle non autorisé." });
        }

        if (!topics.length) {
            return res.status(404).json({ message: "Aucun sujet trouvé." });
        }

        const topicsWithFileUrls = await Promise.all(topics.map(async (topic) => {
            const topicObj = topic.toObject();
            if (topic.file) {
                topicObj.fileUrl = await minioClient.presignedUrl('GET', BUCKET_NAME, topic.file, 24 * 60 * 60,
                    { region: DEFAULT_REGION });
            }
            return topicObj;
        }));

        res.status(200).json(topicsWithFileUrls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Publier un devoir (changer le statut de brouillon à public)
const publishTopic = async (req, res) => {
    try {
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { topicId } = req.params;

        const topic = await Topic.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: "Devoir non trouvé." });
        }

        if (topic.teacher.toString() !== userId) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à publier ce devoir." });
        }

        if (topic.status === 'public') {
            return res.status(400).json({ message: "Ce devoir est déjà publié." });
        }

        topic.status = 'public';
        await topic.save();

        res.status(200).json({ message: "Devoir publié avec succès." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Télécharger un fichier spécifique par ID
const downloadFile = async (req, res) => {
    try {
        const { topicId } = req.params;
        const topic = await Topic.findById(topicId);

        if (!topic || !topic.file) {
            return res.status(404).json({ message: "Fichier non trouvé" });
        }

        const fileStream = await minioClient.getObject(BUCKET_NAME, topic.file);
        const extname = path.extname(topic.file).toLowerCase();
        let contentType = 'application/octet-stream';

        if (extname === '.pdf') contentType = 'application/pdf';
        else if (extname === '.doc') contentType = 'application/msword';
        else if (extname === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${topic.file}"`);

        fileStream.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors du téléchargement du fichier" });
    }
};

// Générer une nouvelle correction et l'ajouter au tableau
const generateCorrectionsForTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const topic = await Topic.findById(topicId);

        if (!topic || !topic.file) {
            return res.status(404).json({ message: 'Topic ou fichier non trouvé' });
        }

        // Récupérer le fichier depuis MinIO
        const fileStream = await minioClient.getObject(BUCKET_NAME, topic.file);
        const chunks = [];
        for await (const chunk of fileStream) {
            chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        const pdfText = await extractTextFromPDF(fileBuffer); // Modifier extractTextFromPDF pour accepter un buffer

        const correctionResult = await generateCorrection(pdfText, availableModels[0]);

        topic.corrections.push({
            model: correctionResult.model,
            correction: correctionResult.correction,
            score: correctionResult.score,
        });
        await topic.save();

        res.status(200).json({
            message: 'Correction générée avec succès',
            correction: {
                model: correctionResult.model,
                correction: correctionResult.correction,
                score: correctionResult.score,
            }
        });
    } catch (error) {
        console.error('Erreur dans generateCorrectionsForTopic :', error);
        res.status(500).json({ message: 'Erreur lors de la génération de la correction : ' + error.message });
    }
};

// Télécharger une correction spécifique au format PDF
const downloadCorrectionAsPDF = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { correctionIndex } = req.query;

        const topic = await Topic.findById(topicId);
        if (!topic || !topic.corrections || topic.corrections.length === 0) {
            return res.status(404).json({ message: 'Aucune correction trouvée pour ce sujet' });
        }

        const index = correctionIndex ? parseInt(correctionIndex, 10) : topic.corrections.length - 1;
        if (isNaN(index) || index < 0 || index >= topic.corrections.length) {
            return res.status(400).json({ message: 'Index de correction invalide' });
        }

        const correction = topic.corrections[index];

        // Générer le PDF en mémoire
        const doc = new PDFDocument();
        const pdfBuffers = [];

        doc.on('data', (chunk) => pdfBuffers.push(chunk));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(pdfBuffers);

            // Téléverser temporairement vers MinIO (optionnel) ou servir directement
            const pdfFileName = `correction_${topicId}_${index}.pdf`;
            await minioClient.putObject(BUCKET_NAME, pdfFileName, pdfBuffer, pdfBuffer.length, {
                'Content-Type': 'application/pdf'
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
            const pdfStream = await minioClient.getObject(BUCKET_NAME, pdfFileName);
            pdfStream.pipe(res);

            // Supprimer le fichier temporaire de MinIO après envoi
            pdfStream.on('end', () => minioClient.removeObject(BUCKET_NAME, pdfFileName));
        });

        doc.fontSize(16).text(`Correction pour le sujet : ${topic.title}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Modèle utilisé : ${correction.model}`);
        doc.moveDown();
        doc.text(`Correction #${index + 1} :`);
        doc.text(correction.correction, { align: 'left' });

        doc.end();
    } catch (error) {
        console.error('Erreur dans downloadCorrectionAsPDF :', error);
        res.status(500).json({ message: 'Erreur lors de la génération du PDF : ' + error.message });
    }
};

// Tableau de bord enseignant (pas de modification directe liée aux fichiers ici)
const getTeacherDashboard = async (req, res) => {
    try {
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (!user || user.role !== 'enseignant') {
            return res.status(403).json({ message: "Seuls les enseignants peuvent accéder à ce tableau de bord." });
        }

        const totalStudents = await User.countDocuments({ role: 'etudiant' });
        const allCorrections = await Correction.find()
            .populate('student', 'name email role')
            .populate('topic', 'title')
            .lean();
        const allResponses = await Reponse.find()
            .populate('student', 'name email')
            .populate('title', 'title')
            .lean();

        const studentCorrections = allCorrections.filter(corr => corr.student && corr.student.role === 'etudiant');
        const totalScore = studentCorrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
        const generalAverage = studentCorrections.length > 0 ? totalScore / studentCorrections.length : 0;
        const successfulCorrections = studentCorrections.filter(corr => corr.score > 10);
        const successRate = studentCorrections.length > 0 ? (successfulCorrections.length / studentCorrections.length) * 100 : 0;
        const totalSubmissions = allResponses.length;

        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'JOIN'];
        const errorKeywords = ['error', 'incorrect', 'mistake', 'wrong', 'syntax'];

        const sqlRequestsCount = studentCorrections.filter(corr =>
            corr.feedback && sqlKeywords.some(keyword => corr.feedback.toLowerCase().includes(keyword.toLowerCase()))
        ).length;
        const sqlErrorsCount = studentCorrections.filter(corr =>
            corr.feedback && errorKeywords.some(keyword => corr.feedback.toLowerCase().includes(keyword.toLowerCase()))
        ).length;

        const sqlRequestsRate = studentCorrections.length > 0 ? (sqlRequestsCount / studentCorrections.length) * 100 : 0;
        const sqlErrorsRate = studentCorrections.length > 0 ? (sqlErrorsCount / studentCorrections.length) * 100 : 0;

        const feedbackWordCount = studentCorrections.map(corr =>
            corr.feedback ? corr.feedback.split(/\s+/).length : 0
        );
        const averageFeedbackWords = feedbackWordCount.length > 0
            ? feedbackWordCount.reduce((sum, count) => sum + count, 0) / feedbackWordCount.length
            : 0;

        const topics = await Topic.find().lean();
        const progression = topics.map(topic => {
            const topicCorrections = studentCorrections.filter(corr =>
                corr.topic && corr.topic._id.toString() === topic._id.toString()
            );
            const totalScore = topicCorrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
            const average = topicCorrections.length > 0 ? totalScore / topicCorrections.length : 0;
            return {
                name: topic.title,
                moyenne: average.toFixed(2),
            };
        }).filter(item => item.moyenne > 0);

        const latestEvaluations = studentCorrections
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
            .map(corr => ({
                id: corr._id.toString(),
                nom: corr.student.name,
                typeExercice: corr.topic ? corr.topic.title : "Sans titre",
                note: corr.score || 0,
                email: corr.student.email,
            }));

        const errorTypes = {};
        studentCorrections.forEach(corr => {
            if (corr.feedback) {
                const feedbackLower = corr.feedback.toLowerCase();
                if (errorKeywords.some(keyword => feedbackLower.includes(keyword))) {
                    const errorType = feedbackLower.includes('syntax') ? "Syntaxe SQL incorrecte" :
                        feedbackLower.includes('normalisation') ? "Mauvaise normalisation" :
                            "Erreur dans le modèle conceptuel";
                    errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
                }
            }
        });
        const frequentErrors = Object.entries(errorTypes)
            .map(([typeErreur, occurrences]) => ({ typeErreur, occurrences }))
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 3);

        const studentStats = {};
        studentCorrections.forEach(corr => {
            const studentId = corr.student._id.toString();
            if (!studentStats[studentId]) {
                studentStats[studentId] = {
                    nom: corr.student.name,
                    email: corr.student.email,
                    totalScore: 0,
                    count: 0,
                };
            }
            studentStats[studentId].totalScore += corr.score || 0;
            studentStats[studentId].count += 1;
        });

        const topStudents = Object.entries(studentStats)
            .map(([id, stats], index) => ({
                numero: index + 1,
                nom: stats.nom,
                description: "Étudiant",
                moyenne: (stats.totalScore / stats.count).toFixed(1),
                statut: stats.totalScore / stats.count >= 16 ? "Excellent" :
                    stats.totalScore / stats.count >= 14 ? "Très Bien" : "Bien",
                heures: 0,
                assiduite: 0,
            }))
            .sort((a, b) => b.moyenne - a.moyenne)
            .slice(0, 8);

        const dashboardData = {
            totalStudents,
            generalAverage: generalAverage.toFixed(1),
            successRate: successRate.toFixed(2),
            totalSubmissions,
            sqlRequestsRate: sqlRequestsRate.toFixed(2),
            sqlErrorsRate: sqlErrorsRate.toFixed(2),
            averageFeedbackWords: Math.round(averageFeedbackWords),
            progression,
            latestEvaluations,
            frequentErrors,
            topStudents,
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error("Erreur dans getTeacherDashboard:", error);
        res.status(500).json({ message: error.message || "Erreur serveur. Veuillez réessayer." });
    }
};

module.exports = {
    createTopic,
    getTopic,
    downloadFile,
    generateCorrectionsForTopic,
    downloadCorrectionAsPDF,
    publishTopic,
    getTeacherDashboard,
};