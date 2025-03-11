import { useState, useEffect } from "react";
import { BookOpen, Calendar, Download, FileText, Search } from "lucide-react";
import { Footer } from "@/layouts/footer";
import { useTheme } from "@/hooks/use-theme";

const StudentAssignmentsPage = () => {
  const { theme } = useTheme();
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les sujets depuis l'API
  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments"); // Remplacez par votre URL d'API réelle
      if (!response.ok) throw new Error("Erreur lors du chargement des sujets");
      const data = await response.json();
      setAssignments(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Charger les sujets au montage et toutes les 10 secondes
  useEffect(() => {
    fetchAssignments(); // Chargement initial
    const interval = setInterval(fetchAssignments, 10000); // Polling toutes les 10 secondes
    return () => clearInterval(interval); // Nettoyage
  }, []);

  // Filtrer les sujets en fonction de la recherche
  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-y-4 min-h-screen">
      <h1 className="title">Mes Sujets d'Exercices</h1>

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
              placeholder="Rechercher un sujet..."
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
            <p className="text-gray-500 dark:text-gray-400">Chargement des sujets...</p>
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
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="card-header">
                  <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                    <BookOpen size={26} />
                  </div>
                  <p className="card-title">{assignment.title}</p>
                </div>
                <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {assignment.description}
                  </p>
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-x-2 text-sm">
                      <FileText size={16} className="text-blue-500 dark:text-blue-600" />
                      <span>Par: {assignment.teacher}</span>
                    </div>
                    <div className="flex items-center gap-x-2 text-sm">
                      <Calendar size={16} className="text-blue-500 dark:text-blue-600" />
                      <span>Date: {assignment.date}</span>
                    </div>
                    <div className="flex items-center gap-x-2 text-sm">
                      <Calendar size={16} className="text-red-500" />
                      <span>Échéance: {assignment.deadline}</span>
                    </div>
                  </div>
                  <a
                    href={assignment.fileUrl}
                    download
                    className="mt-4 inline-flex items-center gap-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Download size={18} />
                    Télécharger le sujet
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full card">
              <div className="card-body text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun sujet trouvé correspondant à votre recherche
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

export default StudentAssignmentsPage;