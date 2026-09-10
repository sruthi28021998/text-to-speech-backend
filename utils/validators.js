const { findVoiceById } = require("../data/voices");

const MAX_TEXT_LENGTH = parseInt(process.env.MAX_TEXT_LENGTH || "2000", 10);

function validateTtsRequest(body) {
  const { text, voice } = body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return { valid: false, status: 400, message: "Text must not be empty." };
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      status: 400,
      message: `Text exceeds the maximum allowed length of ${MAX_TEXT_LENGTH} characters.`,
    };
  }

  if (!voice || typeof voice !== "string") {
    return { valid: false, status: 400, message: "A voice must be selected." };
  }

  const voiceEntry = findVoiceById(voice);
  if (!voiceEntry) {
    return { valid: false, status: 400, message: "Invalid voice selected." };
  }

  return { valid: true, voiceEntry };
}

module.exports = { validateTtsRequest, MAX_TEXT_LENGTH };