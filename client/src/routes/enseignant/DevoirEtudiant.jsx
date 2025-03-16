import React, { useEffect, useState, useCallback } from 'react';
import { BookCheck, PencilLine, Trash } from "lucide-react";
import axios from 'axios';
import image from '../../assets/images/3926922.png';
import Modal from "@/components/ui/Modal";

const DevoirEtudiant = () => {
    const [reponses, setReponses] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [correctionMessages, setCorrectionMessages] = useState({});
    const [selectedReponse, setSelectedReponse] = useState(null); // État pour la réponse sélectionnée
    const [isModalOpen, setIsModalOpen] = useState(false); // État pour contrôler l'ouverture du modal

    const BASE_URL = "http://localhost:8000";

    const fetchReponses = useCallback(async () => {
        try {
            const response = await axios.get(`${BASE_URL}/getReponse`, { withCredentials: true });
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

    // Fonction pour déclencher la génération de la correction
    const handleGenerateCorrection = async (reponseId) => {
        try {
            setCorrectionMessages((prev) => ({
                ...prev,
                [reponseId]: "Génération de la correction en cours...",
            }));
            const response = await axios.post(
                `${BASE_URL}/generateCorrection/${reponseId}`,
                {},
                { withCredentials: true }
            );
            setCorrectionMessages((prev) => ({
                ...prev,
                [reponseId]: `Correction générée avec succès ! Note : ${response.data.correction.score}/20`,
            }));
            // Rafraîchir les réponses pour inclure la nouvelle correction
            fetchReponses();
        } catch (error) {
            console.error("Erreur lors de la génération de la correction :", error);
            setCorrectionMessages((prev) => ({
                ...prev,
                [reponseId]: "Erreur lors de la génération de la correction. Veuillez réessayer.",
            }));
        }
    };

    // Fonction pour ouvrir le modal avec les détails de la réponse
    const handleOpenModal = (reponse) => {
        setSelectedReponse(reponse);
        setIsModalOpen(true);
    };

    // Fonction pour fermer le modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedReponse(null);
    };

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <img src={image} alt="Aucun devoir soumis" className="w-1/5 h-auto" />
                <p className="text-red-700 dark:text-slate-300 mt-4">{error}</p>
            </div>
        );
    }

    if (reponses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <img src={image} alt="Aucun devoir soumis" className="w-1/2 h-auto" />
                <p className="text-slate-700 dark:text-slate-300 mt-4">Aucun devoir soumis</p>
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
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {reponse.correction ? 'Corrigé' : 'En attente de correction'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-x-4">
                                                <button
                                                    onClick={() => handleGenerateCorrection(reponse._id)}
                                                    className="text-green-500 dark:text-green-600"
                                                    aria-label={`Générer la correction pour ${reponse.student?.name}`}
                                                    disabled={reponse.correction} // Désactiver si une correction existe déjà
                                                >
                                                    <BookCheck size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(reponse)}
                                                    className="text-blue-500 dark:text-blue-600"
                                                    aria-label={`Modifier ${reponse.student?.name}`}
                                                >
                                                    <PencilLine size={20} />
                                                </button>
                                                <button className="text-red-500" aria-label={`Supprimer ${reponse.student?.name}`}>
                                                    <Trash size={20} />
                                                </button>
                                            </div>
                                            {/* Afficher le message de feedback pour cette réponse */}
                                            {correctionMessages[reponse._id] && (
                                                <p
                                                    className={`mt-2 text-sm ${correctionMessages[reponse._id].includes("Erreur")
                                                        ? "text-red-600"
                                                        : "text-green-600"
                                                        }`}
                                                >
                                                    {correctionMessages[reponse._id]}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal pour afficher les détails de la correction */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`Détails de la réponse de ${selectedReponse?.student?.name || ''}`}
            >
                {selectedReponse && (
                    <div className="text-gray-800 dark:text-white">
                        <p><strong>Titre :</strong> {selectedReponse.title.title}</p>
                        <p><strong>Texte soumis :</strong> {selectedReponse.submittedText || 'Non disponible'}</p>
                        {selectedReponse.correction ? (
                            <>
                                <p><strong>Correction :</strong> {selectedReponse.correction.correction}</p>
                                <p><strong>Note :</strong> {selectedReponse.correction.score}/20</p>
                                <p><strong>Feedback :</strong> {selectedReponse.correction.feedback}</p>
                            </>
                        ) : (
                            <p>Correction non disponible. Veuillez générer une correction.</p>
                        )}
                        {selectedReponse.fileUrl && (
                            <p>
                                <strong>Fichier :</strong> <a href={selectedReponse.fileUrl} target="_blank" rel="noopener noreferrer">Télécharger</a>
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default DevoirEtudiant;