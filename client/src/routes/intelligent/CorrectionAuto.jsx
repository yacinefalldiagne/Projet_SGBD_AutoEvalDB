import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { motion } from "framer-motion";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const callDeepSeekOllama = async (input, fileContent = null) => {
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2", // Utilisez un modèle que vous avez téléchargé
          prompt: `Corrigez cet exercice : "${input || fileContent}". Fournissez une note sur 20, un feedback détaillé et une correction de référence au format JSON : {"note": number, "feedback": string, "correction": string}.`,
          stream: false,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }
  
      const data = await response.json();
      const result = JSON.parse(data.response || "{}");
      return {
        note: result.note || 10,
        feedback: result.feedback || "Feedback généré par l'IA",
        correction: result.correction || "Correction générée par l'IA",
      };
    } catch (error) {
      console.error("Erreur avec Ollama :", error);
      return {
        note: 10,
        feedback: "❌ Une erreur est survenue lors de la correction. Veuillez réessayer.",
        correction: "Correction non disponible en raison d'une erreur.",
      };
    }
  };

function CorrectionAuto() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [correction, setCorrection] = useState(""); // Correction générée par l'IA
  const [note, setNote] = useState(null); // Note attribuée par l'IA
  const [feedback, setFeedback] = useState(""); // Feedback détaillé de l'IA
  const [isEditingCorrection, setIsEditingCorrection] = useState(false); // État de l'édition de la correction

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);

    // Lecture du fichier
    const reader = new FileReader();
    reader.onload = (e) => {
      setMessages((prev) => [
        ...prev,
        { type: "file", content: e.target.result, fileName: uploadedFile.name },
      ]);
    };
    reader.readAsText(uploadedFile);
  };

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    // Ajouter le message ou fichier de l'étudiant
    if (input.trim()) {
      const newMessage = { type: "text", content: input };
      setMessages((prev) => [...prev, newMessage]);
    }
    setInput("");
    const fileContent = file ? messages.find((msg) => msg.type === "file" && msg.fileName === file.name)?.content : null;

    // Appel à DeepSeek via Ollama pour correction automatique
    const correctionResult = await callDeepSeekOllama(input, fileContent);

    // Mettre à jour les états avec les résultats de l'IA
    setNote(correctionResult.note);
    setFeedback(correctionResult.feedback);
    setCorrection(correctionResult.correction);

    // Ajouter les messages de l'IA au chat
    setMessages((prev) => [
      ...prev,
      { type: "ai", content: `✅ Correction automatique terminée ! Note : ${correctionResult.note}/20` },
      { type: "ai", content: `Feedback : ${correctionResult.feedback}` },
      { type: "ai", content: `Correction proposée : ${correctionResult.correction}` },
    ]);

    setFile(null);
  };

  const handleAdjustCorrection = () => {
    setIsEditingCorrection(true); // Permet au professeur de modifier la correction
  };

  const handleSaveCorrection = () => {
    if (correction.trim()) {
      // Envoi de la correction affinée au backend (simulation ici)
      console.log("Correction sauvegardée : ", { note, feedback, correction });
      setMessages((prev) => [
        ...prev,
        { type: "professor", content: `Correction affinée : ${correction} - Note : ${note}/20 - Feedback : ${feedback}` },
      ]);
      setIsEditingCorrection(false); // Arrêter l'édition
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 flex flex-col h-[80vh] bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Zone d'affichage du chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`p-3 max-w-lg ${msg.type === "ai" ? "bg-blue-100 ml-auto" : msg.type === "professor" ? "bg-green-100 ml-auto" : "bg-white"}`}>
              <CardContent>
                {msg.type === "file" ? (
                  <>
                    <p className="text-gray-700 font-semibold">📂 {msg.fileName}</p>
                    <pre className="bg-gray-200 p-2 rounded text-sm">{msg.content}</pre>
                  </>
                ) : (
                  <p>{msg.content}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Barre d'entrée type chat */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
        className="p-3 bg-white flex items-center border-t"
      >
        {/* Bouton fichier */}
        <label className="cursor-pointer p-2">
          <Paperclip size={24} className="text-gray-500" />
          <input type="file" accept=".txt,.sql,.pdf" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Zone de saisie */}
        <input
          type="text"
          className="flex-1 p-2 border rounded-lg mx-2 focus:ring focus:ring-blue-300"
          placeholder="Écrivez une réponse ou soumettez une requête SQL..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {/* Bouton envoyer animé */}
        <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }}>
          <Button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Send size={20} />
          </Button>
        </motion.div>
      </motion.div>

      {/* Zone pour ajuster la correction */}
      {correction && !isEditingCorrection && (
        <div className="flex justify-between p-4 bg-gray-100 border-t">
          <Button onClick={handleAdjustCorrection} className="bg-yellow-500 text-white">
            Ajuster la correction
          </Button>
          <Button onClick={handleSaveCorrection} className="bg-green-600 text-white">
            Sauvegarder la correction
          </Button>
        </div>
      )}

      {/* Zone d'édition de la correction */}
      {isEditingCorrection && (
        <div className="p-4 bg-gray-100 border-t">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Note attribuée</label>
              <input
                type="number"
                min="0"
                max="20"
                className="w-full p-2 border rounded-lg"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Feedback</label>
              <textarea
                className="w-full p-3 border rounded-lg"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correction proposée</label>
              <textarea
                className="w-full p-3 border rounded-lg"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                rows="3"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveCorrection} className="bg-green-600 text-white">
              Sauvegarder la correction
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrectionAuto;