// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true }, // Restaurer le champ "name"
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        // Rendre le password optionnel pour les connexions OAuth
        required: function () {
            return !this.googleId && !this.githubId && !this.microsoftId;
        }
    },
    googleId: String,
    githubId: String,
    microsoftId: String,
    role: {
        type: String,
        enum: ['etudiant', 'enseignant'],
        default: 'etudiant'
    },
    profilePicture: { type: String, default: "default-avatar.png" },
    preferences: {
        darkMode: { type: Boolean, default: false },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: "fr" },
    },
}, { timestamps: true });

// Hacher le mot de passe avant de sauvegarder (pour les utilisateurs non-OAuth)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;