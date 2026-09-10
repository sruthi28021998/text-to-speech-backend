const express = require("express");
const { convertTextToSpeech, getVoices } = require("../controllers/ttsController");
const { ttsRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/tts", ttsRateLimiter, convertTextToSpeech);
router.get("/voices", getVoices);

module.exports = router;