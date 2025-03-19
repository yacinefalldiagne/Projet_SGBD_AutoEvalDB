import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                // Supprimer le token côté backend
                await axios.post(`${import.meta.env.VITE_API_URL}/logout`, {}, { withCredentials: true });

                // Supprimer le token du localStorage
                localStorage.removeItem('userToken');

                toast.success("Déconnexion réussie");

                // Rediriger vers la page de connexion
                navigate('/login');
            } catch (error) {
                toast.error("Erreur lors de la déconnexion");
            }
        };

        handleLogout();
    }, [navigate]);

    return null;
};

export default Logout;
