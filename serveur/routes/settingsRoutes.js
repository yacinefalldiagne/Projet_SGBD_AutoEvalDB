// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const cors = require("cors");
const settingsController = require("../controllers/settingsController");

// Middleware CORS
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

router.get("/api/student/profile", settingsController.getProfile);
router.put("/api/student/profile", settingsController.updateProfile);
router.put("/api/student/password", settingsController.changePassword);

module.exports = router;