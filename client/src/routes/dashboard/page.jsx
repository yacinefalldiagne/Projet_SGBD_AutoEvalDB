import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { Footer } from "@/layouts/footer";
import { CreditCard, PencilLine, Star, Trash, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

const DashboardPage = () => {
    const { theme } = useTheme();
    const [studentData, setStudentData] = useState({
        name: "",
        averageGrade: 0,
        submissions: [],
        progression: [],
        classAverage: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const BASE_URL = "http://localhost:8000";

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${BASE_URL}/dashboard`, {
                    withCredentials: true, // Envoie le cookie JWT
                });
                setStudentData(response.data);
                setLastUpdated(new Date().toLocaleTimeString());
                setError(null);
            } catch (err) {
                console.error("Erreur lors du chargement des données:", err);
                setError(err.response ? err.response.data.message : "Impossible de charger les données. Veuillez réessayer plus tard.");
            } finally {
                setLoading(false);
            }
        };
        fetchStudentData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-xl text-slate-900 dark:text-slate-50">Chargement des données...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-xl text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex justify-between items-center">
                <h1 className="title">Dashboard Étudiant - {studentData.name}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Dernière mise à jour : {lastUpdated}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <Star size={26} />
                        </div>
                        <p className="card-title">Note Moyenne</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                            {parseFloat(studentData.averageGrade).toFixed(1)}/20
                        </p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            {studentData.averageGrade > 15 ? "Excellent" : "Stable"}
                        </span>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <CreditCard size={26} />
                        </div>
                        <p className="card-title">Exercices Soumis</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                            {studentData.submissions.length}
                        </p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            {studentData.submissions.length > 5 ? "Actif" : "Modéré"}
                        </span>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <Users size={26} />
                        </div>
                        <p className="card-title">Moyenne Classe</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                            {parseFloat(studentData.classAverage).toFixed(1)}/20
                        </p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            Référence
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="card col-span-1 md:col-span-2 lg:col-span-4">
                    <div className="card-header">
                        <p className="card-title">Progression des Performances</p>
                    </div>
                    <div className="card-body p-0">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={studentData.progression}
                                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                            >
                                <XAxis
                                    dataKey="date"
                                    strokeWidth={0}
                                    stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                    tickMargin={6}
                                />
                                <YAxis
                                    domain={[0, 20]}
                                    strokeWidth={0}
                                    stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                    tickFormatter={(value) => `${value}`}
                                    tickMargin={6}
                                />
                                <Tooltip
                                    cursor={false}
                                    formatter={(value) => `${value}/20`}
                                />
                                <Legend />
                                <Bar
                                    dataKey="grade"
                                    fill="#2563eb"
                                    name="Votre note"
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="classAverage"
                                    fill="#82ca9d"
                                    name="Moyenne classe"
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="card-header">
                        <p className="card-title">Dernières Soumissions</p>
                    </div>
                    <div className="card-body h-[300px] overflow-auto p-0">
                        {studentData.submissions.slice(0, 5).map((submission) => (
                            <div
                                key={submission.id}
                                className="flex items-center justify-between gap-x-4 py-2 pr-2"
                            >
                                <div className="flex flex-col gap-y-2">
                                    <p className="font-medium text-slate-900 dark:text-slate-50">
                                        {submission.exerciseName}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(submission.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <p className="font-medium text-slate-900 dark:text-slate-50">
                                    {submission.grade}/20
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <p className="card-title">Toutes les Soumissions</p>
                </div>
                <div className="card-body p-0">
                    <div className="relative h-[500px] w-full flex-shrink-0 overflow-auto rounded-none [scrollbar-width:_thin]">
                        <table className="table">
                            <thead className="table-header">
                                <tr className="table-row">
                                    <th className="table-head">#</th>
                                    <th className="table-head">Exercice</th>
                                    <th className="table-head">Date</th>
                                    <th className="table-head">Note</th>
                                    <th className="table-head">Feedback</th>
                                    <th className="table-head">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {studentData.submissions.map((submission) => (
                                    <tr key={submission.id} className="table-row">
                                        <td className="table-cell">{submission.id}</td>
                                        <td className="table-cell">{submission.exerciseName}</td>
                                        <td className="table-cell">
                                            {new Date(submission.date).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell">{submission.grade}/20</td>
                                        <td className="table-cell">{submission.feedback}</td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-x-4">
                                                <button className="text-blue-500 dark:text-blue-600">
                                                    <PencilLine size={20} />
                                                </button>
                                                <button className="text-red-500">
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

            <Footer />
        </div>
    );
};

export default DashboardPage;