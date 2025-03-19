const pdf = require('pdf-parse');

const extractTextFromPDF = async (buffer) => {
    try {
        console.log('Début de l\'extraction du texte à partir du buffer');
        if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
            throw new Error('Buffer invalide ou vide');
        }
        const data = await pdf(buffer);
        // console.log('Texte extrait avec succès :', data.text);
        return data.text; // Retourne le texte extrait
    } catch (error) {
        console.error('Erreur lors de l\'extraction du texte du PDF :', error);
        throw new Error('Erreur lors de l\'extraction du texte du PDF : ' + error.message);
    }
};

module.exports = { extractTextFromPDF };