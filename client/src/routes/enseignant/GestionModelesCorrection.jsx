import { useState, useCallback, useEffect } from "react";
import { Paperclip, Trash2, CirclePlus, Eye, BookOpen, Calendar, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import ModalDialog from "@/components/ui/ModalDialog"; // Importer le nouveau composant
import axios from "axios";
import { toast } from "react-hot-toast";

function GestionModelesCorrection() {
    const [modeles, setModeles] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [topicToPublish, setTopicToPublish] = useState(null);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [corrections, setCorrections] = useState([]);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedCorrectionIndex, setSelectedCorrectionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingAssignments, setFetchingAssignments] = useState(true);
    const [error, setError] = useState(null);
    const [generationCompleted, setGenerationCompleted] = useState(false);
    const BASE_URL = "http://localhost:8000";

    const fetchAssignments = useCallback(async () => {
        try {
            setFetchingAssignments(true);
            const response = await axios.get(`${BASE_URL}/getTopic`, { withCredentials: true });
            setAssignments(response.data);
        } catch (err) {
            console.error("Erreur lors du chargement des sujets", err);
            setError("Erreur lors du chargement des sujets : " + err.message);
        } finally {
            setFetchingAssignments(false);
        }
    }, []);

    useEffect(() => {
        fetchAssignments();
        const interval = setInterval(fetchAssignments, 10000);
        return () => clearInterval(interval);
    }, [fetchAssignments]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const newModele = {
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleString(),
        };
        setModeles((prev) => [...prev, newModele]);
    };

    const handleDelete = (id) => {
        setModeles((prev) => prev.filter((modele) => modele.id !== id));
    };

    const handleGenerateCorrections = async (topicId) => {
        setLoading(true);
        setError(null);
        setCorrections([]);
        setGenerationCompleted(false);

        try {
            const response = await axios.post(`${BASE_URL}/generateCorrections/${topicId}`, {}, {
                withCredentials: true,
            });
            setCorrections([response.data.correction]);
            setGenerationCompleted(true);
        } catch (error) {
            setError('Erreur lors de la génération de la correction : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCorrectionPDF = async (topicId, index = 0) => {
        try {
            setLoading(true);
            setError(null);
            setSelectedTopicId(topicId);
            setSelectedCorrectionIndex(index);

            const response = await axios.get(`${BASE_URL}/downloadCorrectionPDF/${topicId}?correctionIndex=${index}`, {
                withCredentials: true,
                responseType: 'blob',
            });

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

            setPdfModalOpen(true);
        } catch (error) {
            console.error('Erreur lors de la récupération du PDF :', error);
            setError('Erreur lors de la récupération du PDF : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCorrectionPDF = (topicId) => {
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.setAttribute('download', `correction_${topicId}_${selectedCorrectionIndex}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const openModalForCorrections = (topicId) => {
        setSelectedTopicId(topicId);
        setModalOpen(true);
        handleGenerateCorrections(topicId);
    };

    const openModalForViewing = (topicId) => {
        handleViewCorrectionPDF(topicId, 0);
    };

    const handlePublishTopic = (topicId) => {
        setTopicToPublish(topicId);
        setConfirmModalOpen(true);
    };

    const confirmPublish = async () => {
        try {
            setLoading(true);
            setError(null);
            await axios.post(`${BASE_URL}/publishTopic/${topicToPublish}`, {}, { withCredentials: true });
            toast.success("Devoir publié avec succès !");
            fetchAssignments();
            setConfirmModalOpen(false);
            setTopicToPublish(null);
        } catch (error) {
            console.error('Erreur lors de la publication du devoir :', error);
            setError('Erreur lors de la publication du devoir : ' + (error.response?.data?.message || error.message));
            setConfirmModalOpen(false); // Ferme la modale même en cas d'erreur
        } finally {
            setLoading(false);
        }
    };

    const closePdfModal = () => {
        setPdfModalOpen(false);
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    return (
        <div>
            <h1 className="text-lg font-bold text-center text-slate-900 dark:text-slate-50">Modèles de correction</h1>
            <div className="rounded-lg border shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                <div className="p-4">
                    {fetchingAssignments ? (
                        <div className="card col-span-full">
                            <div className="card-body text-center">
                                <p className="text-gray-500 dark:text-gray-400">Chargement des sujets...</p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="card col-span-full">
                            <div className="card-body text-center">
                                <p className="text-gray-500 dark:text-gray-400">Traitement en cours...</p>
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
                            {assignments.length > 0 ? (
                                assignments.map((assignment) => (
                                    <div
                                        key={assignment?._id || assignment?.id}
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
                                                    <Calendar size={16} className="text-blue-500 dark:text-blue-600" />
                                                    <span>Date d'ajout: {new Date(assignment.date).toLocaleDateString()}</span>
                                                </div>
                                                {assignment.deadline && (
                                                    <div className="flex items-center gap-x-2 text-sm">
                                                        <Calendar size={16} className="text-red-500" />
                                                        <span>Date échéance: {new Date(assignment.deadline).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-x-2 text-sm">
                                                    <FileText size={16} className="text-blue-500 dark:text-blue-600" />
                                                    <span>
                                                        Fichier :{' '}
                                                        {assignment.fileUrl ? (
                                                            <a
                                                                href={`${BASE_URL}${assignment.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:underline"
                                                            >
                                                                Consulter
                                                            </a>
                                                        ) : (
                                                            'Aucun fichier'
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-x-2 text-sm">
                                                    <span>Statut : {assignment.status === 'brouillon' ? 'Brouillon' : 'Publié'}</span>
                                                </div>
                                            </div>

                                            {/* Boutons pour les corrections */}
                                            {assignment.status === 'brouillon' && (
                                                <>
                                                    <button
                                                        className="mt-4 inline-flex items-center gap-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                        onClick={() => handlePublishTopic(assignment._id)}
                                                    >
                                                        Publier le devoir
                                                    </button>
                                                    <button
                                                        className="mt-1 inline-flex items-center gap-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                        onClick={() => openModalForCorrections(assignment._id)}
                                                    >
                                                        Générer des corrections
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="mt-1 inline-flex items-center gap-x-2 px-4 py-2 bg-stone-500 text-white rounded-lg hover:bg-stone-600 transition-colors"
                                                onClick={() => openModalForViewing(assignment._id)}
                                            >
                                                Consulter les corrections
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full card">
                                    <div className="card-body text-center">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Aucun devoir trouvé.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal pour générer la correction */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <h2 className="text-xl font-bold mb-4">📑 Gestion des Modèles de Correction</h2>
                {/* <div className="border p-4 rounded-lg bg-gray-100">
                    <label className="cursor-pointer flex items-center space-x-2">
                        <Paperclip size={24} className="text-gray-500" />
                        <span className="text-gray-600">Ajouter un modèle</span>
                        <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div> */}
                <div className="mt-6 space-y-4">
                    {loading && <p className="text-gray-500 text-center">Génération de la correction en cours... <br /> Cela pourrait prendre un peu de temps. </p>}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {generationCompleted && !loading && !error && (
                        <p className="text-green-500 text-center">Génération terminée</p>
                    )}
                    {!generationCompleted && corrections.length === 0 && !loading && !error && (
                        <p className="text-gray-500 text-center">Aucune correction générée.</p>
                    )}
                    {!generationCompleted && corrections.map((corr, index) => (
                        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <Card className="flex justify-between items-center p-4 bg-gray-50">
                                <CardContent>
                                    <p className="text-gray-700 font-semibold">📄 Modèle : {corr.model}</p>
                                    <p className="text-sm text-gray-500">Correction : {corr.correction}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                    {modeles.map((modele) => (
                        <motion.div key={modele.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <Card className="flex justify-between items-center p-4 bg-gray-50">
                                <CardContent>
                                    <p className="text-gray-700 font-semibold">📄 {modele.name}</p>
                                    <p className="text-sm text-gray-500">Ajouté le : {modele.date}</p>
                                </CardContent>
                                <Button onClick={() => handleDelete(modele.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={20} />
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </Modal>

            {/* Modal pour afficher le PDF avec dropdown */}
            <Modal isOpen={pdfModalOpen} onClose={closePdfModal}>
                <h2 className="text-xl font-bold mb-4">📜 Correction au format PDF</h2>
                {loading && <p className="text-gray-500 text-center">Chargement du PDF en cours...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {pdfUrl && !loading && !error && (
                    <div className="mt-4">
                        <div className="mb-4">
                            <label htmlFor="correctionSelect" className="block text-sm font-medium text-gray-700">Choisir une correction :</label>
                            <select
                                id="correctionSelect"
                                value={selectedCorrectionIndex}
                                onChange={(e) => handleViewCorrectionPDF(selectedTopicId, parseInt(e.target.value, 10))}
                                className="mt-1 block w-full p-2 border rounded-md"
                            >
                                {assignments
                                    .find((assignment) => assignment._id === selectedTopicId)?.corrections
                                    ?.map((_, index) => (
                                        <option key={index} value={index}>
                                            Correction {index + 1}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <iframe
                            src={pdfUrl}
                            width="100%"
                            height="500px"
                            title="Correction PDF"
                            className="border rounded-lg"
                        />
                        <div className="mt-4 flex justify-center">
                            <Button
                                onClick={() => handleDownloadCorrectionPDF(selectedTopicId)}
                                className="bg-blue-500 text-white hover:bg-blue-600"
                            >
                                Télécharger la correction
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ModalDialog pour confirmer la publication */}
            <ModalDialog
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmPublish}
                title="Publier le devoir"
                message="Êtes-vous sûr de vouloir publier ce devoir ? Une fois publié, il sera visible par les étudiants."
            />
        </div>
    );
}

export default GestionModelesCorrection;