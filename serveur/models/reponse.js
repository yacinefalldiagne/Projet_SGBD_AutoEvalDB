// reponse.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const reponseSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    file: {
        type: String
    },
    student: {
        type: String,
        ref: 'User',
        required: true
    },

}, { timestamps: true });

const reponseModel = mongoose.model('Reponse', reponseSchema);
module.exports = reponseModel;

