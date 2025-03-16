const axios = require('axios');

const ollamaBaseUrl = 'http://localhost:11434';

const generateCorrection = async (text, model) => {
    try {
        console.log(`Envoi de la requête à Ollama pour le modèle ${model}...`);
        const response = await axios.post(`${ollamaBaseUrl}/api/generate`, {
            model: model,
            prompt: `Corrigez le texte suivant et fournissez une explication détaillée des corrections : \n\n${text}`,
            stream: false // Désactive le streaming pour obtenir une réponse complète
        });
        // console.log(`Réponse reçue pour le modèle ${model} :`, response.data);
        return {
            model: model,
            correction: response.data.response,
        };
    } catch (error) {
        console.error(`Erreur avec le modèle ${model} :`, error.message);
        if (error.response) {
            console.error('Détails de l\'erreur Ollama :', error.response.data);
        }
        throw new Error(`Erreur lors de la génération de la correction avec ${model} : ${error.message}`);
    }
};

const generateCorrectionStudent = async (submittedText, teacherCorrection, model) => {
    try {
        console.log(`Envoi de la requête à Ollama pour le modèle ${model}...`);
        const prompt = `
        Vous êtes un correcteur automatique de devoirs. Votre tâche est de corriger le texte soumis par un étudiant en le comparant à une correction modèle fournie par l'enseignant. Fournissez une correction détaillée des erreurs et attribuez une note sur 20 en fonction de la qualité de la réponse. Structurez votre réponse comme suit :

        **Correction détaillée** : [Votre correction détaillée ici, en expliquant les erreurs et en proposant des améliorations]
        **Note** : [Une note sur 20, justifiée brièvement]

        Voici le texte soumis par l'étudiant :
        "${submittedText}"

        Voici la correction modèle fournie par l'enseignant :
        "${teacherCorrection}"
        `;

        const response = await axios.post(`${ollamaBaseUrl}/api/generate`, {
            model: model,
            prompt: prompt,
            stream: false,
        });

        const rawResponse = response.data.response;

        // Extraire la correction détaillée et la note à l'aide d'une expression régulière
        const correctionMatch = rawResponse.match(/\*\*Correction détaillée\*\* : ([\s\S]*?)\*\*Note\*\* : (\d+)/);
        if (!correctionMatch) {
            throw new Error('Réponse de l\'IA mal formatée.');
        }

        const correction = correctionMatch[1].trim();
        const score = parseInt(correctionMatch[2], 10);

        return {
            model: model,
            correction: correction,
            score: score,
        };
    } catch (error) {
        console.error(`Erreur avec le modèle ${model} :`, error.message);
        if (error.response) {
            console.error('Détails de l\'erreur Ollama :', error.response.data);
        }
        throw new Error(`Erreur lors de la génération de la correction avec ${model} : ${error.message}`);
    }
};

module.exports = { generateCorrection, generateCorrectionStudent }; // Exporter uniquement generateCorrection