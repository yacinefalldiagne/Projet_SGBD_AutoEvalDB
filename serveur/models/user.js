const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: String,
    email: {
        type: String,
        trim: true,
        required: true,
        unique: 32,
    },
    password: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);

module.export = userModel
