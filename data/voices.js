const voices = [
  { id: "en-US-default", name: "English (US)", language: "en", languageLabel: "English", gender: "Female" },
  { id: "en-GB-default", name: "English (UK)", language: "en-gb", languageLabel: "English (UK)", gender: "Male" },
  { id: "hi-IN-default", name: "Hindi", language: "hi", languageLabel: "Hindi", gender: "Female" },
  { id: "gu-IN-default", name: "Gujarati", language: "gu", languageLabel: "Gujarati", gender: "Female" },
  { id: "mr-IN-default", name: "Marathi", language: "mr", languageLabel: "Marathi", gender: "Female" },
  { id: "es-ES-default", name: "Spanish", language: "es", languageLabel: "Spanish", gender: "Male" },
  { id: "fr-FR-default", name: "French", language: "fr", languageLabel: "French", gender: "Female" },
  { id: "de-DE-default", name: "German", language: "de", languageLabel: "German", gender: "Male" },
];

const findVoiceById = (id) => voices.find((v) => v.id === id);
const findVoicesByLanguage = (language) => voices.filter((v) => v.language === language);

module.exports = { voices, findVoiceById, findVoicesByLanguage };