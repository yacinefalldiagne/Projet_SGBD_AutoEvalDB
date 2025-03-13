const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
} = require("../controllers/authController");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");

// Middleware CORS
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Routes publiques
router.get("/", test);
router.post("/register", registerUser);
router.post("/login", loginUser);

// Routes protégées (nécessitent d'être connecté)
router.get("/profile", getProfile)

router.post("/logout", verifyToken, logoutUser);

// Routes spécifiques aux rôles
router.get("/enseignant", verifyToken, checkRole(["enseignant"]), (req, res) => {
    res.json({ message: "Bienvenue, professeur !" });
});

router.get("/etudiant", verifyToken, checkRole(["etudiant"]), (req, res) => {
    res.json({ message: "Bienvenue, étudiant !" });
});

module.exports = router