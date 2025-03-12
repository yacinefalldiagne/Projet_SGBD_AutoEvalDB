import { useState, useEffect } from "react";
import { Footer } from "@/layouts/footer";
import { useTheme } from "@/hooks/use-theme";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

const StudentSubmitResponsePage = () => {
  const { theme } = useTheme();
  const [assignments, setAssignments] = useState([]); // Liste des sujets
  const [selectedAssignment, setSelectedAssignment] = useState(""); // Sujet sélectionné
  const [file, setFile] = useState(null); // Fichier PDF
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false); // État pour le Drag & Drop
  const studentId = 1; // Simulé, à remplacer par l'ID réel via authentification

  // Récupérer les sujets depuis l'API
  const fetchAssignments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/assignments");
      if (!response.ok) throw new Error("Erreur lors du chargement des sujets");
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      setMessage("Erreur : " + err.message);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Gestion du Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setMessage("Veuillez déposer un fichier PDF uniquement.");
    }
  };

  // Gestion de la sélection manuelle
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setMessage("Veuillez sélectionner un fichier PDF uniquement.");
    }
  };

  // Soumission de la réponse
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !file) {
      setMessage("Veuillez sélectionner un sujet et un fichier PDF.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("student_id", studentId);
    formData.append("assignment_id", selectedAssignment);
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/submissions", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setMessage("Réponse soumise avec succès !");
        setFile(null);
        setSelectedAssignment("");
      } else {
        setMessage("Erreur lors de la soumission.");
      }
    } catch (err) {
      setMessage("Erreur serveur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-4 min-h-screen">
      <h1 className="title">Soumettre une Réponse</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="card-body space-y-6">
          {/* Sélection du sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText size={18} className="inline mr-2" />
              Sélectionner un sujet
            </label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choisir un sujet</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title} (Échéance: {assignment.deadline})
                </option>
              ))}
            </select>
          </div>

          {/* Zone Drag & Drop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Upload size={18} className="inline mr-2" />
              Charger votre réponse (PDF)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                  : "border-gray-300 dark:border-gray-700"
                }`}
            >
              {file ? (
                <p className="text-gray-700 dark:text-gray-300">
                  Fichier sélectionné : <span className="font-medium">{file.name}</span>
                </p>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400">
                    Glissez et déposez votre PDF ici
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    ou
                  </p>
                  <label className="mt-2 inline-block cursor-pointer text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                    Sélectionner un fichier
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className={`btn bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-x-2 ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              "Envoi en cours..."
            ) : (
              <>
                <Upload size={18} />
                Soumettre la réponse
              </>
            )}
          </button>

          {/* Message de feedback */}
          {message && (
            <div
              className={`flex items-center gap-x-2 p-2 rounded-lg ${message.includes("succès")
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                }`}
            >
              {message.includes("succès") ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default StudentSubmitResponsePage;