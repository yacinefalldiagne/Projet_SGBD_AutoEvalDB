const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
<<<<<<< HEAD
const passport = require("passport");
const session = require("express-session");
=======
const path = require('path');
>>>>>>> 473cca35c3deb7070ad423671532d3416beff9b4

const app = express();

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverSelectionTimeoutMS: 5000, // Ajouter un timeout plus court pour la sélection du serveur
        socketTimeoutMS: 45000, 
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log("DB not connected", err));

const port = process.env.PORT || 8000;

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);

// Middleware pour parser les JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuration des sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || "your_session_secret",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === "production" }
    })
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuration de Passport (nous allons créer ce fichier)
require("./config/passport")(passport);

// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/submissionRoutes"));
<<<<<<< HEAD
app.use("/", require("./routes/topicRoutes")); // Ajout des routes pour les topics
=======
app.use("/", require("./routes/topicRoutes"));

// Dossier des fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
>>>>>>> 473cca35c3deb7070ad423671532d3416beff9b4

// Lancement du serveur
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});