const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;
const { hashPassword } = require('../helpers/auth'); // Importer hashPassword

const userSchema = new Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
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

// Hacher le mot de passe avant de sauvegarder avec hashPassword de auth.js
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    try {
        this.password = await hashPassword(this.password); // Utiliser hashPassword (12 tours)
        next();
    } catch (err) {
        next(err); // Passer l'erreur au middleware suivant
    }
});

// Comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;