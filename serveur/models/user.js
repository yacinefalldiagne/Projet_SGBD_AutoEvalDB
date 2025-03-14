const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: String,
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        // Rendre le password optionnel pour les connexions OAuth
        required: function() {
            return !this.googleId && !this.githubId && !this.microsoftId;
        }
    },
    googleId: String,
    githubId: String,
    microsoftId: String,
    role: {
        type: String,
        enum: ['student', 'teacher'],
        default: 'student'
    },
    profilePicture: String,
    
    role: String,
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;