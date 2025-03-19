import React, { useEffect, useState, useCallback } from 'react';
import { BookCheck, PencilLine, Trash, Eye } from "lucide-react";
import axios from 'axios';
import image from '../../assets/images/3926922.png';
import Modal from "@/components/ui/Modal";

const DevoirEtudiant = () => {
    const [reponses, setReponses] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [correctionMessages, setCorrectionMessages] = useState({});
    const [selectedReponse, setSelectedReponse] = useState(null); // Pour le modal de détails
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal de détails
    const [fileModalOpen, setFileModalOpen] = useState(false); // Modal pour consulter le fichier
    const [fileUrl, setFileUrl] = useState(null); // URL du fichier à consulter
    const [selectedReponses, setSelectedReponses] = useState([]); // État pour suivre les réponses sélectionnées
    const [selectAll, setSelectAll] = useState(false); // État pour la case "Tout sélectionner"

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
            fetchReponses();
        } catch (error) {
            console.error("Erreur lors de la génération de la correction :", error);
            setCorrectionMessages((prev) => ({
                ...prev,
                [reponseId]: "Erreur lors de la génération de la correction. Veuillez réessayer.",
            }));
        }
    };

    const handleGenerateAllCorrections = async () => {
        const reponsesToCorrect = reponses.filter((reponse) =>
            selectedReponses.includes(reponse._id) && !reponse.correction
        );

        if (reponsesToCorrect.length === 0) {
            alert("Aucune réponse sélectionnée ou toutes les réponses sont déjà corrigées.");
            return;
        }

        try {
            for (const reponse of reponsesToCorrect) {
                await handleGenerateCorrection(reponse._id);
            }
            setSelectedReponses([]); // Réinitialiser la sélection après correction
            setSelectAll(false);
        } catch (error) {
            console.error("Erreur lors de la correction en masse :", error);
        }
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        if (isChecked) {
            setSelectedReponses(reponses.filter(r => !r.correction).map(r => r._id));
        } else {
            setSelectedReponses([]);
        }
    };

    const handleSelectReponse = (reponseId) => {
        setSelectedReponses((prev) => {
            if (prev.includes(reponseId)) {
                return prev.filter((id) => id !== reponseId);
            } else {
                return [...prev, reponseId];
            }
        });
    };

    const handleOpenModal = (reponse) => {
        setSelectedReponse(reponse);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedReponse(null);
    };

    const handleViewFile = (fileUrl) => {
        setFileUrl(`${BASE_URL}${fileUrl}`); // Préfixer avec BASE_URL
        setFileModalOpen(true);
    };

    const handleCloseFileModal = () => {
        setFileModalOpen(false);
        if (fileUrl) {
            window.URL.revokeObjectURL(fileUrl); // Nettoyage si nécessaire
            setFileUrl(null);
        }
    };

    if (loading) return <div>Chargement...</div>;

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
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-sm font-medium text-slate-900 dark:text-slate-50">Devoirs soumis par les étudiants</h1>
                <div className="flex items-center gap-x-4">
                    <label className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="mr-2"
                        />
                        Tout sélectionner
                    </label>
                    <button
                        onClick={handleGenerateAllCorrections}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                        disabled={selectedReponses.length === 0}
                    >
                        Corriger tout
                    </button>
                </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                <div className="p-0">
                    <div className="relative h-[500px] w-full flex-shrink-0 overflow-auto rounded-none">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
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
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedReponses.includes(reponse._id)}
                                                onChange={() => handleSelectReponse(reponse._id)}
                                                disabled={reponse.correction} // Désactiver si déjà corrigé
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{index + 1}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{reponse.student?.name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{reponse.title.title}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {reponse.fileUrl ? (
                                                <button
                                                    onClick={() => handleViewFile(reponse.fileUrl)}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Consulter
                                                </button>
                                            ) : (
                                                'Aucun fichier'
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            {reponse.correction ? 'Corrigé' : 'En attente de correction'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-x-4">
                                                <button
                                                    onClick={() => handleGenerateCorrection(reponse._id)}
                                                    className={`${reponse.correction ? "text-gray-400 cursor-not-allowed" : "text-green-500 dark:text-green-600 hover:text-green-700"}`}
                                                    aria-label={`Générer la correction pour ${reponse.student?.name}`}
                                                    disabled={reponse.correction}
                                                >
                                                    <BookCheck size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(reponse)}
                                                    className="text-blue-500 dark:text-blue-600 hover:text-blue-700"
                                                    aria-label={`Modifier ${reponse.student?.name}`}
                                                >
                                                    <PencilLine size={20} />
                                                </button>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    aria-label={`Supprimer ${reponse.student?.name}`}
                                                >
                                                    <Trash size={20} />
                                                </button>
                                            </div>
                                            {correctionMessages[reponse._id] && (
                                                <p
                                                    className={`mt-2 text-sm ${correctionMessages[reponse._id].includes("Erreur") ? "text-red-600" : "text-green-600"}`}
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

            {/* Modal pour afficher les détails de la réponse */}
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
                                <strong>Fichier :</strong>
                                <button
                                    onClick={() => handleViewFile(selectedReponse.fileUrl)}
                                    className="text-blue-500 hover:underline"
                                >
                                    Consulter
                                </button>
                            </p>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal pour consulter le fichier */}
            <Modal
                isOpen={fileModalOpen}
                onClose={handleCloseFileModal}
                title="Consultation du fichier soumis"
            >
                {fileUrl ? (
                    <div className="mt-4">
                        <iframe
                            src={fileUrl}
                            width="100%"
                            height="500px"
                            title="Fichier soumis"
                            className="border rounded-lg"
                        />
                    </div>
                ) : (
                    <p className="text-gray-500 text-center">Aucun fichier à afficher.</p>
                )}
            </Modal>
        </div>
    );
}

export default DevoirEtudiant;