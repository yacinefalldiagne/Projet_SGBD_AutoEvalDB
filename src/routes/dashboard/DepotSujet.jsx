import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2 } from "lucide-react";
import  Button  from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FileManager() {
  const [subjects, setSubjects] = useState([]);
  const [models, setModels] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const savedSubjects = JSON.parse(localStorage.getItem("subjects")) || [];
    const savedModels = JSON.parse(localStorage.getItem("models")) || [];
    setSubjects(savedSubjects);
    setModels(savedModels);
  }, []);

  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
    localStorage.setItem("models", JSON.stringify(models));
  }, [subjects, models]);

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "subject") {
      setSubjects((prev) => [...prev, ...files]);
    } else {
      setModels((prev) => [...prev, ...files]);
    }
  };

  const handleFileRemove = (index, type) => {
    if (type === "subject") {
      setSubjects((prev) => prev.filter((_, i) => i !== index));
    } else {
      setModels((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: e.dataTransfer.files } }, type);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestion des Fichiers</h2>
      <div className="space-y-8">
        {/* Section Upload de sujets */}
        <div>
          <Label htmlFor="subject-upload" className="block text-lg font-semibold text-gray-700 mb-2">
            Ajouter un sujet :
          </Label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-300 ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, "subject")}
          >
            <Input
              id="subject-upload"
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e, "subject")}
              className="hidden"
            />
            <label htmlFor="subject-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600 text-sm">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
              </span>
            </label>
          </div>
        </div>

        {/* Section Upload de modèles */}
        <div>
          <Label htmlFor="model-upload" className="block text-lg font-semibold text-gray-700 mb-2">
            Ajouter un modèle de correction :
          </Label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-300 ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, "model")}
          >
            <Input
              id="model-upload"
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e, "model")}
              className="hidden"
            />
            <label htmlFor="model-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600 text-sm">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
              </span>
            </label>
          </div>
        </div>

        {/* Liste des sujets */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Sujets :</h3>
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun sujet ajouté pour le moment.</p>
          ) : (
            <AnimatePresence>
              {subjects.map((file, index) => (
                <motion.div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-2 shadow-sm hover:bg-gray-200 transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleFileRemove(index, "subject")}
                    aria-label={`Supprimer ${file.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Liste des modèles */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Modèles de correction :</h3>
          {models.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun modèle ajouté pour le moment.</p>
          ) : (
            <AnimatePresence>
              {models.map((file, index) => (
                <motion.div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-2 shadow-sm hover:bg-gray-200 transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleFileRemove(index, "model")}
                    aria-label={`Supprimer ${file.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}