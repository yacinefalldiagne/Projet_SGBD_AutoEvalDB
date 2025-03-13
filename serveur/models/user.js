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
        required: true,
    },
    role: String,
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);

module.exports = userModel
