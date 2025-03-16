import { useState, useEffect } from "react";
import axios from "axios";

function CorrectionAuto() {
  const [corrections, setCorrections] = useState([]); // Corrections récupérées depuis le backend
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState(null); // Gestion des erreurs

  // Récupérer les corrections depuis le backend au chargement du composant
  useEffect(() => {
    const fetchCorrections = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/getStudentCorrections", {
          withCredentials: true, // Nécessaire pour envoyer les cookies (authentification JWT)
        });
        setCorrections(response.data);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des corrections :", error);
        setError("Erreur lors de la récupération des corrections. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchCorrections();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Vos corrections</h2>

      {/* Gestion du chargement et des erreurs */}
      {loading && <p className="text-gray-600">Chargement des corrections...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Tableau des corrections enregistrées */}
      {!loading && !error && (
        <div>
          {corrections.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Sujet</th>
                  <th className="p-2 border">Texte soumis</th>
                  <th className="p-2 border">Correction détaillée</th>
                  <th className="p-2 border">Note</th>
                  <th className="p-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((correction) => (
                  <tr key={correction._id} className="hover:bg-gray-100">
                    <td className="p-2 border">{correction.topic.title}</td>
                    <td className="p-2 border">{correction.submittedText}</td>
                    <td className="p-2 border">{correction.correction}</td>
                    <td className="p-2 border">{correction.score}/20</td>
                    <td className="p-2 border">{new Date(correction.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">Aucune correction enregistrée pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CorrectionAuto;