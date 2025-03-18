const User = require("../models/user");
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../helpers/auth');


// Récupérer les données du profil
exports.getProfile = async (req, res) => {
    try {
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
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

        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== userId) {
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
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

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
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        if (!user.password) {
            return res.status(400).json({
                message: "Impossible de changer le mot de passe. Ce compte est lié à un fournisseur OAuth.",
            });
        }

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mot de passe actuel incorrect" });
        }

        // Assigner le mot de passe en clair, le middleware pre("save") le hachera
        user.password = newPassword;
        await user.save();

        res.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};