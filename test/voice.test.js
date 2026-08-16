const test = require("node:test");
const assert = require("node:assert/strict");
const VoiceCore = require("../js/voice-core.js");

const voices = [
  { name: "Português Portugal", lang: "pt-PT", default: false, localService: true },
  { name: "Brasil 2", lang: "pt-BR", default: false, localService: true },
  { name: "English", lang: "en-US", default: true, localService: true },
  { name: "Brasil principal", lang: "pt_BR", default: true, localService: true },
  { name: "Brasil remoto", lang: "pt-BR", default: false, localService: false }
];

test("expõe exatamente quatro perfis de voz distintos", () => {
  const profiles = VoiceCore.listProfiles();
  assert.deepEqual(profiles.map(profile => profile.id), ["natural", "calm", "energetic", "deep"]);
  assert.equal(new Set(profiles.map(profile => `${profile.rate}:${profile.pitch}`)).size, 4);
  assert.ok(VoiceCore.getProfile("deep").pitch >= 0.9);
});

test("normaliza uma preferência desconhecida para a voz Natural", () => {
  assert.equal(VoiceCore.normalizeProfileId("inexistente"), "natural");
  assert.equal(VoiceCore.getProfile(null).label, "Natural");
});

test("prioriza vozes pt-BR e distribui as disponíveis entre os perfis", () => {
  const ordered = VoiceCore.portugueseVoices(voices);
  assert.deepEqual(ordered.map(voice => voice.name), ["Brasil principal", "Brasil 2", "Brasil remoto", "Português Portugal"]);
  assert.equal(VoiceCore.resolveVoice(voices, "natural").name, "Brasil principal");
  assert.equal(VoiceCore.resolveVoice(voices, "deep").name, "Brasil principal");
  assert.equal(VoiceCore.resolveVoice(voices, "deep").lang, "pt_BR");
});

test("prefere voz local a uma voz remota marcada como padrão", () => {
  const candidates = [
    { name: "Brasil remota padrão", lang: "pt-BR", default: true, localService: false },
    { name: "Brasil local", lang: "pt-BR", default: false, localService: true }
  ];

  assert.deepEqual(
    VoiceCore.portugueseVoices(candidates).map(voice => voice.name),
    ["Brasil local", "Brasil remota padrão"]
  );
  assert.equal(VoiceCore.resolveVoice(candidates, "natural").name, "Brasil local");
});

test("Brave prioriza uma voz feminina mesmo quando a voz masculina é a padrão", () => {
  const braveVoices = [
    { name: "Microsoft Antonio Online (Natural) - Portuguese (Brazil)", lang: "pt-BR", default: true, localService: true },
    { name: "Google português do Brasil", lang: "pt-BR", default: false, localService: true },
    { name: "Microsoft Francisca Online (Natural) - Portuguese (Brazil)", lang: "pt-BR", default: false, localService: false }
  ];

  assert.deepEqual(
    VoiceCore.preferredPortugueseVoices(braveVoices).map(voice => voice.name),
    ["Microsoft Francisca Online (Natural) - Portuguese (Brazil)"]
  );
  assert.equal(VoiceCore.resolveVoice(braveVoices, "natural").name, "Microsoft Francisca Online (Natural) - Portuguese (Brazil)");
  assert.equal(VoiceCore.resolveVoice(braveVoices, "deep").name, "Microsoft Francisca Online (Natural) - Portuguese (Brazil)");
});

test("evita voz explicitamente masculina quando o navegador oferece uma alternativa neutra", () => {
  const candidates = [
    { name: "Microsoft Antonio - Portuguese (Brazil)", lang: "pt-BR", default: true, localService: true },
    { name: "Google português do Brasil", lang: "pt-BR", default: false, localService: false }
  ];

  assert.equal(VoiceCore.resolveVoice(candidates, "natural").name, "Google português do Brasil");
});

test("preserva pt-BR antes de considerar uma voz feminina de Portugal", () => {
  const candidates = [
    { name: "Joana", lang: "pt-PT", default: false, localService: true },
    { name: "Microsoft Antonio - Portuguese (Brazil)", lang: "pt-BR", default: true, localService: true },
    { name: "Google português do Brasil", lang: "pt-BR", default: false, localService: false }
  ];

  assert.deepEqual(
    VoiceCore.preferredPortugueseVoices(candidates).map(voice => voice.name),
    ["Google português do Brasil"]
  );
  assert.equal(VoiceCore.resolveVoice(candidates, "natural").lang, "pt-BR");
});

test("mantém uma voz portuguesa como último recurso quando só há vozes masculinas", () => {
  const candidates = [
    { name: "Microsoft Antonio - Portuguese (Brazil)", lang: "pt-BR", default: true, localService: true },
    { name: "Felipe", lang: "pt-BR", default: false, localService: true }
  ];

  assert.equal(VoiceCore.resolveVoice(candidates, "natural").name, "Microsoft Antonio - Portuguese (Brazil)");
});

test("mantém pt-BR como fallback quando o dispositivo não lista vozes em português", () => {
  const settings = VoiceCore.createSpeechSettings("calm", [{ name: "English", lang: "en-US" }]);
  assert.equal(settings.voice, null);
  assert.equal(settings.lang, "pt-BR");
  assert.equal(settings.profile.id, "calm");
});
