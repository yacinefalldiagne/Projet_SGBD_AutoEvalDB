const express = require("express");
const router = express.Router();
const cors = require("cors");
const { createReponse } = require("../controllers/reponseController");
const { getReponse } = require("../controllers/reponseController");
const { getAssignments } = require("../controllers/reponseController");
const {
    getReponsesByStudent,
    getAllCorrections,
    generateCorrectionForReponse,
    getCorrectionsForStudent,
    updateCorrectionScore,
    updateCorrectionFeedback

} = require("../controllers/reponseController");

// middleware
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

router.post("/createReponse", createReponse)
router.get("/getReponse", getReponse)
router.get("/getAssignments", getAssignments)
router.get("/getStudentReponse", getReponsesByStudent)
router.get("/getAllCorrections", getAllCorrections);
router.get("/corrections", getCorrectionsByStudent);
router.post("/generateCorrection/:reponseId", generateCorrectionForReponse);
router.get("/getCorrectionsForStudent", getCorrectionsForStudent)
router.put('/corrections/:correctionId/score', updateCorrectionScore);
router.put('/corrections/:correctionId/feedback', updateCorrectionFeedback);

module.exports = router