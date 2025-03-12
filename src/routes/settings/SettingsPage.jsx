import { useState } from "react";
import Switch from "@/components/ui/Switch"; 
import Button from "@/components/ui/Button"; 


function SettingsPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState("fr");
    const [profileImage, setProfileImage] = useState(null); // Etat pour la photo de profil

    // Fonction pour gérer le changement de photo de profil
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result); // On enregistre l'image dans l'état
            };
            reader.readAsDataURL(file); // Lire le fichier image en tant qu'URL
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Paramètres du compte</h1>

            {/* Informations personnelles */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-3">Informations personnelles</h2>
                
                {/* Photo de profil */}
                <div className="flex items-center mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-3">
                        {/* Affichage de la photo de profil */}
                        <img
                            src={profileImage || 'default-avatar.png'} // Affichage de l'image, ou image par défaut
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <Button className="ml-3">
                        <label htmlFor="profile-image" className="cursor-pointer">Changer la photo</label>
                    </Button>
                    <input
                        type="file"
                        id="profile-image"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange} // Gestion du changement de photo
                    />
                </div>

                <input type="text" placeholder="Nom" className="w-full p-2 border rounded" />
                <input type="text" placeholder="Prénom" className="w-full p-2 border mt-2 rounded" />
                <Button className="mt-3">Mettre à jour</Button>
            </div>

            {/* Préférences */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-3">Préférences</h2>
                <div className="flex items-center justify-between">
                    <span>Mode sombre</span>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between mt-3">
                    <span>Notifications</span>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <div className="mt-3">
                    <label>Langue :</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-2 border rounded w-full">
                        <option value="fr">Français</option>
                        <option value="en">Anglais</option>
                    </select>
                </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-3">Sécurité</h2>
                <Button className="bg-red-500 hover:bg-red-600 text-white">Changer de mot de passe</Button>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-3">Actions du compte</h2>
                <Button className="bg-gray-600 hover:bg-gray-700 text-white">Déconnexion</Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white mt-3">Supprimer le compte</Button>
            </div>
        </div>
    );
}

export default SettingsPage;