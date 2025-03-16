const mongoose = require('mongoose');
const { Schema } = mongoose;

const reponseSchema = new Schema({
    title: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    file: {
        type: String
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

}, { timestamps: true });

const reponseModel = mongoose.model('Reponse', reponseSchema);
module.exports = reponseModel;

