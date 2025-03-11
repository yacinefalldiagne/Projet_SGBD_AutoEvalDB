const express = require("express");
const router = express.Router();
const cors = require("cors");
const { test, registerUser, loginUser } = require("../controllers/authController");

// middleware
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

router.get("/", test)
router.post("/register", registerUser)
router.post("/login", loginUser)

module.exports = router