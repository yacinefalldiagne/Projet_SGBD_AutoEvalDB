// SettingsPage.js
import { useState, useEffect } from "react";
import { Footer } from "@/layouts/footer";
import { useTheme } from "@/hooks/use-theme";
import { Check, Lock, Mail, User, LogOut, Bell } from "lucide-react";
import axios from "axios";

const SettingsPage = () => {
    const { theme } = useTheme();
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        notificationsEnabled: false,
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:8000/api/student/profile", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setUserData({
                    name: response.data.name,
                    email: response.data.email,
                    notificationsEnabled: response.data.notificationsEnabled, // Mappé à preferences.notifications
                });
                setError(null);
            } catch (err) {
                console.error("Erreur lors du chargement des données:", err);
                setError(`Erreur : ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.put(
                "http://localhost:8000/api/student/profile",
                {
                    name: userData.name,
                    email: userData.email,
                    notificationsEnabled: userData.notificationsEnabled, // Mappé à preferences.notifications
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setUserData({
                name: response.data.name,
                email: response.data.email,
                notificationsEnabled: response.data.notificationsEnabled,
            });
            setSuccess("Profil mis à jour avec succès !");
            setError(null);
        } catch (err) {
            console.error("Erreur lors de la mise à jour:", err);
            setError(`Erreur : ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }
        try {
            setLoading(true);
            await axios.put(
                "http://localhost:8000/api/student/password",
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setSuccess("Mot de passe changé avec succès !");
            setError(null);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            console.error("Erreur lors du changement de mot de passe:", err);
            setError(`Erreur : ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-xl text-slate-900 dark:text-slate-50">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-4 p-6">
            <h1 className="title text-2xl font-bold text-slate-900 dark:text-slate-50">Paramètres</h1>

            {error && (
                <div className="card bg-red-500/20 text-red-500 p-4 rounded-lg">
                    <p>{error}</p>
                </div>
            )}
            {success && (
                <div className="card bg-green-500/20 text-green-500 p-4 rounded-lg flex items-center gap-x-2">
                    <Check size={20} />
                    <p>{success}</p>
                </div>
            )}

            <div className="card">
                <div className="card-header flex items-center gap-x-4">
                    <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                        <User size={26} />
                    </div>
                    <p className="card-title text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Informations Personnelles
                    </p>
                </div>
                <form onSubmit={handleProfileUpdate} className="card-body bg-slate-100 dark:bg-slate-950 p-4 flex flex-col gap-y-4">
                    <div className="flex items-center gap-x-4">
                        <input
                            type="text"
                            name="name"
                            value={userData.name}
                            onChange={handleInputChange}
                            placeholder="Votre nom"
                            className="flex-1 p-2 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-x-4">
                        <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            placeholder="Votre email"
                            className="flex-1 p-2 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-fit px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                    >
                        Sauvegarder
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="card-header flex items-center gap-x-4">
                    <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                        <Bell size={26} />
                    </div>
                    <p className="card-title text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Préférences
                    </p>
                </div>
                <div className="card-body bg-slate-100 dark:bg-slate-950 p-4 flex flex-col gap-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-900 dark:text-slate-50">Notifications</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={userData.notificationsEnabled}
                                onChange={() =>
                                    setUserData((prev) => ({
                                        ...prev,
                                        notificationsEnabled: !prev.notificationsEnabled,
                                    }))
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header flex items-center gap-x-4">
                    <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                        <Lock size={26} />
                    </div>
                    <p className="card-title text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Changer le Mot de Passe
                    </p>
                </div>
                <form onSubmit={handlePasswordChange} className="card-body bg-slate-100 dark:bg-slate-950 p-4 flex flex-col gap-y-4">
                    <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Mot de passe actuel"
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Nouveau mot de passe"
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Confirmer le nouveau mot de passe"
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-fit px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                    >
                        Changer le mot de passe
                    </button>
                </form>
            </div>

            <Footer />
        </div>
    );
};

export default SettingsPage;