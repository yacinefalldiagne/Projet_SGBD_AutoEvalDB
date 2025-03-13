const User = require('../models/user');
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken');

const test = (req, res) => {
    res.json("Hello from auth controller");
};


const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ error: "Tous les champs sont réquis." });
        }

        if (password.length < 6) {
            return res.json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ error: "L'email existe déjà" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User({ name, email, password: hashedPassword, role: "etudiant" });
        await newUser.save();

        res.status(201).json({ message: "Utilisateur crée avec succès !" });

    } catch (err) {
        console.error("Error in registerUser:", err);
        res.status(500).json({ error: "Server error. Try again later." });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifiez les champs email et mot de passe
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'No user found with this email' });
        }

        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Créez le token JWT et définissez-le dans un cookie
        jwt.sign({ email: user.email, id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) {
                return res.status(400).json({ error: 'Error creating token' });
            }

            // Définir le cookie contenant le token
            res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
            res.json({ message: "Connexion réussie", token, user });

        });
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
};


const getProfile = async (req, res) => {
    const { token } = req.cookies; // Récupérer le token depuis les cookies

    if (!token) {
        return res.status(401).json({ error: 'Token non fourni, veuillez vous connecter' });
    }

    try {
        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Récupérer les données complètes de l'utilisateur depuis la base de données
        const user = await User.findById(userId).select('-password'); // Exclure le mot de passe
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Renvoyer les informations de l'utilisateur
        return res.status(200).json({ user });
    } catch (err) {
        console.error("Erreur dans getProfile:", err);
        return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
};


const logoutUser = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: false });
    res.json({ message: "Déconnexion réussie" });
};



module.exports = {
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser,

};