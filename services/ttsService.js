const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const googleTTS = require("google-tts-api");
const axios = require("axios");

const AUDIO_DIR = path.join(__dirname, "..", "audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Provider 1: MyMemory, with an email param to raise the free quota. */
async function translateWithMyMemory(text, targetLang) {
  const response = await axios.get("https://api.mymemory.translated.net/get", {
    params: {
      q: text,
      langpair: `en|${targetLang}`,
      de: "sruthi28021998@gmail.com",
    },
    timeout: 8000,
  });

  const translated = response.data?.responseData?.translatedText;
  if (!translated) throw new Error("MyMemory returned no result.");
  return translated;
}

/** Provider 2: Lingva Translate — a free, open public proxy for Google Translate. */
async function translateWithLingva(text, targetLang) {
  const response = await axios.get(
    `https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`,
    { timeout: 8000 }
  );

  const translated = response.data?.translation;
  if (!translated) throw new Error("Lingva returned no result.");
  return translated;
}

/**
 * Tries each translation provider in order, with one short retry per
 * provider if it hits a rate limit (429). Falls back to the original
 * text only if every provider fails — so the app degrades gracefully
 * instead of erroring out.
 */
async function translateText(text, targetLang) {
  const providers = [translateWithMyMemory, translateWithLingva];

  for (const provider of providers) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await provider(text, targetLang);
      } catch (err) {
        const status = err.response?.status;
        console.error(
          `[translation error] ${provider.name} attempt ${attempt}:`,
          status || err.message
        );
        if (status === 429 && attempt === 1) {
          await sleep(1000); // brief pause before retrying the same provider once
          continue;
        }
        break; // move on to the next provider
      }
    }
  }

  console.error("[translation error] all providers failed, using original text");
  return text;
}

async function generateSpeech({ text, languageCode }) {
  let textToSpeak = text;

  if (languageCode !== "en") {
    textToSpeak = await translateText(text, languageCode);
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