const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const googleTTS = require("google-tts-api");

const AUDIO_DIR = path.join(__dirname, "..", "audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Generates an mp3 file for the given text/language pair using Google
 * Translate's TTS endpoint (via google-tts-api), and returns the public
 * path to it. Long text is automatically split into chunks (Google's
 * endpoint caps ~200 chars per request) and the audio is stitched back
 * together into one file.
 */
async function generateSpeech({ text, languageCode }) {
  try {
    const chunks = await googleTTS.getAllAudioBase64(text, {
      lang: languageCode,
      slow: false,
      host: "https://translate.google.com",
    });

    const buffers = chunks.map((chunk) => Buffer.from(chunk.base64, "base64"));
    const combinedBuffer = Buffer.concat(buffers);

    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);
    fs.writeFileSync(filePath, combinedBuffer);

    return { fileName, audioUrl: `/audio/${fileName}` };
  } catch (err) {
    console.error("[google-tts-api error]", err.message);
    const wrapped = new Error("The Text-to-Speech provider failed to generate audio.");
    wrapped.status = 503;
    throw wrapped;
  }
}

/** Deletes generated files older than maxAgeMs (default 1 hour). */
function cleanupOldAudio(maxAgeMs = 60 * 60 * 1000) {
  fs.readdir(AUDIO_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach((file) => {
      if (file === ".gitkeep") return;
      const filePath = path.join(AUDIO_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

module.exports = { generateSpeech, cleanupOldAudio, AUDIO_DIR };