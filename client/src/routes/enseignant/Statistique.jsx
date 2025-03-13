import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, TrendingUp, Users, Award, GraduationCap, BookCheck, PencilLine, Trash, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // À adapter selon votre bibliothèque UI

const Statistique = () => {
  const [theme, setTheme] = useState("light");
  const [filterTypeExercice, setFilterTypeExercice] = useState("all");
  const [filterPeriode, setFilterPeriode] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Données simulées pour le graphique des moyennes par mois
  const donneesProgressionMoyennes = [
    { name: "Jan", moyenne: 12.4 },
    { name: "Fév", moyenne: 13.2 },
    { name: "Mar", moyenne: 12.8 },
    { name: "Avr", moyenne: 14.5 },
    { name: "Mai", moyenne: 15.2 },
    { name: "Juin", moyenne: 14.8 },
    { name: "Juil", moyenne: 16.1 },
    { name: "Août", moyenne: 15.7 },
    { name: "Sep", moyenne: 16.5 },
    { name: "Oct", moyenne: 17.3 },
    { name: "Nov", moyenne: 17.1 },
    { name: "Déc", moyenne: 17.8 },
  ];

  // Données simulées pour les dernières évaluations (spécifiques aux bases de données)
  const dernieresEvaluations = [
    { id: 1, nom: "Emma Martin", email: "emma.m@etudiant.fr", typeExercice: "Requêtes SQL", note: 17.5, image: "/api/placeholder/60/60" },
    { id: 2, nom: "Lucas Dubois", email: "lucas.d@etudiant.fr", typeExercice: "Normalisation", note: 16.0, image: "/api/placeholder/60/60" },
    { id: 3, nom: "Chloé Bernard", email: "chloe.b@etudiant.fr", typeExercice: "Modélisation", note: 18.5, image: "/api/placeholder/60/60" },
    { id: 4, nom: "Thomas Laurent", email: "thomas.l@etudiant.fr", typeExercice: "Requêtes SQL", note: 15.0, image: "/api/placeholder/60/60" },
    { id: 5, nom: "Léa Moreau", email: "lea.m@etudiant.fr", typeExercice: "Normalisation", note: 14.5, image: "/api/placeholder/60/60" },
    { id: 6, nom: "Hugo Petit", email: "hugo.p@etudiant.fr", typeExercice: "Modélisation", note: 16.5, image: "/api/placeholder/60/60" },
  ];

  // Données simulées pour le tableau des meilleurs étudiants (spécifiques aux bases de données)
  const meilleursEtudiants = [
    { numero: 1, nom: "Emma Martin", description: "Requêtes SQL - Groupe A", image: "/api/placeholder/60/60", moyenne: 18.5, statut: "Excellent", heures: 145, assiduite: 4.9 },
    { numero: 2, nom: "Lucas Dubois", description: "Normalisation - Groupe B", image: "/api/placeholder/60/60", moyenne: 17.8, statut: "Très Bien", heures: 138, assiduite: 4.7 },
    { numero: 3, nom: "Chloé Bernard", description: "Modélisation - Groupe A", image: "/api/placeholder/60/60", moyenne: 17.3, statut: "Très Bien", heures: 142, assiduite: 4.8 },
    { numero: 4, nom: "Thomas Laurent", description: "Requêtes SQL - Groupe C", image: "/api/placeholder/60/60", moyenne: 16.9, statut: "Très Bien", heures: 132, assiduite: 4.5 },
    { numero: 5, nom: "Léa Moreau", description: "Normalisation - Groupe B", image: "/api/placeholder/60/60", moyenne: 16.5, statut: "Bien", heures: 128, assiduite: 4.6 },
    { numero: 6, nom: "Hugo Petit", description: "Modélisation - Groupe B", image: "/api/placeholder/60/60", moyenne: 16.2, statut: "Bien", heures: 135, assiduite: 4.4 },
    { numero: 7, nom: "Julie Roux", description: "Requêtes SQL - Groupe A", image: "/api/placeholder/60/60", moyenne: 15.8, statut: "Bien", heures: 130, assiduite: 4.3 },
    { numero: 8, nom: "Nathan Girard", description: "Normalisation - Groupe C", image: "/api/placeholder/60/60", moyenne: 15.5, statut: "Bien", heures: 125, assiduite: 4.2 },
  ];

  // Données simulées pour les erreurs fréquentes détectées par l'IA
  const erreursFrequentes = [
    { typeErreur: "Syntaxe SQL incorrecte", occurrences: 45 },
    { typeErreur: "Mauvaise normalisation", occurrences: 30 },
    { typeErreur: "Erreur dans le modèle conceptuel", occurrences: 25 },
  ];

  // Options pour les filtres
  const typesExercice = ["all", "Requêtes SQL", "Normalisation", "Modélisation"];
  const periodes = ["all", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  // Filtrer les données du graphique
  const donneesFiltrees = donneesProgressionMoyennes.filter((data) =>
    filterPeriode === "all" ? true : data.name === filterPeriode
  );

  // Fonction pour gérer l'édition d'un étudiant
  const handleEditStudent = (etudiant) => {
    setSelectedStudent(etudiant);
    setIsModalOpen(true);
  };

  const handleSaveStudent = () => {
    // Logique pour sauvegarder les modifications (par exemple, appel API)
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-y-8">
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

      {/* Filtres */}
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type d'exercice</label>
          <select
            value={filterTypeExercice}
            onChange={(e) => setFilterTypeExercice(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            {typesExercice.map((type) => (
              <option key={type} value={type}>{type === "all" ? "Tous" : type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Période</label>
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            {periodes.map((periode) => (
              <option key={periode} value={periode}>{periode === "all" ? "Toutes" : periode}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartes statistiques spécifiques aux bases de données */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <Users size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Étudiants</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">2,154</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              8%
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <BookOpen size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Moyenne Générale</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">14.8/20</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              5%
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <Award size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taux de Réussite</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">92%</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              3%
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <GraduationCap size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Soumissions Totales</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">1,240</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              7%
            </span>
          </div>
        </div>

        {/* Nouvelle carte : Taux de réussite par type d'exercice */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <Award size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taux de Réussite (Requêtes SQL)</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">88%</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              4%
            </span>
          </div>
        </div>

        {/* Nouvelle carte : Erreurs fréquentes détectées par l'IA */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <BookCheck size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Erreurs SQL Détectées</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">45</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              10%
            </span>
          </div>
        </div>

        {/* Nouvelle carte : Feedback moyen donné par l'IA */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
              <PencilLine size={26} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Feedback Moyen (mots)</p>
          </div>
          <div className="mt-4 bg-slate-100 p-4 rounded-lg transition-colors dark:bg-slate-950">
            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">120</p>
            <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
              <TrendingUp size={18} />
              15%
            </span>
          </div>
        </div>
      </div>

      {/* Graphique et dernières évaluations */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 col-span-1 md:col-span-2 lg:col-span-4">
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

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Dernières Évaluations</p>
          </div>
          <div className="h-[300px] overflow-auto p-0">
            {dernieresEvaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex items-center justify-between gap-x-4 py-2 px-4 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-x-4">
                  <img
                    src={evaluation.image}
                    alt={evaluation.nom}
                    className="w-10 h-10 flex-shrink-0 rounded-full object-cover"
                  />
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
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Erreurs Fréquentes Détectées par l'IA</p>
        </div>
        <div className="p-4">
          <ul className="space-y-4">
            {erreursFrequentes.map((erreur, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{erreur.typeErreur}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{erreur.occurrences} occurrences</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tableau des meilleurs étudiants */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
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
                {meilleursEtudiants.map((etudiant) => (
                  <tr
                    key={etudiant.numero}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{etudiant.numero}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex w-max gap-x-4">
                        <img
                          src={etudiant.image}
                          alt={etudiant.nom}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex flex-col">
                          <p className="font-medium">{etudiant.nom}</p>
                          <p className="font-normal text-slate-600 dark:text-slate-400">{etudiant.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{etudiant.moyenne}/20</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        etudiant.statut === "Excellent" ? "bg-green-100 text-green-700" :
                        etudiant.statut === "Très Bien" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {etudiant.statut}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-x-2">
                        <BookCheck
                          size={18}
                          className="fill-blue-600 stroke-blue-600"
                        />
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