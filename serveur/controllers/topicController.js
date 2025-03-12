const jwt = require('jsonwebtoken');
const Topic = require('../models/topic');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');

// Vérifier l'authentification de l'utilisateur et obtenir son ID
const verifyToken = (req) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Récupérer le token dans l'entête Authorization

    if (!token) {
        throw new Error('Token non fourni');
    }

    try {
        // Vérifier et décoder le token pour obtenir l'ID de l'utilisateur
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        throw new Error('Token invalide');
    }
};

// Configuration de multer pour les fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
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
});

// Créer un nouveau topic
const createTopic = async (req, res) => {
    try {
        // Vérifier l'utilisateur connecté via le token
        const userId = verifyToken(req); // Décoder le token pour obtenir l'ID de l'utilisateur

        // Vérifier si le professeur existe avec cet ID
        const teacher = await User.findById(userId);
        if (!teacher) {
            return res.status(404).json({ message: 'Enseignant non trouvé' });
        }

        // Vérifier si un topic avec ce titre existe déjà
        const existingTopic = await Topic.findOne({ title: req.body.title });
        if (existingTopic) {
            return res.status(400).json({ message: 'Ce titre existe déjà' });
        }

        // Créer le nouveau topic
        const topicData = {
            title: req.body.title,
            description: req.body.description,
            teacher: teacher._id, // Utiliser l'ID du professeur connecté
            deadline: req.body.deadline || null,
            fileUrl: req.file ? `/uploads/${req.file.filename}` : null
        };

        const newTopic = new Topic(topicData);
        const savedTopic = await newTopic.save();

        // Populer les données de l'enseignant si nécessaire
        const populatedTopic = await Topic.findById(savedTopic._id)
            .populate('teacher', 'name email')
            .exec();

        res.status(201).json(populatedTopic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Exporter avec les routes
module.exports = {
    createTopic,
};
