require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const ttsRoutes = require("./routes/ttsRoutes");
const { cleanupOldAudio, AUDIO_DIR } = require("./services/ttsService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(morgan("dev"));
app.use(express.json());

// --- Static audio files (generated speech) ---
app.use("/audio", express.static(AUDIO_DIR));

app.use("/api", ttsRoutes);

// Periodically remove old generated audio files (every 30 min)
setInterval(() => cleanupOldAudio(), 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`TTS server running on http://localhost:${PORT}`);
});