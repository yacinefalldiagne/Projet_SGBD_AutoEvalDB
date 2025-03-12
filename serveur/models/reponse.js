// reponse.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const reponseSchema = new Schema({
    libelle: {
        type: String,
        required: true
    },
    contenu: String,
    pdfFile: {
        data: Buffer, // Pour stocker le fichier PDF en binaire
        contentType: String // Pour stocker le type MIME
    },
    topic: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    utilisateur: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Si vous avez un modèle User
    }
}, { timestamps: true });

const reponseModel = mongoose.model('Reponse', reponseSchema);
module.exports = reponseModel;