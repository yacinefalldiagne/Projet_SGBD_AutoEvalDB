import { useState } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";

function GestionModelesCorrection() {
    const [modeles, setModeles] = useState([]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const newModele = {
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleString()
        };

        setModeles((prev) => [...prev, newModele]);
    };

    const handleDelete = (id) => {
        setModeles((prev) => prev.filter((modele) => modele.id !== id));
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                📑 Gestion des Modèles de Correction
            </h1>

            {/* Upload de fichier */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-100">
                <label className="cursor-pointer flex items-center space-x-2">
                    <Paperclip size={24} className="text-gray-500" />
                    <span className="text-gray-600">Ajouter un modèle</span>
                    <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>

            {/* Liste des modèles */}
            <div className="mt-6 space-y-4">
                {modeles.length === 0 ? (
                    <p className="text-gray-500 text-center">Aucun modèle ajouté.</p>
                ) : (
                    modeles.map((modele) => (
                        <motion.div
                            key={modele.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="flex justify-between items-center p-4 bg-gray-50">
                                <CardContent>
                                    <p className="text-gray-700 font-semibold">📄 {modele.name}</p>
                                    <p className="text-sm text-gray-500">Ajouté le : {modele.date}</p>
                                </CardContent>
                                <Button onClick={() => handleDelete(modele.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={20} />
                                </Button>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

export default GestionModelesCorrection;
