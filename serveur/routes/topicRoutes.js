const express = require("express");
const router = express.Router();
const cors = require("cors");
const { createTopic } = require("../controllers/topicController");

// middleware
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

router.post("/createTopic", createTopic)

module.exports = router