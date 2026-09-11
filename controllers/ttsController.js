const { validateTtsRequest } = require("../utils/validators");
const { voices } = require("../data/voices");
const { generateSpeech } = require("../services/ttsService");

async function convertTextToSpeech(req, res, next) {
  const validation = validateTtsRequest(req.body);

  if (!validation.valid) {
    return res.status(validation.status).json({ success: false, error: validation.message });
  }

  const { text } = req.body;
  const { voiceEntry } = validation;

  try {
    const { audioUrl, translatedText } = await generateSpeech({
      text,
      languageCode: voiceEntry.language,
    });

    return res.status(201).json({ success: true, audioUrl, translatedText });
  } catch (err) {
    return next(err);
  }
}

function getVoices(req, res) {
  const { language } = req.query;
  const filtered = language ? voices.filter((v) => v.language === language) : voices;

  res.status(200).json({ success: true, voices: filtered });
}

module.exports = { convertTextToSpeech, getVoices };