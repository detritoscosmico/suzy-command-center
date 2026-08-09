const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/statistics-core.js");

function correctAnswer(item) {
  return {
    conclusion: item.expectedConclusion,
    risk: item.expectedRisk,
    action: item.expectedAction,
    source: item.expectedSource,
    rationale: "A conclusão respeita o desenho da amostra, explicita a incerteza e define uma próxima validação coerente com o risco principal."
  };
}

test("banco possui doze variantes únicas e fontes metodológicas identificadas", () => {
  assert.ok(core.CASES.length >= 12);
  assert.equal(new Set(core.CASES.map(item => item.id)).size, core.CASES.length);
  assert.ok(core.SOURCES.every(item => item.url.startsWith("https://")));
  assert.ok(core.CASES.every(item => core.SOURCES.some(source => source.id === item.expectedSource)));
});

test("resumo combina taxa de acerto, magnitude, equilíbrio e intervalo", () => {
  const summary = core.summarizeSample({ wins: 7, losses: 3, averageWin: 0.5, averageLoss: 1 });
  assert.equal(summary.total, 10);
  assert.equal(summary.winRate, 70);
  assert.equal(summary.expectancy, 0.05);
  assert.equal(summary.breakevenWinRate, 66.67);
  assert.ok(summary.interval.lower < summary.winRate);
  assert.ok(summary.interval.upper > summary.winRate);
});

test("resumo vazio não produz divisão inválida", () => {
  assert.deepEqual(core.summarizeSample({}), {
    wins: 0, losses: 0, total: 0, averageWin: 0, averageLoss: 0,
    winRate: 0, expectancy: 0, breakevenWinRate: 0, interval: { lower: 0, upper: 0 }
  });
});

test("sessão é reproduzível, única e limitada a seis casos", () => {
  const first = core.createSession(42);
  const second = core.createSession(42);
  assert.deepEqual(first.cases.map(item => item.id), second.cases.map(item => item.id));
  assert.equal(first.cases.length, core.REQUIRED_CASES);
  assert.equal(new Set(first.cases.map(item => item.id)).size, core.REQUIRED_CASES);
});

test("leitura metodológica completa recebe nota integral", () => {
  const item = core.findCase("future-normalization");
  const grade = core.gradeCase(item.id, correctAnswer(item));
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("aprovar método inválido limita a nota a 49", () => {
  const item = core.findCase("hundred-variants-best");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), conclusion: "SUPPORTED_LIMITED" });
  assert.equal(grade.score, 49);
  assert.equal(grade.passed, false);
  assert.match(grade.hardViolation, /método inválido/);
});

test("validar alegação com amostra insuficiente limita a nota a 69", () => {
  const item = core.findCase("tiny-winning-streak");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), conclusion: "SUPPORTED_LIMITED" });
  assert.ok(grade.score <= 69);
  assert.match(grade.hardViolation, /amostra/);
});

test("justificativa curta não recebe pontos de documentação", () => {
  const item = core.findCase("predeclared-holdout");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), rationale: "curta" });
  assert.equal(grade.score, 90);
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
  const blocking = attempts.find(attempt => core.findCase(attempt.caseId).severity);
  blocking.answer = { ...blocking.answer, conclusion: "SUPPORTED_LIMITED" };
  assert.equal(core.evaluateSession(attempts).passed, false);
});

test("estado recalcula notas e ignora aprovação ou pontuação forjada", () => {
  const item = core.findCase("tiny-winning-streak");
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
      answer: { conclusion: "", risk: "", action: "", source: "", rationale: "" }
    }]
  });
  assert.equal(state.passed, false);
  assert.equal(state.bestAverage, 0);
  assert.equal(state.history[0].score, 0);
});

test("aprovação E3 e melhor média sobrevivem à poda do histórico", () => {
  const approvedSession = core.createSession(91);
  const history = approvedSession.cases.map((item, index) => ({
    sessionId: "approved-session",
    seed: 91,
    timestamp: new Date(Date.UTC(2026, 7, 1, 10, index)).toISOString(),
    caseId: item.id,
    answer: correctAnswer(item)
  }));

  for (let sessionIndex = 0; sessionIndex < 10; sessionIndex += 1) {
    core.createSession(100 + sessionIndex).cases.forEach((item, caseIndex) => {
      history.push({
        sessionId: `later-session-${sessionIndex}`,
        seed: 100 + sessionIndex,
        timestamp: new Date(Date.UTC(2026, 7, 2 + sessionIndex, 10, caseIndex)).toISOString(),
        caseId: item.id,
        answer: { conclusion: "", risk: "", action: "", source: "", rationale: "" }
      });
    });
  }

  const state = history.reduce((current, attempt) => core.recordAttempt(current, attempt), {});
  assert.equal(state.history.length, core.MAX_HISTORY);
  assert.equal(state.history.filter(attempt => attempt.sessionId === "approved-session").length, core.REQUIRED_CASES);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
});
