// controllers/settingsController.js
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

// Récupérer les données du profil
exports.getProfile = async (req, res) => {
    try {
        const { token } = req.cookies;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                const user = await User.findById(userId).select("-password");
        // req.user est défini par le middleware passport.authenticate("jwt")
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        // Mapper preferences.notifications à notificationsEnabled pour le frontend
        const userData = {
            name: user.name,
            email: user.email,
            role: user.role,
            notificationsEnabled: user.preferences.notifications,
            darkMode: user.preferences.darkMode,
            language: user.preferences.language,
        };
        res.json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Mettre à jour les données du profil
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, notificationsEnabled } = req.body;

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== req.user.id) {
                return res.status(400).json({ message: "Cet email est déjà utilisé" });
            }
        }

        // Préparer les données à mettre à jour
        const updateData = { name, email };
        if (typeof notificationsEnabled !== "undefined") {
            updateData["preferences.notifications"] = notificationsEnabled;
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Mapper les données pour le frontend
        const userData = {
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            notificationsEnabled: updatedUser.preferences.notifications,
            darkMode: updatedUser.preferences.darkMode,
            language: updatedUser.preferences.language,
        };

        res.json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Récupérer l'utilisateur via req.user (fourni par Passport)
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifier si l'utilisateur a un mot de passe local (non-OAuth)
        if (!user.password) {
            return res.status(400).json({
                message:
                    "Impossible de changer le mot de passe. Ce compte est lié à un fournisseur OAuth (Google, GitHub, Microsoft).",
            });
        }

        // Vérifier le mot de passe actuel
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Mot de passe actuel incorrect" });
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        res.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};