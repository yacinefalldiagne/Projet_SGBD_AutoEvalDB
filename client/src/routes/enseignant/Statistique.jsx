import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, TrendingUp, Users, Award, GraduationCap, BookCheck, PencilLine, Trash, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from 'axios';

const Statistique = () => {
  const [theme, setTheme] = useState("light");
  const [filterTypeExercice, setFilterTypeExercice] = useState("all");
  const [filterPeriode, setFilterPeriode] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    generalAverage: 0,
    successRate: 0,
    totalSubmissions: 0,
    sqlRequestsRate: 0,
    sqlErrorsRate: 0,
    averageFeedbackWords: 0,
    progression: [],
    latestEvaluations: [],
    frequentErrors: [],
    topStudents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:8000";

  // Gestion du mode sombre
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Récupérer les données du dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getTeacherDashboard`, { withCredentials: true });
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.message : "Erreur lors du chargement des données");
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Options pour les filtres
  const typesExercice = ["all", "Requêtes SQL", "Normalisation", "Modélisation"];
  const periodes = ["all", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  const donneesFiltrees = dashboardData.progression.filter((data) =>
    filterPeriode === "all" ? true : data.name.includes(filterPeriode)
  );

  // Fonction pour gérer l'édition d'un étudiant
  const handleEditStudent = (etudiant) => {
    setSelectedStudent(etudiant);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async () => {
    try {
      console.log("Sauvegarde de:", selectedStudent);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
    }
  };

  if (loading) return <div className="text-center text-xl">Chargement...</div>;
  if (error) return <div className="text-center text-red-500 text-xl">{error}</div>;

  return (
    <div className="flex flex-col gap-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Tableau de Bord - Performances Étudiantes</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-200 dark:bg-slate-700"
          aria-label={theme === "light" ? "Passer en mode sombre" : "Passer en mode clair"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      {/* Filtres stylisés */}
      <div className="flex gap-4 mb-4">
        <div className="relative w-full">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type d'exercice</label>
          <select
            value={filterTypeExercice}
            onChange={(e) => setFilterTypeExercice(e.target.value)}
            className="appearance-none w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 shadow-sm"
          >
            {typesExercice.map((type) => (
              <option key={type} value={type}>{type === "all" ? "Tous" : type}</option>
            ))}
          </select>
          {/* Flèche personnalisée */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        <div className="relative w-full">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Période</label>
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="appearance-none w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 shadow-sm"
          >
            {periodes.map((periode) => (
              <option key={periode} value={periode}>{periode === "all" ? "Toutes" : periode}</option>
            ))}
          </select>
          {/* Flèche personnalisée */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <Users size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Étudiants</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.totalStudents}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <BookOpen size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Moyenne Générale</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.generalAverage}/20</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <Award size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taux de Réussite</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.successRate}%</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <GraduationCap size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Soumissions Totales</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.totalSubmissions}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <Award size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taux Réussite Requêtes SQL</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.sqlRequestsRate}%</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <BookCheck size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Erreurs SQL Détectées</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.sqlErrorsRate}%</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
              <PencilLine size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Feedback Moyen (mots)</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{dashboardData.averageFeedbackWords}</p>
          </div>
        </div>
      </div>

      {/* Graphique et dernières évaluations */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 col-span-1 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Évolution des Moyennes</p>
          </div>
          <div className="p-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={donneesFiltrees}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMoyenne" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "light" ? "#fff" : "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => `${value}/20`}
                />
                <XAxis
                  dataKey="name"
                  strokeWidth={0}
                  stroke={theme === "light" ? "#475569" : "#94a3b8"}
                  tickMargin={6}
                />
                <YAxis
                  dataKey="moyenne"
                  strokeWidth={0}
                  stroke={theme === "light" ? "#475569" : "#94a3b8"}
                  tickMargin={6}
                  domain={[0, 20]}
                />
                <Area
                  type="monotone"
                  dataKey="moyenne"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorMoyenne)"
                  label={{
                    fill: theme === "light" ? "#475569" : "#94a3b8",
                    fontSize: 12,
                    position: "top",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Dernières Évaluations</p>
          </div>
          <div className="h-[300px] overflow-auto p-0">
            {dashboardData.latestEvaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex items-center justify-between gap-x-4 py-2 px-4 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-x-4">
                  <div className="flex flex-col">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{evaluation.nom}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{evaluation.typeExercice}</p>
                  </div>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-50">{evaluation.note}/20</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section pour les erreurs fréquentes détectées par l'IA */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Erreurs Fréquentes Détectées par l'IA</p>
        </div>
        <div className="p-4">
          <ul className="space-y-4">
            {dashboardData.frequentErrors.map((erreur, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{erreur.typeErreur}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{erreur.occurrences} occurrences</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tableau des meilleurs étudiants */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Classement des Étudiants</p>
        </div>
        <div className="p-0">
          <div className="relative h-[500px] w-full flex-shrink-0 overflow-auto rounded-none">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">#</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Étudiant</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Moyenne</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Statut</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Assiduité</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {dashboardData.topStudents.map((etudiant) => (
                  <tr
                    key={etudiant.numero}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{etudiant.numero}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex w-max gap-x-4">
                        <div className="flex flex-col">
                          <p className="font-medium">{etudiant.nom}</p>
                          <p className="font-normal text-slate-600 dark:text-slate-400">{etudiant.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{etudiant.moyenne}/20</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${etudiant.statut === "Excellent" ? "bg-green-100 text-green-700" :
                        etudiant.statut === "Très Bien" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                        {etudiant.statut}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-x-2">
                        <BookCheck size={18} className="fill-blue-600 stroke-blue-600" />
                        {etudiant.assiduite}/5
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-x-4">
                        <button
                          className="text-blue-500 dark:text-blue-600"
                          onClick={() => handleEditStudent(etudiant)}
                          aria-label={`Modifier les informations de ${etudiant.nom}`}
                        >
                          <PencilLine size={20} />
                        </button>
                        <button
                          className="text-red-500"
                          aria-label={`Supprimer ${etudiant.nom} du classement`}
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modale pour modifier un étudiant */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {selectedStudent?.nom}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Moyenne</label>
              <input
                type="number"
                value={selectedStudent?.moyenne || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, moyenne: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Statut</label>
              <select
                value={selectedStudent?.statut || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, statut: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                <option value="Excellent">Excellent</option>
                <option value="Très Bien">Très Bien</option>
                <option value="Bien">Bien</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-md bg-gray-300 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveStudent}
              className="px-4 py-2 rounded-md bg-blue-500 text-white dark:bg-blue-600"
            >
              Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="mt-4 border-t border-slate-200 pt-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} Dashboard Académique - Tous droits réservés
      </div>
    </div>
  );
};

export default Statistique;