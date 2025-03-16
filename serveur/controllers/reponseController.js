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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
}).single('file');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Clé de chiffrement
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
const IV_LENGTH = 16; // Longueur de l'IV

// Fonction pour chiffrer le fichier
const encryptFile = (filePath) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const input = fs.createReadStream(filePath);
    const encryptedFilePath = filePath + '.enc'; // Nouveau nom pour le fichier chiffré
    const output = fs.createWriteStream(encryptedFilePath);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
        // Supprimer le fichier original après chiffrement
        fs.unlinkSync(filePath);
    });

    return encryptedFilePath; // Retourne le chemin du fichier chiffré
};

// Fonction pour déchiffrer le fichier
const decryptFile = (encryptedFilePath) => {
    return new Promise((resolve, reject) => {
        const iv = Buffer.from(encryptedFilePath.slice(-IV_LENGTH));
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const input = fs.createReadStream(encryptedFilePath);
        const decryptedFilePath = encryptedFilePath.replace('.enc', '');
        const output = fs.createWriteStream(decryptedFilePath);

        input.pipe(decipher).pipe(output);

        output.on('finish', () => {
            // console.log('Déchiffrement terminé pour :', decryptedFilePath);
            resolve(decryptedFilePath);
        });

        output.on('error', (error) => {
            // console.error('Erreur lors du déchiffrement :', error);
            reject(error);
        });

        input.on('error', (error) => {
            // console.error('Erreur sur le flux d\'entrée :', error);
            reject(error);
        });

        decipher.on('error', (error) => {
            console.error('Erreur sur le decipher :', error);
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
            const encryptedFilePath = encryptFile(filePath); // Chiffre le fichier
            const encryptedFilename = path.basename(encryptedFilePath); // Nom du fichier chiffré

            const studentId = student || userId;
            if (!studentId) {
                return res.status(400).json({ message: "L'identifiant de l'étudiant est requis." });
            }

            // Enregistrer la réponse dans la base de données
            const newReponse = new Reponse({
                title: title,
                student: studentId,
                file: encryptedFilename,
            });

            await newReponse.save();

            // Récupérer le sujet (topic) pour obtenir les corrections disponibles
            const topic = await Topic.findById(title);
            console.log('Sujet trouvé :', topic);
            if (!topic) {
                return res.status(400).json({ message: "Le sujet spécifié n'existe pas." });
            }
            if (!topic.corrections || topic.corrections.length === 0) {
                return res.status(400).json({ message: "Aucune correction modèle n'est disponible dans ce sujet." });
            }

            // Déchiffrer le fichier soumis pour extraire le texte
            const decryptedFilePath = await decryptFile(encryptedFilePath);
            console.log('Fichier déchiffré :', decryptedFilePath);
            const submittedText = await extractTextFromPDF(decryptedFilePath);

            // Sélectionner une correction modèle depuis topic.corrections
            const teacherCorrectionText = topic.corrections[0].correction;
            console.log('Correction modèle sélectionnée :', teacherCorrectionText);

            // Générer la correction automatique avec Ollama
            const correctionResult = await generateCorrectionStudent(submittedText, teacherCorrectionText, availableModels[0]);

            // Enregistrer la correction automatique dans la base de données
            const newCorrection = new Correction({
                reponse: newReponse._id,
                topic: title,
                student: studentId,
                submittedText: submittedText,
                correction: correctionResult.correction,
                model: correctionResult.model,
                score: correctionResult.score,
            });

            await newCorrection.save();

            res.status(201).json({
                message: 'Réponse soumise et corrigée avec succès !',
                reponse: {
                    ...newReponse._doc,
                    fileUrl: encryptedFilename ? `/uploads/${encryptedFilename}` : null,
                },
                correction: {
                    correction: correctionResult.correction,
                    score: correctionResult.score,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
        }
    });
};

// Mise à jour de la fonction `getReponse` pour inclure les corrections
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

            // Inclure la correction associée, si elle existe
            const correction = await Correction.findOne({ reponse: reponse._id });
            if (correction) {
                reponseObj.correction = {
                    correction: correction.correction,
                    score: correction.score,
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
        const userId = verifyToken(req);
        const corrections = await Correction.find({ student: userId })
            .populate('reponse')
            .populate('topic', 'title')
            .populate('student', 'name email');

        if (!corrections.length) {
            return res.status(404).json({ message: "Aucune correction trouvée pour cet étudiant." });
        }

        res.status(200).json(corrections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
    }
};

// Nouvelle fonction pour récupérer toutes les corrections (pour les enseignants)
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

module.exports = {
    createReponse,
    getReponse,
    getReponsesByStudent,
    getAssignments,
    getCorrectionsByStudent,
    getAllCorrections,
};