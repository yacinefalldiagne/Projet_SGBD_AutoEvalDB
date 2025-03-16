import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Bell, ChevronsLeft, Moon, Search, Sun, User, LogOut } from "lucide-react";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const [isProfileOpen, setIsProfileOpen] = useState(false); // État pour le menu déroulant

    // Fonction de déconnexion
    const handleLogout = () => {
        localStorage.removeItem("token"); // Supprime le token (si utilisé)
        window.location.href = "/home"; // Redirige vers la page d'accueil
    };

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-6 shadow-md transition-colors dark:bg-slate-900">
            {/* Partie gauche : Bouton collapse + Recherche */}
            <div className="flex items-center gap-x-4">
                <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft
                        size={24}
                        className={`text-gray-600 dark:text-gray-300 transition-transform duration-300 ${collapsed && "rotate-180"}`}
                    />
                </button>
                <div className="relative flex items-center w-64 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
                    <Search size={20} className="text-gray-400 dark:text-slate-500" />
                    <input
                        type="text"
                        name="search"
                        id="search"
                        placeholder="Rechercher..."
                        className="w-full bg-transparent pl-2 text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Partie droite : Thème + Profil */}
            <div className="flex items-center gap-x-4">
                <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                    <Sun size={20} className="text-gray-600 dark:hidden" />
                    <Moon size={20} className="hidden dark:block text-gray-300" />
                </button>

                {/* Bouton Profil avec icône */}
                <div className="relative">
                    <button
                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <User size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* Menu déroulant */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-slate-700 animate-fade-in">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-x-2 w-full px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <LogOut size={18} className="text-red-500" />
                                Se déconnecter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};

// Animation personnalisée dans Tailwind (à ajouter dans tailwind.config.js si nécessaire)
const customStyles = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.2s ease-out;
    }
`;