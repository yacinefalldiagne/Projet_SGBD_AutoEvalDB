const mongoose = require('mongoose');
const { Schema } = mongoose;

const correctionSchema = new Schema({
    reponse: {
        type: Schema.Types.ObjectId,
        ref: 'Reponse',
        required: true,
    },
    topic: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
        required: true,
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedText: {
        type: String,
        required: true,
    },
    correction: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        min: 0,
        max: 20,
    },
    feedback: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Correction', correctionSchema);