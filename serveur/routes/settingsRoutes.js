// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const cors = require("cors");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
    getUserData,
    updatePersonalInfo,
    updatePreferences,
    changePassword,
    deleteAccount,
} = require("../controllers/settingsController");
const multer = require("multer");
const path = require("path");

// Middleware CORS
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Configuration de Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/profile-images");
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Routes protégées
router.get("/user", verifyToken, getUserData); // Obtenir les données de l'utilisateur
router.put("/update-personal-info", verifyToken, upload.single("profileImage"), updatePersonalInfo);
router.put("/update-preferences", verifyToken, updatePreferences);
router.put("/change-password", verifyToken, changePassword);
router.delete("/delete-account", verifyToken, deleteAccount);

module.exports = router;