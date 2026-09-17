const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const googleTTS = require("google-tts-api");
const axios = require("axios");

const AUDIO_DIR = path.join(__dirname, "..", "audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Translates text using the free, keyless MyMemory Translation API.
 * The "de" (email) parameter is a standard, documented part of MyMemory's
 * free tier that raises the daily request quota significantly — without
 * it, shared cloud IPs (like Render's) hit the low anonymous limit fast.
 */
async function translateText(text, targetLang) {
  const response = await axios.get("https://api.mymemory.translated.net/get", {
    params: {
      q: text,
      langpair: `en|${targetLang}`,
      de: "sruthi28021998@gmail.com",
    },
    timeout: 10000,
  });

  const translated = response.data?.responseData?.translatedText;
  if (!translated) {
    throw new Error("Translation service returned no result.");
  }
  return translated;
}

async function generateSpeech({ text, languageCode }) {
  let textToSpeak = text;

  if (languageCode !== "en") {
    try {
      textToSpeak = await translateText(text, languageCode);
    } catch (translateErr) {
      console.error("[translation error]", translateErr.message);
    }
  }

  try {
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