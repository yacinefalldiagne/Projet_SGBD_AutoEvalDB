const jwt = require('jsonwebtoken');
const Topic = require('../models/topic');
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const mongoose = require("mongoose");
const path = require('path');


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
        cb(null, 'uploads/');  // Le dossier où les fichiers seront stockés
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
    limits: { fileSize: 10 * 1024 * 1024 }, // Taille maximale de 10 Mo
}).fields([
    { name: 'file', maxCount: 1 }, // Fichier pour le sujet
    { name: 'correction', maxCount: 1 } // Fichier pour la correction
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

            // Créer un nouveau topic
            const newTopic = new Topic({
                title: title,
                description: description,
                teacher: teacherId, // Toujours utiliser l'ID de l'utilisateur connecté
                deadline: deadline ? new Date(deadline) : null,
                file: filename,
                correction: correction
            });

            // Sauvegarder dans la base de données
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

const getTopic = async (req, res) => {
    try {
        const topics = await Topic.find().populate('teacher', 'name email');

        if (!topics.length) {
            return res.status(404).json({ message: "Aucun sujet trouvé." });
        }

        const topicsWithFileUrls = topics.map((topic) => {
            const topicObj = topic.toObject();

            if (topic.file) {
                topicObj.fileUrl = `/uploads/${topic.file}`;
                topicObj.fileUrl = null;
            }

            return topicObj;
        });

        res.status(200).json(topicsWithFileUrls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Ajout d'une nouvelle fonction pour télécharger un fichier spécifique par ID
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


module.exports = {
    createTopic,
    getTopic,
    downloadFile
};

