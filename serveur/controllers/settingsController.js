// controllers/settingsController.js
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Obtenir les données de l'utilisateur
exports.getUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // Exclure le mot de passe
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Mettre à jour les informations personnelles (nom, photo de profil)
exports.updatePersonalInfo = async (req, res) => {
    try {
        const { name } = req.body; // Utiliser "name" au lieu de "firstName" et "lastName"
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        user.name = name || user.name;

        // Gestion de la photo de profil
        if (req.file) {
            // Supprimer l'ancienne photo si elle existe et n'est pas celle par défaut
            if (user.profilePicture && user.profilePicture !== "default-avatar.png") {
                const oldImagePath = path.join(__dirname, "..", "uploads", "profile-images", user.profilePicture);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            user.profilePicture = req.file.filename;
        }

        await user.save();
        return res.status(200).json({ message: "Informations personnelles mises à jour", user });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Mettre à jour les préférences (mode sombre, notifications, langue)
exports.updatePreferences = async (req, res) => {
    try {
        const { darkMode, notifications, language } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        user.preferences.darkMode = darkMode !== undefined ? darkMode : user.preferences.darkMode;
        user.preferences.notifications = notifications !== undefined ? notifications : user.preferences.notifications;
        user.preferences.language = language || user.preferences.language;

        await user.save();
        return res.status(200).json({ message: "Préférences mises à jour", preferences: user.preferences });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifier si l'utilisateur a un mot de passe (non-OAuth)
        if (!user.password) {
            return res.status(400).json({ message: "Impossible de changer le mot de passe pour les comptes OAuth" });
        }

        // Vérifier l'ancien mot de passe
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Mot de passe actuel incorrect" });
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        return res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Supprimer le compte
exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Supprimer la photo de profil si elle existe et n'est pas celle par défaut
        if (user.profilePicture && user.profilePicture !== "default-avatar.png") {
            const imagePath = path.join(__dirname, "..", "uploads", "profile-images", user.profilePicture);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await user.deleteOne();
        // Supprimer le cookie JWT
        res.clearCookie("token");
        return res.status(200).json({ message: "Compte supprimé avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};