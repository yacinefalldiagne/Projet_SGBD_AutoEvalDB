// scripts/migrateUsers.js
const mongoose = require("mongoose");
const User = require("../models/user");
require("dotenv").config();

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("DB connected");

        // Récupérer tous les utilisateurs
        const users = await User.find();

        for (const user of users) {
            // Vérifier si l'utilisateur n'a ni mot de passe ni identifiant OAuth
            if (!user.password && !user.googleId && !user.githubId && !user.microsoftId) {
                // Ajouter un mot de passe par défaut pour les utilisateurs locaux
                user.password = "default_password"; // À remplacer par une logique appropriée si nécessaire
            }

            // Initialiser les préférences si elles n'existent pas
            if (!user.preferences) {
                user.preferences = {
                    darkMode: false,
                    notifications: true,
                    language: "fr",
                };
            }

            // Initialiser profilePicture si elle n'existe pas
            if (!user.profilePicture) {
                user.profilePicture = "default-avatar.png";
            }

            // Sauvegarder l'utilisateur sans déclencher la validation
            await user.save({ validateBeforeSave: false });
        }

        console.log("Migration terminée");
        mongoose.connection.close();
    })
    .catch((err) => {
        console.log("DB not connected", err);
        mongoose.connection.close();
    });