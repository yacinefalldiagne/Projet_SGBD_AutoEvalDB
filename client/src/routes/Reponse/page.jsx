import { useState, useEffect } from "react";
import { Footer } from "@/layouts/footer";
import { useTheme } from "@/hooks/use-theme";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

const StudentSubmitResponsePage = () => {
    const { theme } = useTheme();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const studentId = 1; // À remplacer par l'ID réel via authentification

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
            const response = await fetch("http://localhost:5000/api/submissions", {
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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center p-6">
            <div className="max-w-2xl w-full">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 flex items-center gap-x-3">
                    <FileText size={28} className="text-blue-500 dark:text-blue-400" />
                    Soumettre une Réponse
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sélection du sujet */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-x-2">
                                <FileText size={18} className="text-blue-500 dark:text-blue-400" />
                                Choisir un sujet
                            </label>
                            <select
                                value={selectedAssignment}
                                onChange={(e) => setSelectedAssignment(e.target.value)}
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            >
                                <option value="">Sélectionnez un sujet</option>
                                {assignments.map((assignment) => (
                                    <option key={assignment.id} value={assignment.id}>
                                        {assignment.title} (Échéance : {new Date(assignment.deadline).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Zone Drag & Drop */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-x-2">
                                <Upload size={18} className="text-blue-500 dark:text-blue-400" />
                                Déposer votre réponse (PDF)
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                                    isDragging
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/50"
                                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                } hover:border-blue-400 dark:hover:border-blue-500`}
                            >
                                {file ? (
                                    <div className="flex items-center justify-center gap-x-3">
                                        <FileText size={24} className="text-blue-500 dark:text-blue-400" />
                                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                                            {file.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={36} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                                            Glissez et déposez votre PDF ici
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ou</p>
                                        <label className="mt-3 inline-block cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200">
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
                            className={`w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-x-2 transition-all duration-200 ${
                                loading
                                    ? "opacity-70 cursor-not-allowed"
                                    : "hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-x-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z" className="opacity-75" />
                                    </svg>
                                    Envoi en cours...
                                </span>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Soumettre la réponse
                                </>
                            )}
                        </button>

                        {/* Message de feedback */}
                        {message && (
                            <div
                                className={`flex items-center gap-x-3 p-4 rounded-lg shadow-sm transition-all duration-300 ${
                                    message.includes("succès")
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                                }`}
                            >
                                {message.includes("succès") ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <AlertCircle size={20} />
                                )}
                                <span>{message}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default StudentSubmitResponsePage;