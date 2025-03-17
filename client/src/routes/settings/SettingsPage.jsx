// client/src/routes/settings/SettingsPage.jsx
import { useState, useEffect } from "react";
import Switch from "@/components/ui/Switch";
import Button from "@/components/ui/Button";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function SettingsPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState("fr");

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const response = await axios.get(`"http://localhost:8000/profile"`, { withCredentials: true });
                const user = response.data;
                setName(user.name);
                setDarkMode(user.preferences.darkMode);
                setNotifications(user.preferences.notifications);
                setLanguage(user.preferences.language);
                setMustResetPassword(user.mustResetPassword);
            } catch (error) {
                toast.error("Erreur lors du chargement des données");
            }
        };
        loadUserData();
    }, "http://localhost:8000/profile");


    const handleUpdatePersonalInfo = async () => {
        try {
            const formData = new FormData();
            formData.append("name", name);

            const response = await axios.put(`${apiUrl}/update-personal-info`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success(response.data.message);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handleUpdatePreferences = async () => {
        try {
            const response = await axios.put(
                `${apiUrl}/update-preferences`,
                { darkMode, notifications, language },
                { withCredentials: true }
            );
            toast.success(response.data.message);
        } catch (error) {
            console.error("Erreur dans handleUpdatePreferences:", error.response?.data || error.message);
            toast.error("Erreur lors de la mise à jour des préférences");
        }
    };

    const handleChangePassword = async () => {
        const currentPassword = mustResetPassword ? "" : prompt("Mot de passe actuel");
        const newPassword = prompt("Nouveau mot de passe");
        if (!newPassword) return;

        try {
            const response = await axios.put(
                `${apiUrl}/change-password`,
                { currentPassword, newPassword },
                { withCredentials: true }
            );
            toast.success(response.data.message);
            setMustResetPassword(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors du changement");
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Confirmer la suppression du compte ?")) return;
        try {
            const response = await axios.delete(`${apiUrl}/delete-account`, { withCredentials: true });
            toast.success(response.data.message);
            navigate("/login");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Paramètres</h1>

                {/* Informations personnelles */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Profil</h2>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring focus:ring-blue-300"
                        />
                    </div>
                    <Button onClick={handleUpdatePersonalInfo} className="mt-4 bg-green-500 hover:bg-green-600 text-white">
                        Mettre à jour
                    </Button>
                </section>

                {/* Préférences */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Préférences</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <span className="text-gray-700 dark:text-gray-300">Mode sombre</span>
                            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <span className="text-gray-700 dark:text-gray-300">Notifications</span>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <label className="block text-gray-700 dark:text-gray-300">Langue</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="mt-1 w-full p-2 border rounded-md dark:bg-gray-600 dark:text-white dark:border-gray-500"
                            >
                                <option value="fr">Français</option>
                                <option value="en">Anglais</option>
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleUpdatePreferences} className="mt-4 bg-green-500 hover:bg-green-600 text-white">
                        Enregistrer
                    </Button>
                </section>

                {/* Sécurité */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Sécurité</h2>

                    <p className="text-red-500 mb-4 font-medium">Vous devez définir un mot de passe.</p>

                    <Button onClick={handleChangePassword} className="bg-red-500 hover:bg-red-600 text-white">
                        {/* {mustResetPassword ? "Définir un mot de passe" : "Changer le mot de passe"} */}
                    </Button>
                </section>

                {/* Actions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                    <h2 className="text-lg font-semibold mb-3">Actions du compte</h2>
                    <Button className="bg-red-500 hover:bg-red-600 text-white mt-3">Supprimer le compte</Button>
                    {/* Actions */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Actions</h2>
                        <div className="flex space-x-4">
                            {/* <Button onClick={handleLogout} className="bg-gray-600 hover:bg-gray-700 text-white">
                                Déconnexion
                            </Button> */}
                            <Button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">
                                Supprimer le compte
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;