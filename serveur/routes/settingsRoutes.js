// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const settingsController = require("../controllers/settingsController");

// Middleware pour protéger les routes (authentification JWT)
const authMiddleware = passport.authenticate("jwt", { session: false });

// Route pour récupérer les données du profil
router.get("/api/student/profile", authMiddleware, settingsController.getProfile);

// Route pour mettre à jour les données du profil
router.put("/api/student/profile", authMiddleware, settingsController.updateProfile);

// Route pour changer le mot de passe
router.put("/api/student/password", authMiddleware, settingsController.changePassword);

module.exports = router;