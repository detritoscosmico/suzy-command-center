const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/ethics-core.js");

function correctAnswer(item) {
  return {
    action: item.expectedAction,
    conflict: item.expectedConflict,
    source: item.expectedSource,
    rationale: "A decisão respeita a função-alvo aprovada, identifica a fronteira aplicável e evita avançar sem base suficiente."
  };
}

test("banco possui variantes suficientes e fontes oficiais identificadas", () => {
  assert.ok(core.CASES.length >= 12);
  assert.equal(new Set(core.CASES.map(item => item.id)).size, core.CASES.length);
  assert.ok(core.SOURCES.filter(item => item.id.startsWith("CVM")).every(item => item.url.startsWith("https://conteudo.cvm.gov.br/")));
});

test("sessão é reproduzível, única e limitada a seis casos", () => {
  const first = core.createSession(42);
  const second = core.createSession(42);
  assert.deepEqual(first.cases.map(item => item.id), second.cases.map(item => item.id));
  assert.equal(first.cases.length, core.REQUIRED_CASES);
  assert.equal(new Set(first.cases.map(item => item.id)).size, core.REQUIRED_CASES);
});

test("classificação correta recebe nota integral", () => {
  const item = core.findCase("own-account-journal");
  const grade = core.gradeCase(item.id, correctAnswer(item));
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("autorizar atividade fora do escopo limita a nota a 49", () => {
  const item = core.findCase("relative-account-password");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), action: "WITHIN_SCOPE" });
  assert.equal(grade.score, 49);
  assert.equal(grade.passed, false);
  assert.match(grade.hardViolation, /fora do escopo/);
});

test("avançar com enquadramento incerto limita a nota a 69", () => {
  const item = core.findCase("uncertain-token-classification");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), action: "WITHIN_SCOPE" });
  assert.ok(grade.score <= 69);
  assert.match(grade.hardViolation, /incerto/);
});

test("justificativa curta não recebe os vinte pontos de documentação", () => {
  const item = core.findCase("general-risk-lesson");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), rationale: "curta" });
  assert.equal(grade.score, 80);
  assert.equal(grade.checks.find(check => check.id === "rationale").passed, false);
});

test("aprovação exige seis casos únicos, média 80 e zero violação dura", () => {
  const session = core.createSession(91);
  const attempts = session.cases.map((item, index) => ({
    sessionId: "session-91",
    seed: 91,
    timestamp: new Date(Date.UTC(2026, 7, 9, 10, index)).toISOString(),
    caseId: item.id,
    answer: correctAnswer(item)
  }));
  assert.equal(core.evaluateSession(attempts).passed, true);
  assert.equal(core.evaluateSession(attempts.slice(0, 5)).passed, false);
  const outside = attempts.find(attempt => core.findCase(attempt.caseId).expectedAction === "OUTSIDE_SCOPE");
  outside.answer = { ...outside.answer, action: "WITHIN_SCOPE" };
  assert.equal(core.evaluateSession(attempts).passed, false);
});

test("estado recalcula notas e ignora aprovação ou pontuação forjada", () => {
  const item = core.findCase("own-account-journal");
  const state = core.normalizeState({
    passed: true,
    bestAverage: 100,
    history: [{
      sessionId: "forged",
      seed: 1,
      timestamp: "2026-08-09T10:00:00Z",
      caseId: item.id,
      score: 100,
      passed: true,
      answer: { action: "", conflict: "", source: "", rationale: "" }
    }]
  });
  assert.equal(state.passed, false);
  assert.equal(state.bestAverage, 0);
  assert.equal(state.history[0].score, 0);
});
