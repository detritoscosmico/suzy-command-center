const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/economics-core.js");

function correctAnswer(item) {
  return {
    interpretation: item.expectedInterpretation,
    driver: item.expectedDriver,
    action: item.expectedAction,
    source: item.expectedSource,
    rationale: "A leitura separa nível de surpresa, descreve o mecanismo macroeconômico e explicita a próxima verificação necessária antes de qualquer conclusão de mercado."
  };
}

test("banco possui doze variantes únicas e fontes primárias identificadas", () => {
  assert.ok(core.CASES.length >= 12);
  assert.equal(new Set(core.CASES.map(item => item.id)).size, core.CASES.length);
  assert.ok(core.SOURCES.every(item => item.url.startsWith("https://")));
  assert.ok(core.CASES.every(item => core.SOURCES.some(source => source.id === item.expectedSource)));
});

test("snapshot calcula taxa real aproximada e surpresas contra consenso", () => {
  const summary = core.summarizeMacroSnapshot({ nominalRate: 10.5, expectedInflation: 4.5, actualInflation: 5.1, consensusInflation: 4.9, actualGrowth: 2.1, consensusGrowth: 2.0 });
  assert.equal(summary.realRateApprox, 6);
  assert.equal(summary.inflationSurprise, 0.2);
  assert.equal(summary.growthSurprise, 0.1);
  assert.equal(summary.signal, "HOTTER");
});

test("sessão é reproduzível, única e limitada a seis casos", () => {
  const first = core.createSession(42);
  const second = core.createSession(42);
  assert.deepEqual(first.cases.map(item => item.id), second.cases.map(item => item.id));
  assert.equal(first.cases.length, core.REQUIRED_CASES);
  assert.equal(new Set(first.cases.map(item => item.id)).size, core.REQUIRED_CASES);
});

test("leitura macro completa recebe nota integral", () => {
  const item = core.findCase("fully-priced-rate-hike");
  const grade = core.gradeCase(item.id, correctAnswer(item));
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("inverter sinal macro central limita a nota a 49", () => {
  const item = core.findCase("inflation-above-consensus");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), interpretation: "EASING_BIAS" });
  assert.equal(grade.score, 49);
  assert.equal(grade.passed, false);
  assert.match(grade.hardViolation, /inverteu o sinal/);
});

test("transformar cenário condicional em chamada determinística limita a 69", () => {
  const item = core.findCase("oil-supply-shock");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), interpretation: "TIGHTENING_BIAS" });
  assert.ok(grade.score <= 69);
  assert.match(grade.hardViolation, /determinística/);
});

test("aprovação exige seis casos únicos, média 80 e zero violação dura", () => {
  const session = core.createSession(91);
  const attempts = session.cases.map((item, index) => ({
    sessionId: "session-91",
    seed: 91,
    timestamp: new Date(Date.UTC(2026, 7, 10, 10, index)).toISOString(),
    caseId: item.id,
    answer: correctAnswer(item)
  }));
  assert.equal(core.evaluateSession(attempts).passed, true);
  assert.equal(core.evaluateSession(attempts.slice(0, 5)).passed, false);
});

test("estado recalcula notas e ignora aprovação ou pontuação forjada", () => {
  const item = core.findCase("fully-priced-rate-hike");
  const state = core.normalizeState({
    passed: true,
    bestAverage: 100,
    history: [{
      sessionId: "forged",
      seed: 1,
      timestamp: "2026-08-10T10:00:00Z",
      caseId: item.id,
      score: 100,
      passed: true,
      answer: { interpretation: "", driver: "", action: "", source: "", rationale: "" }
    }]
  });
  assert.equal(state.passed, false);
  assert.equal(state.bestAverage, 0);
  assert.equal(state.history[0].score, 0);
});

test("aprovação E3 sobrevive à poda do histórico", () => {
  const approved = core.createSession(91).cases.map((item, index) => ({
    sessionId: "approved",
    seed: 91,
    timestamp: new Date(Date.UTC(2026, 7, 1, 10, index)).toISOString(),
    caseId: item.id,
    answer: correctAnswer(item)
  }));
  const history = [...approved];
  for (let sessionIndex = 0; sessionIndex < 10; sessionIndex += 1) {
    core.createSession(100 + sessionIndex).cases.forEach((item, caseIndex) => history.push({
      sessionId: `later-${sessionIndex}`,
      seed: 100 + sessionIndex,
      timestamp: new Date(Date.UTC(2026, 7, 2 + sessionIndex, 10, caseIndex)).toISOString(),
      caseId: item.id,
      answer: { interpretation: "", driver: "", action: "", source: "", rationale: "" }
    }));
  }
  const state = history.reduce((current, attempt) => core.recordAttempt(current, attempt), {});
  assert.equal(state.history.length, core.MAX_HISTORY);
  assert.equal(state.history.filter(attempt => attempt.sessionId === "approved").length, core.REQUIRED_CASES);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
});
