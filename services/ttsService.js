const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const gTTS = require("gtts");

const AUDIO_DIR = path.join(__dirname, "..", "audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Generates an mp3 file for the given text/language pair using the free,
 * keyless Google Translate TTS engine, and returns the public path to it.
 */
function generateSpeech({ text, languageCode }) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${uuidv4()}.mp3`;
      const filePath = path.join(AUDIO_DIR, fileName);
      const speech = new gTTS(text, languageCode);

      speech.save(filePath, (err) => {
        if (err) {
          const wrapped = new Error("The Text-to-Speech provider failed to generate audio.");
          wrapped.status = 503;
          return reject(wrapped);
        }
        resolve({ fileName, audioUrl: `/audio/${fileName}` });
      });
    } catch (err) {
      const wrapped = new Error("Unable to process the request for speech generation.");
      wrapped.status = 500;
      reject(wrapped);
    }
  });
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