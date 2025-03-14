const jwt = require('jsonwebtoken');
const Reponse = require('../models/reponse');
const User = require('../models/user');
const Topic = require('../models/topic');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

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
                return res.status(400).json({ message: "L'identifiant de l'etudiant est requis." });
            }

            const newReponse = new Reponse({
                title: title,
                student: studentId,
                file: encryptedFilename
            });

            await newReponse.save();

            res.status(201).json({
                message: 'Sujet créé avec succès !',
                reponse: {
                    ...newReponse._doc,
                    fileUrl: encryptedFilename ? `/uploads/${encryptedFilename}` : null
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message || 'Erreur serveur. Veuillez réessayer.' });
        }
    });
};
// Fonction pour déchiffrer le fichier
const decryptFile = (encryptedFilePath) => {
    const iv = Buffer.from(encryptedFilePath.slice(-IV_LENGTH)); // Récupère l'IV depuis le nom du fichier
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const input = fs.createReadStream(encryptedFilePath);
    const decryptedFilePath = encryptedFilePath.replace('.enc', ''); // Nom du fichier déchiffré
    const output = fs.createWriteStream(decryptedFilePath);

    input.pipe(decipher).pipe(output);

    return decryptedFilePath;
};

// Mise à jour de la fonction `getReponse` pour déchiffrer le fichier avant de le servir
const getReponse = async (req, res) => {
    try {
        const reponses = await Reponse.find().populate('student', 'name email');

        if (!reponses.length) {
            return res.status(404).json({ message: "Aucun sujet trouvé." });
        }

        const reponsesWithFileUrls = reponses.map((reponse) => {
            const reponseObj = reponse.toObject();

            if (reponse.file) {
                const encryptedFilePath = path.join('uploads', reponse.file);
                const decryptedFilePath = decryptFile(encryptedFilePath); // Déchiffre le fichier
                reponseObj.fileUrl = decryptedFilePath ? `/uploads/${path.basename(decryptedFilePath)}` : null;
            } else {
                reponseObj.fileUrl = null;
            }

            return reponseObj;
        });

        res.status(200).json(reponsesWithFileUrls);
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


module.exports = {
    createReponse,
    getReponse,
    getAssignments,
};
