import { useState, useContext } from 'react';
import { BookOpen, Calendar, Upload } from 'lucide-react';
import { Footer } from '@/layouts/footer';
import { useTheme } from '@/hooks/use-theme';
import { useDropzone } from 'react-dropzone';

import { UserContext } from "@/contexts/user-context";


const TeacherCreateTopicPage = () => {
    const { theme } = useTheme();
    const { user } = useContext(UserContext);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        teacher: user ? user._id : '',
        deadline: '',
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const onDrop = (acceptedFiles) => {
        setFormData((prev) => ({ ...prev, file: acceptedFiles[0] }));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);



        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('teacher', formData.teacher); // Remplacez par l'ID réel
        data.append('deadline', formData.deadline);
        if (formData.file) data.append('file', formData.file);

        try {
            const response = await fetch('http://localhost:8000/createTopic', {
                method: 'POST',
                body: data,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setSuccess('Sujet créé avec succès !');
            setFormData({ title: '', description: '', teacher: '', deadline: '', file: null });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col gap-y-4 min-h-screen">
            <h1 className="title">Créer un Nouveau Sujet</h1>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                        <input
                            type="text"
                            name="title"
                            placeholder="Titre du sujet"
                            value={formData.title}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                            className="textarea"
                        />
                        <input
                            type="text"
                            name="teacher"
                            placeholder="ID de l'enseignant (temporaire)"
                            value={formData.teacher}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <div className="flex items-center gap-x-2">
                            <Calendar size={20} />
                            <input
                                type="date"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed p-4 rounded-lg text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                }`}
                        >
                            <input {...getInputProps()} />
                            {formData.file ? (
                                <p>Fichier sélectionné : {formData.file.name}</p>
                            ) : (
                                <p>
                                    Glissez un fichier ici ou cliquez pour sélectionner (PDF, DOC, DOCX)
                                </p>
                            )}
                            <Upload className="mx-auto mt-2" size={24} />
                        </div>
                        <button type="submit" className="btn bg-blue-500 text-white hover:bg-blue-600">
                            Soumettre le Sujet
                        </button>
                    </form>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                    {success && <p className="text-green-500 mt-2">{success}</p>}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TeacherCreateTopicPage;