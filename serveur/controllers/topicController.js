const jwt = require('jsonwebtoken');
const Topic = require('../models/topic');
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const { extractTextFromPDF } = require('../services/pdfServices');
const { generateCorrection } = require('../services/ollamaService');
const PDFDocument = require('pdfkit');

const availableModels = ['deepseek-r1:1.5b'];

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
        const user = await User.findById(userId); // Récupérer l'utilisateur pour déterminer son rôle

        // Vérifier si l'utilisateur existe
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé. Veuillez vous reconnecter." });
        }

        let topics;

        if (user.role === 'enseignant') {
            // Les enseignants voient tous leurs devoirs (brouillon et public)
            topics = await Topic.find({ teacher: userId }).populate('teacher', 'name email');
        } else if (user.role === 'etudiant') {
            // Les étudiants ne voient que les devoirs publics
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
// Publier un devoir (changer le statut de draft à public)
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
        const correction = await generateCorrection(pdfText, availableModels[0]);
        console.log('Correction générée :', correction);

        console.log('Ajout de la correction au topic...');
        topic.corrections.push(correction); // Ajouter la nouvelle correction au tableau
        await topic.save();
        console.log('Topic sauvegardé avec succès :', topic);

        res.status(200).json({ message: 'Correction générée avec succès', correction });
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

module.exports = {
    createTopic,
    getTopic,
    downloadFile,
    generateCorrectionsForTopic,
    downloadCorrectionAsPDF,
    publishTopic,
};