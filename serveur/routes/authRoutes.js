const express = require("express");
const router = express.Router();
const cors = require("cors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { test, registerUser, loginUser, getProfile, logoutUser } = require("../controllers/authController");

// middleware
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Routes classiques
router.get("/", test);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getProfile);
router.post("/logout", logoutUser);

// Routes OAuth Google
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
        // Création du token JWT
        const token = jwt.sign(
            { email: req.user.email, id: req.user._id, name: req.user.name },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        // Définir le cookie
        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
        // Rediriger vers la page d'accueil du client
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
);

// Routes OAuth GitHub
router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
        // Création du token JWT
        const token = jwt.sign(
            { email: req.user.email, id: req.user._id, name: req.user.name },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        // Définir le cookie
        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
        // Rediriger vers la page d'accueil du client
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
);

// Routes OAuth Microsoft
router.get("/auth/microsoft", passport.authenticate("microsoft", { scope: ["user.read"] }));
router.get(
    "/auth/microsoft/callback",
    passport.authenticate("microsoft", { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
        // Création du token JWT
        const token = jwt.sign(
            { email: req.user.email, id: req.user._id, name: req.user.name },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        // Définir le cookie
        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
        // Rediriger vers la page d'accueil du client
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
);

module.exports = router;