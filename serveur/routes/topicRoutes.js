const express = require("express");
const router = express.Router();
const cors = require("cors");
const { getTopic, generateCorrectionsForTopic, createTopic, downloadCorrectionAsPDF, publishTopic, downloadFile, getTeacherDashboard
} = require("../controllers/topicController");

// middleware
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

router.post("/createTopic", createTopic)
router.get("/getTopic", getTopic)
router.post("/generateCorrections/:topicId", generateCorrectionsForTopic);
router.get('/downloadCorrectionPDF/:topicId', downloadCorrectionAsPDF);
router.post('/publishTopic/:topicId', publishTopic);
router.get('/downloadFile/:topicId', downloadFile);
router.get('/getTeacherDashboard', getTeacherDashboard);
module.exports = router