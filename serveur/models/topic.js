const mongoose = require('mongoose');
const { Schema } = mongoose;

const topicSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    deadline: Date,
    fileUrl: {
        data: Buffer,
        contentType: String
    },
}, { timestamps: true });

const topicModel = mongoose.model('Topic', topicSchema);
module.exports = topicModel;

