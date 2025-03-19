const jwt = require('jsonwebtoken');
const Topic = require('../models/topic');
const User = require('../models/user');
const Correction = require('../models/correction');
const Reponse = require('../models/reponse');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const { extractTextFromPDF } = require('../services/pdfServices');
const { generateCorrection } = require('../services/ollamaService');
const PDFDocument = require('pdfkit');
const axios = require('axios');

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
    limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'correction', maxCount: 1 }
]);

// Créer un nouveau topic
const createTopic = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const userId = verifyToken(req);
            const { title, description, teacher, deadline } = req.body;
            const filename = req.files?.file ? req.files.file[0].filename : undefined;
            const correction = req.files?.correction ? req.files.correction[0].filename : undefined;

            const teacherId = teacher || userId;

            const newTopic = new Topic({
                title: title,
                description: description,
                teacher: teacherId,
                deadline: deadline ? new Date(deadline) : null,
                file: filename,
                correction: correction
            });

            await newTopic.save();

            res.status(201).json({
                message: 'Sujet créé avec succès !',
                topic: {
                    ...newTopic._doc,
                    fileUrl: filename ? `/uploads/${filename}` : null
                }
            });
        } catch (error) {
            console.error(error);
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

        // Vérifier si l'utilisateur existe
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

        const topicsWithFileUrls = topics.map((topic) => {
            const topicObj = topic.toObject();
            if (topic.file) {
                topicObj.fileUrl = `/uploads/${topic.file}`;
            }
            return topicObj;
        });

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

        // Vérifier que l'utilisateur est le propriétaire du devoir
        if (topic.teacher.toString() !== userId) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à publier ce devoir." });
        }

        // Vérifier que le devoir est en brouillon
        if (topic.status === 'public') {
            return res.status(400).json({ message: "Ce devoir est déjà publié." });
        }

        // Mettre à jour le statut
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

        const filePath = path.join(__dirname, '../uploads', topic.file);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Fichier non trouvé sur le serveur" });
        }

        const extname = path.extname(topic.file).toLowerCase();
        let contentType = 'application/octet-stream';

        if (extname === '.pdf') contentType = 'application/pdf';
        else if (extname === '.doc') contentType = 'application/msword';
        else if (extname === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${topic.file}"`);

        const fileStream = fs.createReadStream(filePath);
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
        console.log('Topic ID reçu :', topicId);

        const topic = await Topic.findById(topicId);
        console.log('Topic trouvé :', topic);
        if (!topic || !topic.file) {
            return res.status(404).json({ message: 'Topic ou fichier non trouvé' });
        }

        const filePath = path.join(__dirname, '../uploads', topic.file);
        console.log('Chemin du fichier :', filePath);

        console.log('Début de l\'extraction du texte...');
        const pdfText = await extractTextFromPDF(filePath);

        console.log('Début de la génération de la correction...');
        const correctionResult = await generateCorrection(pdfText, availableModels[0]);
        console.log('Correction générée :', correctionResult);

        console.log('Ajout de la correction au topic...');
        topic.corrections.push({
            model: correctionResult.model,
            correction: correctionResult.correction,
            score: correctionResult.score, // Ajouter la note au modèle
        });
        await topic.save();
        console.log('Topic sauvegardé avec succès :', topic);

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
        const { correctionIndex } = req.query; // Index de la correction à télécharger (optionnel)

        const topic = await Topic.findById(topicId);
        if (!topic || !topic.corrections || topic.corrections.length === 0) {
            return res.status(404).json({ message: 'Aucune correction trouvée pour ce sujet' });
        }

        // Par défaut, prendre la dernière correction si aucun index n'est spécifié
        const index = correctionIndex ? parseInt(correctionIndex, 10) : topic.corrections.length - 1;
        if (isNaN(index) || index < 0 || index >= topic.corrections.length) {
            return res.status(400).json({ message: 'Index de correction invalide' });
        }

        const correction = topic.corrections[index];

        // Créer un nouveau document PDF
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, '../uploads', `correction_${topicId}_${index}.pdf`);

        doc.pipe(fs.createWriteStream(pdfPath));

        // Ajouter du contenu au PDF
        doc.fontSize(16).text(`Correction pour le sujet : ${topic.title}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Modèle utilisé : ${correction.model}`);
        doc.moveDown();
        doc.text(`Correction #${index + 1} :`);
        doc.text(correction.correction, { align: 'left' });

        doc.end();

        // Attendre que le fichier soit écrit
        await new Promise((resolve) => doc.on('end', resolve));

        // Servir le fichier PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="correction_${topicId}_${index}.pdf"`);

        const fileStream = fs.createReadStream(pdfPath);
        fileStream.pipe(res);

        // Supprimer le fichier temporaire après envoi
        fileStream.on('end', () => fs.unlinkSync(pdfPath));
    } catch (error) {
        console.error('Erreur dans downloadCorrectionAsPDF :', error);
        res.status(500).json({ message: 'Erreur lors de la génération du PDF : ' + error.message });
    }
};

const getTeacherDashboard = async (req, res) => {
    try {


        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (!user || user.role !== 'enseignant') {
            return res.status(403).json({ message: "Seuls les enseignants peuvent accéder à ce tableau de bord." });
        }

        // 1. Total des étudiants
        const totalStudents = await User.countDocuments({ role: 'etudiant' });

        // 2. Toutes les corrections et réponses
        const allCorrections = await Correction.find()
            .populate('student', 'name email role')
            .populate('topic', 'title')
            .lean();
        const allResponses = await Reponse.find()
            .populate('student', 'name email')
            .populate('title', 'title')
            .lean();

        const studentCorrections = allCorrections.filter(corr => corr.student && corr.student.role === 'etudiant');

        // 3. Moyenne générale
        const totalScore = studentCorrections.reduce((sum, corr) => sum + (corr.score || 0), 0);
        const generalAverage = studentCorrections.length > 0 ? totalScore / studentCorrections.length : 0;

        // 4. Taux de réussite (notes > 10)
        const successfulCorrections = studentCorrections.filter(corr => corr.score > 10);
        const successRate = studentCorrections.length > 0 ? (successfulCorrections.length / studentCorrections.length) * 100 : 0;

        // 5. Nombre de soumissions totales
        const totalSubmissions = allResponses.length;

        // 6. Taux de requêtes SQL et erreurs SQL dans le feedback
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

        // 7. Feedback moyen (nombre de mots)
        const feedbackWordCount = studentCorrections.map(corr =>
            corr.feedback ? corr.feedback.split(/\s+/).length : 0
        );
        const averageFeedbackWords = feedbackWordCount.length > 0
            ? feedbackWordCount.reduce((sum, count) => sum + count, 0) / feedbackWordCount.length
            : 0;

        // 8. Évolution des moyennes par devoir soumis
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

        // 9. Dernières évaluations (10 dernières corrections)
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

        // 10. Erreurs fréquentes détectées par l'IA
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

        // 11. Classement des étudiants
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
                description: "Étudiant", // À adapter si vous avez des groupes ou types
                moyenne: (stats.totalScore / stats.count).toFixed(1),
                statut: stats.totalScore / stats.count >= 16 ? "Excellent" :
                    stats.totalScore / stats.count >= 14 ? "Très Bien" : "Bien",
                heures: 0, // À calculer si vous avez des données d'assiduité
                assiduite: 0, // À calculer si vous avez des données
            }))
            .sort((a, b) => b.moyenne - a.moyenne)
            .slice(0, 8);

        // Réponse finale
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