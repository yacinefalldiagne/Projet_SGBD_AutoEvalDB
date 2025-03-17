import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Star, Search } from "lucide-react";
import { Footer } from "@/layouts/footer";
import axios from "axios";

const StudentViewCorrectionsPage = () => {
  const [corrections, setCorrections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL de base du serveur
  const BASE_URL = "http://localhost:8000";

  // Fonction pour récupérer les corrections depuis l'API
  const fetchCorrections = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/corrections`, {
        withCredentials: true, // Envoie le cookie pour JWT
      });
      setCorrections(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.message : "Erreur lors du chargement des corrections");
      setLoading(false);
    }
  }, []);

  // Charger les corrections au montage et toutes les 10 secondes
  useEffect(() => {
    fetchCorrections();
    const interval = setInterval(fetchCorrections, 10000);
    return () => clearInterval(interval);
  }, [fetchCorrections]);

  // Filtrer les corrections en fonction de la recherche
  const filteredCorrections = corrections.filter(
    (correction) =>
      correction.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      correction.feedback?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      correction.submittedText?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour télécharger un fichier
  const downloadFile = (fileUrl, fileName) => {
    if (!fileUrl) {
      alert("Aucun fichier disponible.");
      return;
    }

    const link = document.createElement("a");
    link.href = fileUrl.startsWith("http") ? fileUrl : `${BASE_URL}${fileUrl}`;
    link.setAttribute("download", fileName || "fichier_correction");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-y-4 min-h-screen">
      <h1 className="title">Mes Corrections</h1>

      {/* Barre de recherche */}
      <div className="card">
        <div className="card-header flex items-center gap-x-4">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher une correction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Gestion des états de chargement et d'erreur */}
      {loading ? (
        <div className="card col-span-full">
          <div className="card-body text-center">
            <p className="text-gray-500 dark:text-gray-400">Chargement des corrections...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card col-span-full">
          <div className="card-body text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCorrections.length > 0 ? (
            filteredCorrections.map((correction) => (
              <div
                key={correction._id}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="card-header">
                  <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                    <FileText size={26} />
                  </div>
                  <p className="card-title">{correction.title || "Correction sans titre"}</p>
                </div>
                <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {correction.description || "Pas de description"}
                  </p>
                  <div className="flex flex-col gap-y-2">
                    {correction.score !== undefined && (
                      <div className="flex items-center gap-x-2 text-sm">
                        <Star size={16} className="text-yellow-500" />
                        <span>Note: {correction.score}/20</span>
                      </div>
                    )}
                    {correction.submittedText && (
                      <div className="text-sm">
                        <p className="font-medium">Texte soumis :</p>
                        <p className="text-gray-600 dark:text-gray-400 truncate">{correction.submittedText}</p>
                      </div>
                    )}
                    {correction.correction && (
                      <div className="text-sm">
                        <p className="font-medium">Correction :</p>
                        <p className="text-gray-600 dark:text-gray-400">{correction.correction}</p>
                      </div>
                    )}
                    {correction.feedback && (
                      <div className="text-sm">
                        <p className="font-medium">Feedback :</p>
                        <p className="text-gray-600 dark:text-gray-400">{correction.feedback}</p>
                      </div>
                    )}
                    {correction.submission_file_url && (
                      <button
                        onClick={() => downloadFile(correction.submission_file_url, `soumission_${correction.title}`)}
                        className="mt-2 inline-flex items-center gap-x-2 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <Download size={16} />
                        Ma soumission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full card">
              <div className="card-body text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune correction disponible pour le moment.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default StudentViewCorrectionsPage;