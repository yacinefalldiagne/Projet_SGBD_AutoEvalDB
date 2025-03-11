import { useState, useEffect } from "react";
import { Footer } from "@/layouts/footer";
import { useTheme } from "@/hooks/use-theme";
import { FileText, Download, Star, AlertCircle } from "lucide-react";

const StudentViewCorrectionsPage = () => {
  const { theme } = useTheme();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const studentId = 1; // Simulé, à remplacer par l'ID réel via authentification

  // Récupérer les corrections depuis l'API
  const fetchCorrections = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/corrections/${studentId}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des corrections");
      const data = await response.json();
      setCorrections(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  return (
    <div className="flex flex-col gap-y-4 min-h-screen">
      <h1 className="title">Consulter mes Corrections</h1>

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
          {corrections.length > 0 ? (
            corrections.map((correction) => (
              <div
                key={correction.submission_id}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="card-header">
                  <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                    <FileText size={26} />
                  </div>
                  <p className="card-title">{correction.title}</p>
                </div>
                <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {correction.description}
                  </p>
                  <div className="flex flex-col gap-y-2">
                    {/* Note */}
                    {correction.grade ? (
                      <div className="flex items-center gap-x-2 text-sm">
                        <Star size={16} className="text-yellow-500" />
                        <span>
                          Note: {correction.grade}/20
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">En attente de correction</p>
                    )}

                    {/* Feedback */}
                    {correction.feedback ? (
                      <div className="text-sm">
                        <p className="font-medium">Feedback :</p>
                        <p className="text-gray-600 dark:text-gray-400">{correction.feedback}</p>
                      </div>
                    ) : null}

                    {/* Téléchargement de la soumission */}
                    <a
                      href={correction.submission_file_url}
                      download
                      className="mt-2 inline-flex items-center gap-x-2 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Download size={16} />
                      Ma soumission
                    </a>

                    {/* Téléchargement de la correction (si disponible) */}
                    {correction.correction_file_url && (
                      <a
                        href={correction.correction_file_url}
                        download
                        className="mt-2 inline-flex items-center gap-x-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Download size={16} />
                        Correction
                      </a>
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