require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const ttsRoutes = require("./routes/ttsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", ttsRoutes);

app.listen(PORT, () => {
  console.log(`TTS server running on http://localhost:${PORT}`);
});