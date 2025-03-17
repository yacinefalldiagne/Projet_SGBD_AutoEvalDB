const axios = require('axios');

const ollamaBaseUrl = 'http://localhost:11434';

const generateCorrection = async (text, model) => {
    try {
        console.log(`Envoi de la requête à Ollama pour le modèle ${model}...`);
        const prompt = `
        Vous êtes un correcteur automatique de devoirs de SQL. Votre tâche est de corriger le texte suivant en proposant des améliorations. Fournissez une correction simple et claire. Structurez votre réponse comme suit, en utilisant exactement ces en-têtes et en respectant cet ordre :

        [Numéro de la question]: [Réponse corrigée]        

        Voici le texte à corriger :
        "${text}"
        `;

        const response = await axios.post(`${ollamaBaseUrl}/api/generate`, {
            model: model,
            prompt: prompt,
            stream: false
        });

        return { model: model, correction: response.data.response };
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
        Vous êtes un correcteur automatique de devoirs de SQL. Votre tâche est de comparer les réponses soumises par l'étudiant avec la correction modèle fournie par l'enseignant, et de fournir une analyse. Structurez votre réponse comme suit, en utilisant exactement ces en-têtes et en respectant cet ordre :

        CORRECTION: [Une liste numérotée des réponses corrigées pour chaque question, avec une brève explication des erreurs si nécessaire]
        NOTE: [Une note sur 20 basée sur la qualité des réponses de l'étudiant par rapport au modèle]
        FEEDBACK: [Un feedback général sur les forces et faiblesses de l'étudiant, avec des suggestions d'amélioration]

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

        const ollamaResponse = response.data.response;

        // Parser la réponse pour extraire la correction, la note et le feedback
        const correctionMatch = ollamaResponse.match(/CORRECTION:(.*?)NOTE:/s);
        const noteMatch = ollamaResponse.match(/NOTE:(.*?)FEEDBACK:/s);
        const feedbackMatch = ollamaResponse.match(/FEEDBACK:(.*)$/s);

        const correction = correctionMatch ? correctionMatch[1].trim() : ollamaResponse;
        const score = noteMatch ? parseInt(noteMatch[1].trim(), 10) : 0;
        const feedback = feedbackMatch ? feedbackMatch[1].trim() : "Aucun feedback fourni.";

        return {
            model: model,
            correction: correction,
            score: score,
            feedback: feedback,
        };
    } catch (error) {
        console.error(`Erreur avec le modèle ${model} :`, error.message);
        if (error.response) {
            console.error('Détails de l\'erreur Ollama :', error.response.data);
        }
        throw new Error(`Erreur lors de la génération de la correction avec ${model} : ${error.message}`);
    }
};

module.exports = { generateCorrection, generateCorrectionStudent };