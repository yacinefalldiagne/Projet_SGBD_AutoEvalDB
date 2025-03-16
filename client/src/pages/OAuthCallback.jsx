import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { UserContext } from "@/contexts/user-context";

export function OAuthCallback() {
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Faire une requête pour récupérer les informations de l'utilisateur connecté
                const { data } = await axios.get("http://localhost:8000/profile", {
                    withCredentials: true, // Inclure les cookies
                });

                // Mettre à jour le contexte utilisateur
                setUser(data.user);

                // Rediriger en fonction du rôle
                if (data.user.role === "enseignant") {
                    navigate("/enseignant");
                } else if (data.user.role === "etudiant") {
                    navigate("/etudiant");
                } else {
                    navigate("/etudiant"); // Par défaut
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'utilisateur:", error);
                toast.error("Erreur lors de la connexion. Veuillez réessayer.");
                navigate("/login");
            }
        };

        fetchUser();
    }, [navigate, setUser]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p>Connexion en cours...</p>
        </div>
    );
}

export default OAuthCallback;