require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const ttsRoutes = require("./routes/ttsRoutes");
const { requireJsonContentType } = require("./middleware/validateRequest");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { cleanupOldAudio, AUDIO_DIR } = require("./services/ttsService");
const healthRoutes = require("./routes/healthRoutes"); a
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(requireJsonContentType);

app.use("/audio", express.static(AUDIO_DIR));

app.use("/api", ttsRoutes);
app.use("/api", healthRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

setInterval(() => cleanupOldAudio(), 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`TTS server running on http://localhost:${PORT}`);
});