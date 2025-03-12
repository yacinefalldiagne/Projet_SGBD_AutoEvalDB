import { useState } from "react";

export default function ApprentissageAuto() {
    const [topic, setTopic] = useState("");
    const [suggestion, setSuggestion] = useState("");

    const handleLearn = () => {
        if (topic.trim() === "") {
            setSuggestion("⚠️ Entrez un sujet d'apprentissage.");
        } else {
            setSuggestion(`📚 Suggestion : Étudiez ${topic} en profondeur avec des exercices pratiques.`);
        }
    };

    return (
        <div className="p-5">
            <h2 className="text-xl font-bold">Apprentissage Automatique</h2>
            <input
                type="text"
                className="w-full p-2 border rounded mt-2"
                placeholder="Entrez un sujet..."
                onChange={(e) => setTopic(e.target.value)}
            />
            <button onClick={handleLearn} className="mt-2 bg-blue-500 text-white p-2 rounded">
                Apprendre
            </button>
            {suggestion && <p className="mt-4 text-gray-700">{suggestion}</p>}
        </div>
    );
}
