import { useState, useContext, useEffect } from 'react';
import { BookOpen, Calendar, Upload } from 'lucide-react';
import { Footer } from '@/layouts/footer';
import { useTheme } from '@/hooks/use-theme';
import { useDropzone } from 'react-dropzone';
import { UserContext } from "@/contexts/user-context";
import axios from 'axios'; // Import axios

const StudentSubmitResponsePage = () => {
  const { theme } = useTheme();
  const { user } = useContext(UserContext);
  const studentId = user?._id;

  const [formData, setFormData] = useState({
    assignmentId: '',
    file: null,
    student: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get('http://localhost:8000/getAssignments');
        setAssignments(response.data);
      } catch (err) {
        setMessage('Erreur lors de la récupération des sujets.');
      }
    };

    fetchAssignments();
  }, []);

  const onDrop = (acceptedFiles) => {
    setFormData((prev) => ({ ...prev, file: acceptedFiles[0] }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'application/pdf',
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!formData.assignmentId || !formData.file) {
      setMessage("Veuillez sélectionner un sujet et un fichier.");
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('student', studentId);
    data.append('title', formData.assignmentId);
    data.append('file', formData.file);

    console.log("Données envoyées:", Object.fromEntries(data.entries()));

    try {
      const response = await axios.post('http://localhost:8000/createReponse', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        setMessage("Réponse soumise avec succès !");
        setFormData({ assignmentId: '', file: null });
      } else {
        setMessage("Erreur lors de la soumission.");
      }
    } catch (err) {
      console.error("Erreur serveur:", err.response ? err.response.data : err.message);
      setMessage("Erreur serveur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Soumission de réponse</h2>
      <div className="space-y-8">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            {/* Choisir le sujet */}
            <select
              name="assignmentId"
              value={formData.assignmentId}
              onChange={handleChange}
              className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un sujet</option>
              {assignments.map((assignment) => (
                <option key={assignment._id} value={assignment._id}>
                  {assignment.title}
                </option>
              ))}
            </select>

            {/* Drag & Drop zone */}
            <div {...getRootProps()} className={`border-2 border-dashed p-4 rounded-lg text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <input {...getInputProps()} />
              {formData.file ? (
                <p>Fichier sélectionné : {formData.file.name}</p>
              ) : (
                <p>Glissez un fichier ici ou cliquez pour sélectionner (PDF)</p>
              )}
              <Upload className="mx-auto mt-2" size={24} />
            </div>

            {/* Submit button */}
            <button type="submit" disabled={loading} className="btn bg-blue-500 text-white hover:bg-blue-600">
              {loading ? 'Envoi en cours...' : 'Soumettre la réponse'}
            </button>
          </form>

          {/* Feedback message */}
          {message && (
            <div className={`mt-4 p-2 rounded-lg ${message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <p>{message}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentSubmitResponsePage;
