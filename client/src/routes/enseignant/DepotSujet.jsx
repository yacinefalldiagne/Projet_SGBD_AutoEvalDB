import { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserContext } from "@/contexts/user-context";
import { useDropzone } from "react-dropzone";
import axios from 'axios';


const FileManager = () => {

  const { user } = useContext(UserContext);
  const teacherId = user?._id;
  const [subjects, setSubjects] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teacher: '',
    deadline: '',
    file: null,
    correction: null,
  });


  // Gestion des fichiers sujet
  const onDropSubject = (acceptedFiles) => {
    setFormData((prev) => ({ ...prev, file: acceptedFiles[0] }));
    setSubjects(acceptedFiles);
  };

  // Gestion des fichiers correction
  const onDropCorrection = (acceptedFiles) => {
    setFormData((prev) => ({ ...prev, correction: acceptedFiles[0] }));
    setCorrections(acceptedFiles);
  };

  const subjectDropzone = useDropzone({
    onDrop: onDropSubject,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const correctionDropzone = useDropzone({
    onDrop: onDropCorrection,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);


    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('teacher', teacherId);
    data.append('deadline', formData.deadline);
    if (formData.file) data.append('file', formData.file);
    if (formData.correction) data.append('correction', formData.correction);

    console.log("Données envoyées:", Object.fromEntries(data.entries()));


    // Pour debug
    for (let pair of data.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const response = await axios.post('http://localhost:8000/createTopic', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (response.status === 201) {
        setSuccess("Sujet soumis avec succès !");
        setFormData({
          title: '',
          description: '',
          deadline: '',
          file: null,
          correction: null,
        });
        setSubjects([]);
        setCorrections([]);
      }
    } catch (err) {
      console.error("Erreur serveur:", err.response ? err.response.data : err.message);
      setError("Erreur serveur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFileRemove = (index, type) => {
    if (type === "subject") {
      setSubjects((prev) => prev.filter((_, i) => i !== index));
      setFormData((prev) => ({ ...prev, file: null }));
    } else {
      setCorrections((prev) => prev.filter((_, i) => i !== index));
      setFormData((prev) => ({ ...prev, correction: null }));
    }
  };


  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestion des Fichiers</h2>
      <div className="space-y-8">
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-2">
              Titre du sujet :
            </Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-2">
              Description du sujet :
            </Label>
            <Input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="deadline" className="block text-lg font-semibold text-gray-700 mb-2">
              Date limite :
            </Label>
            <Input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="subject-upload" className="block text-lg font-semibold text-gray-700 mb-2">
              Ajouter un sujet :
            </Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-300 ${subjectDropzone.isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
              {...subjectDropzone.getRootProps()}
            >
              <input {...subjectDropzone.getInputProps()} />
              <div className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                {subjects.length > 0 ? (
                  <span className="text-gray-600 text-sm">Fichier sélectionné : {subjects[0].name}</span>
                ) : (
                  <span className="text-gray-600 text-sm">Glissez un fichier ici ou cliquez pour sélectionner (PDF, DOC, DOCX)</span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="mt-12 bg-blue-500 text-white hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Envoi en cours..." : "Soumettre le Sujet"}
          </Button>
        </form>


      </div>
    </div>
  );
}

export default FileManager;