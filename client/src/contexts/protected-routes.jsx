import React, { useContext } from "react";
import { UserContext } from "@/contexts/user-context";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoutes() {
    const { user } = useContext(UserContext);

    // Si l'utilisateur n'est pas authentifié, redirige vers la page de login
    if (!user) {
        return <Navigate to="/login" />;
    }
    // Rediriger un étudiant vers sa page d'accueil si il tente d'accéder aux routes réservées aux enseignants
    if (user.role === "etudiant" && window.location.pathname.startsWith("/enseignant")) {
        return <Navigate to="/etudiant" />;
    }

    if (user.role === "enseignant" && window.location.pathname.startsWith("/etudiant")) {
        return <Navigate to="/enseignant" />;
    }

    return <Outlet />;
}
