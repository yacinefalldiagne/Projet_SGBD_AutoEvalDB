const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require('path');

const app = express();

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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


// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/submissionRoutes"));
app.use("/", require("./routes/topicRoutes"));

// Dossier des fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Lancement du serveur
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
