const mongoose = require('mongoose');
const { Schema } = mongoose;

const correctionSchema = new Schema({
    model: {
        type: String,
        required: true,
    },
    correction: {
        type: String,
        required: true,
    },
});

const topicSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    teacher: {
        type: String,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    deadline: Date,
    file: {
        type: String,
    },
    status: {
        type: String,
        enum: ['brouillon', 'public'],
        default: 'brouillon', // Par défaut
    },
    corrections: [correctionSchema],
}, { timestamps: true });

const topicModel = mongoose.model('Topic', topicSchema);
module.exports = topicModel;