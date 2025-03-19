const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const session = require("express-session");

const app = express();

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log("DB not connected", err));

const port = process.env.PORT || 8000;

app.use(
    cors({
        origin: process.env.CLIENT_URL || "https://client-phi-beige.vercel.app",
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
        cookie: { secure: process.env.NODE_ENV === "production" },
    })
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuration de Passport
require("./config/passport")(passport);

// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/submissionRoutes"));
app.use("/", require("./routes/topicRoutes"));
app.use("/", require("./routes/settingsRoutes"));

// Lancement du serveur
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
