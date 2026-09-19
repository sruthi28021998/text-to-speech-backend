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

// In-memory cache: same text + language pair reuses the previous
// translation instead of calling any external API again. Clears on
// server restart, which is fine since it's just a performance/reliability
// booster, not a data store.
const translationCache = new Map();
const CACHE_MAX_ENTRIES = 500;

function cacheKey(text, lang) {
  return `${lang}::${text}`;
}

async function translateWithLibreTranslate(text, targetLang, host) {
  const response = await axios.post(
    `${host}/translate`,
    { q: text, source: "en", target: targetLang, format: "text" },
    { timeout: 8000, headers: { "Content-Type": "application/json" } }
  );
  const translated = response.data?.translatedText;
  if (!translated) throw new Error("LibreTranslate returned no result.");
  return translated;
}

async function translateWithMyMemory(text, targetLang) {
  const response = await axios.get("https://api.mymemory.translated.net/get", {
    params: { q: text, langpair: `en|${targetLang}`, de: "sruthi28021998@gmail.com" },
    timeout: 8000,
  });
  const translated = response.data?.responseData?.translatedText;
  if (!translated) throw new Error("MyMemory returned no result.");
  return translated;
}

async function translateText(text, targetLang) {
  const key = cacheKey(text, targetLang);
  if (translationCache.has(key)) {
    return translationCache.get(key);
  }

  const libreHosts = ["https://libretranslate.de", "https://translate.astian.org"];
  let result = null;

  for (const host of libreHosts) {
    try {
      result = await translateWithLibreTranslate(text, targetLang, host);
      break;
    } catch (err) {
      console.error(`[translation error] LibreTranslate (${host}):`, err.response?.status || err.message);
    }
  }

  if (!result) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        result = await translateWithMyMemory(text, targetLang);
        break;
      } catch (err) {
        console.error(`[translation error] MyMemory attempt ${attempt}:`, err.response?.status || err.message);
        if (err.response?.status === 429 && attempt === 1) {
          await sleep(1000);
          continue;
        }
      }
    }
  }

  if (!result) {
    console.error("[translation error] all providers failed, using original text");
    result = text;
  }

  if (translationCache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, result);

  return result;
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