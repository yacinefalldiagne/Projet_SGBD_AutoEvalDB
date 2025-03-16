import React, { useEffect, useState, useCallback } from 'react';
import { BookCheck, PencilLine, Trash } from "lucide-react";
import axios from 'axios';
import image from '../../assets/images/3926922.png';

const DevoirEtudiant = () => {
    const [reponses, setReponses] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const BASE_URL = "http://localhost:8000";


    const fetchReponses = useCallback(async () => {
        try {
            const response = await axios.get(`${BASE_URL}/getReponse`);

            setReponses(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response ? err.response.data.message : "Erreur lors du chargement des réponses");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReponses();
    }, [fetchReponses]);

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <img src={image} alt="Aucun sujet trouvé" className="w-1/5 h-auto" />
                <p className="text-red-700 dark:text-slate-300 mt-4">{error}</p>
            </div>
        );
    }

    if (reponses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <img src={image} alt="Aucun sujet trouvé" className="w-1/2 h-auto" />
                <p className="text-slate-700 dark:text-slate-300 mt-4">Aucun sujet trouvé</p>
            </div>
        );
    }


    return (
        <div>
            <h1 className="text-sm font-medium text-slate-900 dark:text-slate-50">Devoirs soumis par les étudiants</h1>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                </div>
                <div className="p-0">
                    <div className="relative h-[500px] w-full flex-shrink-0 overflow-auto rounded-none">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">#</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Étudiant</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Titre</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Fichier</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Statut</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {reponses.map((reponse, index) => (
                                    <tr key={reponse._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{index + 1}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{reponse.student?.name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{reponse.title.title}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {reponse.fileUrl ? <a href={reponse.fileUrl} target="_blank" rel="noopener noreferrer">Télécharger</a> : 'Aucun fichier'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Statut ici</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-x-4">
                                                <button className="text-blue-500 dark:text-blue-600" aria-label={`Modifier ${reponse.nom}`}>
                                                    <PencilLine size={20} />
                                                </button>
                                                <button className="text-red-500" aria-label={`Supprimer ${reponse?.nom}`}>
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
        </div>
    );
}

export default DevoirEtudiant;