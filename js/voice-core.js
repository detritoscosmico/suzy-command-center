(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyVoiceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PROFILES = Object.freeze([
    Object.freeze({ id: "natural", label: "Natural", description: "ritmo equilibrado", rate: 0.95, pitch: 1, voiceOffset: 0 }),
    Object.freeze({ id: "calm", label: "Calma", description: "ritmo mais lento e suave", rate: 0.82, pitch: 0.94, voiceOffset: 1 }),
    Object.freeze({ id: "energetic", label: "Enérgica", description: "ritmo mais rápido e tom elevado", rate: 1.08, pitch: 1.12, voiceOffset: 2 }),
    Object.freeze({ id: "deep", label: "Grave", description: "ritmo firme e tom mais baixo", rate: 0.88, pitch: 0.78, voiceOffset: 3 })
  ]);

  const PROFILE_BY_ID = Object.freeze(Object.fromEntries(PROFILES.map(profile => [profile.id, profile])));

  function normalizeProfileId(value) {
    return Object.prototype.hasOwnProperty.call(PROFILE_BY_ID, value) ? value : "natural";
  }

  function getProfile(value) {
    return PROFILE_BY_ID[normalizeProfileId(value)];
  }

  function listProfiles() {
    return PROFILES.map(profile => ({ ...profile }));
  }

  function languageRank(voice) {
    const language = String(voice?.lang || "").replace("_", "-").toLowerCase();
    if (language === "pt-br") return 0;
    if (language.startsWith("pt-")) return 1;
    if (language === "pt") return 2;
    return 3;
  }

  function portugueseVoices(voices) {
    return (Array.isArray(voices) ? voices : [])
      .filter(voice => languageRank(voice) < 3)
      .map((voice, index) => ({ voice, index }))
      .sort((a, b) => languageRank(a.voice) - languageRank(b.voice)
        || Number(Boolean(b.voice.default)) - Number(Boolean(a.voice.default))
        || Number(Boolean(b.voice.localService)) - Number(Boolean(a.voice.localService))
        || a.index - b.index)
      .map(entry => entry.voice);
  }

  function resolveVoice(voices, profileId) {
    const candidates = portugueseVoices(voices);
    if (!candidates.length) return null;
    const profile = getProfile(profileId);
    return candidates[profile.voiceOffset % candidates.length];
  }

  function createSpeechSettings(profileId, voices) {
    const profile = getProfile(profileId);
    const voice = resolveVoice(voices, profile.id);
    return {
      profile,
      voice,
      lang: voice?.lang || "pt-BR",
      rate: profile.rate,
      pitch: profile.pitch,
      volume: 1
    };
  }

  return {
    PROFILES,
    normalizeProfileId,
    getProfile,
    listProfiles,
    portugueseVoices,
    resolveVoice,
    createSpeechSettings
  };
});
