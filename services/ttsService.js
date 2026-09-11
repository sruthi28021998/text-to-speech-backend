const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const googleTTS = require("google-tts-api");
const { translate } = require("@vitalets/google-translate-api");

const AUDIO_DIR = path.join(__dirname, "..", "audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

async function generateSpeech({ text, languageCode }) {
  try {
    // Translate the input text into the target language first.
    // If translation fails for any reason, fall back to speaking
    // the original text as-is rather than failing the whole request.
    let textToSpeak = text;
    try {
      const result = await translate(text, { to: languageCode });
      textToSpeak = result.text;
    } catch (translateErr) {
      console.error("[translation error]", translateErr.message);
    }

    const chunks = await googleTTS.getAllAudioBase64(textToSpeak, {
      lang: languageCode,
      slow: false,
      host: "https://translate.google.com",
    });

    const buffers = chunks.map((chunk) => Buffer.from(chunk.base64, "base64"));
    const combinedBuffer = Buffer.concat(buffers);

    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);
    fs.writeFileSync(filePath, combinedBuffer);

    return { fileName, audioUrl: `/audio/${fileName}`, translatedText: textToSpeak };
  } catch (err) {
    console.error("[google-tts-api error]", err.message);
    const wrapped = new Error("The Text-to-Speech provider failed to generate audio.");
    wrapped.status = 503;
    throw wrapped;
  }
}

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