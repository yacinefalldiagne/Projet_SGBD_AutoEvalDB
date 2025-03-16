const express = require("express");
const router = express.Router();
const cors = require("cors");
const { createReponse } = require("../controllers/reponseController");
const { getReponse } = require("../controllers/reponseController");
const { getAssignments } = require("../controllers/reponseController");
const { getReponsesByStudent, getCorrectionsByStudent, getAllCorrections } = require("../controllers/reponseController");

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
router.get("/getStudentCorrections", getCorrectionsByStudent);
router.get("/getAllCorrections", getAllCorrections);

module.exports = router