import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { BookOpen, Calendar, FileText, Eye, Edit } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import ModalDialog from "@/components/ui/ModalDialog";
import Button from "@/components/ui/Button";
import image from "../../assets/images/3926922.png";

function CorrectionAuto() {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReponse, setSelectedReponse] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [feedbackEditModalOpen, setFeedbackEditModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [newScore, setNewScore] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  const BASE_URL = "http://localhost:8000";

  // Récupérer les corrections de l'étudiant
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const correctionsResponse = await axios.get(`${BASE_URL}/getCorrectionsForStudent`, { withCredentials: true });
        setCorrections(correctionsResponse.data);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        toast.error("Erreur lors de la récupération des données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour ouvrir le modal avec la réponse soumise
  const openReponseModal = (reponse) => {
    setSelectedReponse(reponse);
    setModalOpen(true);
  };

  // Fonction pour ouvrir le modal avec le feedback
  const openFeedbackModal = (feedback) => {
    setSelectedFeedback(feedback);
    setFeedbackModalOpen(true);
  };

  // Fonction pour ouvrir le modal d'ajustement de la note
  const openScoreModal = (correction) => {
    setSelectedCorrection(correction);
    setNewScore(correction.score || "");
    setScoreModalOpen(true);
  };

  // Fonction pour ouvrir le modal d'ajustement du feedback
  const openFeedbackEditModal = (correction) => {
    setSelectedCorrection(correction);
    setNewFeedback(correction.feedback || "");
    setFeedbackEditModalOpen(true);
  };

  // Fonction pour ouvrir le modal de confirmation après fermeture du modal de saisie
  const openConfirmModal = (action) => {
    setActionToConfirm(action);
    if (action === "score") {
      setScoreModalOpen(false);
    } else if (action === "feedback") {
      setFeedbackEditModalOpen(false);
    }
    setTimeout(() => setConfirmModalOpen(true), 100); // Délai de 100ms pour une transition douce
  };

  // Fonction pour confirmer l'action
  const confirmAction = async () => {
    if (actionToConfirm === "score") {
      await handleScoreAdjustmentConfirmed();
    } else if (actionToConfirm === "feedback") {
      await handleFeedbackAdjustmentConfirmed();
    }
    setConfirmModalOpen(false);
    setActionToConfirm(null);
  };

  // Fonction pour ajuster la note (appelée après confirmation)
  const handleScoreAdjustmentConfirmed = async () => {
    try {
      const response = await axios.put(
        `${BASE_URL}/corrections/${selectedCorrection._id}/score`,
        { score: newScore },
        { withCredentials: true }
      );
      setCorrections((prev) =>
        prev.map((corr) =>
          corr._id === selectedCorrection._id ? { ...corr, score: newScore } : corr
        )
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Erreur lors de l'ajustement de la note :", error);
      toast.error("Erreur lors de l'ajustement de la note. Veuillez réessayer.");
    }
  };

  // Fonction pour ajuster le feedback (appelée après confirmation)
  const handleFeedbackAdjustmentConfirmed = async () => {
    try {
      const response = await axios.put(
        `${BASE_URL}/corrections/${selectedCorrection._id}/feedback`,
        { feedback: newFeedback },
        { withCredentials: true }
      );
      setCorrections((prev) =>
        prev.map((corr) =>
          corr._id === selectedCorrection._id ? { ...corr, feedback: newFeedback } : corr
        )
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Erreur lors de l'ajustement du feedback :", error);
      toast.error("Erreur lors de l'ajustement du feedback. Veuillez réessayer.");
    }
  };

  // Fonction pour gérer le clic sur le bouton "Valider" de la note
  const handleScoreAdjustment = () => {
    openConfirmModal("score");
  };

  // Fonction pour gérer le clic sur le bouton "Valider" du feedback
  const handleFeedbackAdjustment = () => {
    openConfirmModal("feedback");
  };

  // Gestion des cas de chargement, erreur et absence de données
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <img src={image} alt="Erreur" className="w-1/5 h-auto" />
        <p className="text-red-700 dark:text-slate-300 mt-4">{error}</p>
      </div>
    );
  }

  if (corrections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <img src={image} alt="Aucune donnée" className="w-1/2 h-auto" />
        <p className="text-slate-700 dark:text-slate-300 mt-4">Aucune correction disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Vos corrections</h2>

      {/* Liste des corrections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {corrections.map((correction) => (
          <motion.div
            key={correction._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="card-header">
              <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                <BookOpen size={26} />
              </div>
              <p className="card-title">{correction.topic.title}</p>
            </div>
            <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Étudiant :</strong> {correction.student.name}
              </p>
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center gap-x-2 text-sm">
                  <Calendar size={16} className="text-blue-500 dark:text-blue-600" />
                  <span>Date de soumission : {new Date(correction.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-x-2 text-sm">
                  <FileText size={16} className="text-blue-500 dark:text-blue-600" />
                  <span>
                    Note : {correction.score !== undefined ? `${correction.score}/20` : "Non noté"}
                  </span>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Button
                    onClick={() => openReponseModal(correction.submittedText)}
                    className="w-full flex items-center justify-center gap-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md p-2 transition-colors"
                  >
                    <FileText size={16} />
                    Voir la réponse soumise
                  </Button>
                  {correction.feedback && (
                    <Button
                      onClick={() => openFeedbackModal(correction.feedback)}
                      className="w-full flex items-center justify-center gap-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md p-2 transition-colors"
                    >
                      <Eye size={16} />
                      Voir plus (Feedback)
                    </Button>
                  )}
                  <Button
                    onClick={() => openScoreModal(correction)}
                    className="w-full flex items-center justify-center gap-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md p-2 transition-colors"
                  >
                    <Edit size={16} />
                    Ajuster la note
                  </Button>
                  <Button
                    onClick={() => openFeedbackEditModal(correction)}
                    className="w-full flex items-center justify-center gap-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md p-2 transition-colors"
                  >
                    <Edit size={16} />
                    Ajuster le feedback
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal pour afficher la réponse soumise */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">📜 Réponse soumise</h2>
        {selectedReponse && (
          <div className="mt-4">
            <p className="text-gray-700">{selectedReponse}</p>
          </div>
        )}
      </Modal>

      {/* Modal pour afficher le feedback */}
      <Modal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">📝 Feedback de l'IA</h2>
        {selectedFeedback && (
          <div className="mt-4">
            <p className="text-gray-700">{selectedFeedback}</p>
          </div>
        )}
      </Modal>

      {/* Modal pour ajuster la note */}
      <Modal isOpen={scoreModalOpen} onClose={() => setScoreModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">✍️ Ajuster la note</h2>
        <div className="mt-4">
          <label className="block text-gray-700 mb-2">Nouvelle note (0-20) :</label>
          <input
            type="number"
            min="0"
            max="20"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setScoreModalOpen(false)} className="bg-gray-300 text-gray-700">
              Annuler
            </Button>
            <Button onClick={handleScoreAdjustment} className="bg-blue-500 text-white">
              Valider
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal pour ajuster le feedback */}
      <Modal isOpen={feedbackEditModalOpen} onClose={() => setFeedbackEditModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">✍️ Ajuster le feedback</h2>
        <div className="mt-4">
          <label className="block text-gray-700 mb-2">Nouveau feedback :</label>
          <textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            className="w-full p-2 border rounded"
            rows="5"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setFeedbackEditModalOpen(false)} className="bg-gray-300 text-gray-700">
              Annuler
            </Button>
            <Button onClick={handleFeedbackAdjustment} className="bg-blue-500 text-white">
              Valider
            </Button>
          </div>
        </div>
      </Modal>

      {/* ModalDialog pour confirmer l'ajustement */}
      <ModalDialog
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmAction}
        title={actionToConfirm === "score" ? "Confirmer l'ajustement de la note" : "Confirmer l'ajustement du feedback"}
        message={
          actionToConfirm === "score"
            ? `Êtes-vous sûr de vouloir modifier la note à ${newScore}/20 ? Cette action est irréversible.`
            : "Êtes-vous sûr de vouloir modifier le feedback ? Cette action est irréversible."
        }
      />
    </div>
  );
}

export default CorrectionAuto;