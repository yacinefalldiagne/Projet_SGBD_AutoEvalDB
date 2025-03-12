import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Appel de l'API pour obtenir les informations utilisateur
        axios.get('http://localhost:8000/profile', { withCredentials: true })
            .then(({ data }) => {
                // Vérifiez si la réponse contient l'objet "user"
                if (data?.user) {
                    setUser(data.user); // Mettez à jour l'utilisateur si trouvé
                } else {
                    console.error("Aucun utilisateur trouvé dans la réponse.");
                }
            })
            .catch((error) => {
                console.error("Error fetching user profile:", error);
                setUser(null); // En cas d'erreur, réinitialisez l'utilisateur
            });
    }, []);  // La requête sera lancée une seule fois lors du montage du composant

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
}
