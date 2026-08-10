const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/financials-core.js");

function correctAnswer(item) {
  return {
    interpretation: item.expectedInterpretation,
    driver: item.expectedDriver,
    action: item.expectedAction,
    source: item.expectedSource,
    rationale: "A leitura reconcilia resultado, caixa, balanço e notas, explicita a limitação do dado e registra a próxima evidência necessária antes de qualquer conclusão de investimento."
  };
}

test("banco possui doze variantes únicas e fontes primárias identificadas", () => {
  assert.ok(core.CASES.length >= 12);
  assert.equal(new Set(core.CASES.map(item => item.id)).size, core.CASES.length);
  assert.ok(core.SOURCES.every(item => item.url.startsWith("https://")));
  assert.ok(core.CASES.every(item => core.SOURCES.some(source => source.id === item.expectedSource)));
});

test("snapshot calcula margens, FCF aproximado, liquidez e dívida líquida", () => {
  const summary = core.summarizeFinancialSnapshot({ revenue: 1000, grossProfit: 420, operatingProfit: 150, netIncome: 100, operatingCashFlow: 120, capex: 70, currentAssets: 500, currentLiabilities: 250, totalDebt: 300, cash: 80, equity: 400 });
  assert.equal(summary.grossMargin, 42);
  assert.equal(summary.operatingMargin, 15);
  assert.equal(summary.netMargin, 10);
  assert.equal(summary.freeCashFlowApprox, 50);
  assert.equal(summary.currentRatio, 2);
  assert.equal(summary.netDebt, 220);
  assert.equal(summary.netDebtToEquity, 0.55);
  assert.equal(summary.cashToIncome, 1.2);
  assert.equal(summary.cashBridge, "CASH_AHEAD");
});

test("snapshot trata denominador zero sem fabricar razão infinita", () => {
  const summary = core.summarizeFinancialSnapshot({ revenue: 0, currentLiabilities: 0, equity: 0, netIncome: 0 });
  assert.equal(summary.grossMargin, null);
  assert.equal(summary.currentRatio, null);
  assert.equal(summary.netDebtToEquity, null);
  assert.equal(summary.cashToIncome, null);
});

test("sessão é reproduzível, única e limitada a seis casos", () => {
  const first = core.createSession(42);
  const second = core.createSession(42);
  assert.deepEqual(first.cases.map(item => item.id), second.cases.map(item => item.id));
  assert.equal(first.cases.length, core.REQUIRED_CASES);
  assert.equal(new Set(first.cases.map(item => item.id)).size, core.REQUIRED_CASES);
});

test("leitura contábil completa recebe nota integral", () => {
  const item = core.findCase("cfo-boosted-by-payables");
  const grade = core.gradeCase(item.id, correctAnswer(item));
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("inverter leitura central de qualidade limita a nota a 49", () => {
  const item = core.findCase("profit-up-cfo-down");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), interpretation: "QUALITY_STRENGTHENED" });
  assert.equal(grade.score, 49);
  assert.equal(grade.passed, false);
  assert.match(grade.hardViolation, /inverteu a leitura central/);
});

test("forçar conclusão em caso condicional limita a nota a 69", () => {
  const item = core.findCase("growth-capex-negative-fcf");
  const grade = core.gradeCase(item.id, { ...correctAnswer(item), interpretation: "QUALITY_WEAKENED" });
  assert.ok(grade.score <= 69);
  assert.match(grade.hardViolation, /conclusão determinística/);
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
  const item = core.findCase("cfo-boosted-by-payables");
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