const fs = require('fs');
const pdf = require('pdf-parse');

const extractTextFromPDF = async (filePath) => {
    try {
        console.log('Début de l\'extraction du texte pour le fichier :', filePath);
        if (!fs.existsSync(filePath)) {
            throw new Error('Fichier PDF non trouvé sur le serveur');
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        // console.log('Texte extrait avec succès :', data.text);
        return data.text; // Retourne le texte extrait
    } catch (error) {
        console.error('Erreur lors de l\'extraction du texte du PDF :', error);
        throw new Error('Erreur lors de l\'extraction du texte du PDF : ' + error.message);
    }
};

module.exports = { extractTextFromPDF };