const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CASES,
  REQUIRED_CASES,
  createCaseSet,
  normalizeResponse,
  evaluateCase,
  evaluateCapstone
} = require("../js/capstone-core.js");

function blockedCase() {
  return CASES.find(item => item.blocked);
}

function clearCase() {
  return CASES.find(item => !item.blocked);
}

function noTradeResponse(overrides = {}) {
  return {
    action: "NO_TRADE",
    blockerAssessment: "BLOCKED",
    rationale: "O cenário possui um bloqueio explícito da política; ficar de fora preserva o processo e evita improvisação.",
    acceptsUncertainty: true,
    ...overrides
  };
}

function tradeResponse(scenario, overrides = {}) {
  return {
    action: "TRADE",
    blockerAssessment: "CLEAR",
    riskPercent: Math.min(0.5, scenario.policy.maxRiskPct),
    trigger: "Fechamento confirma retomada além da máxima de referência.",
    invalidation: "Perda do ponto estrutural que sustenta a hipótese do caso.",
    rationale: "Condições da política estão presentes, o risco foi definido antes do fill e a hipótese possui invalidação objetiva.",
    acceptsUncertainty: true,
    ...overrides
  };
}

test("gera conjunto reproduzível para a mesma semente", () => {
  assert.deepEqual(createCaseSet(42).map(item => item.id), createCaseSet(42).map(item => item.id));
  assert.equal(createCaseSet(42).length, REQUIRED_CASES);
});

test("sementes diferentes mudam a sequência de casos", () => {
  assert.notDeepEqual(createCaseSet(42).map(item => item.id), createCaseSet(99).map(item => item.id));
});

test("não operar é decisão válida quando existe bloqueio", () => {
  const result = evaluateCase(blockedCase(), noTradeResponse());

  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
  assert.equal(result.hardViolations.length, 0);
});

test("não operar também pode ser válido em caso sem bloqueio", () => {
  const result = evaluateCase(clearCase(), noTradeResponse({ blockerAssessment: "CLEAR" }));

  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
});

test("trade disciplinado pode passar em caso liberado", () => {
  const scenario = clearCase();
  const result = evaluateCase(scenario, tradeResponse(scenario));

  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
});

test("trade em caso bloqueado recebe penalidade dura mesmo com resposta completa", () => {
  const scenario = blockedCase();
  const result = evaluateCase(scenario, tradeResponse(scenario, { blockerAssessment: "BLOCKED" }));

  assert.equal(result.passed, false);
  assert.ok(result.score <= 49);
  assert.ok(result.hardViolations.some(item => item.includes("bloqueio obrigatório")));
});

test("risco acima do teto reprova e limita a nota", () => {
  const scenario = clearCase();
  const result = evaluateCase(scenario, tradeResponse(scenario, { riskPercent: scenario.policy.maxRiskPct + 1 }));

  assert.equal(result.passed, false);
  assert.ok(result.score <= 69);
  assert.ok(result.hardViolations.some(item => item.includes("Risco escolhido")));
});

test("trade exige gatilho e invalidação documentados", () => {
  const scenario = clearCase();
  const result = evaluateCase(scenario, tradeResponse(scenario, { trigger: "curto", invalidation: "curta" }));

  assert.equal(result.checks.find(item => item.id === "trigger").passed, false);
  assert.equal(result.checks.find(item => item.id === "invalidation").passed, false);
  assert.equal(result.passed, true);
  assert.equal(result.score, 80);
});

test("justificativa curta e falta de incerteza reduzem nota", () => {
  const result = evaluateCase(clearCase(), noTradeResponse({ blockerAssessment: "CLEAR", rationale: "Não quis.", acceptsUncertainty: false }));

  assert.equal(result.passed, false);
  assert.equal(result.score, 75);
});

test("normaliza texto e não aceita string como consentimento", () => {
  const response = normalizeResponse({ action: "trade", blockerAssessment: "blocked", rationale: `  ${"A ".repeat(600)}  `, acceptsUncertainty: "sim" });

  assert.equal(response.action, "TRADE");
  assert.equal(response.blockerAssessment, "BLOCKED");
  assert.ok(response.rationale.length <= 800);
  assert.equal(response.acceptsUncertainty, false);
});

test("capstone exige quatro casos aprovados sem violação dura", () => {
  const attempts = createCaseSet(42).map(scenario => evaluateCase(
    scenario,
    scenario.blocked ? noTradeResponse() : noTradeResponse({ blockerAssessment: "CLEAR" })
  ));
  const result = evaluateCapstone(attempts);

  assert.equal(result.total, 4);
  assert.equal(result.averageScore, 100);
  assert.equal(result.passed, true);
  assert.equal(result.status, "CICLO CONCLUÍDO");
});

test("resultado artificial nunca entra na nota", () => {
  const scenario = { ...clearCase(), outcome: "WIN artificial enorme" };
  const first = evaluateCase(scenario, tradeResponse(scenario));
  const second = evaluateCase({ ...scenario, outcome: "LOSS artificial enorme" }, tradeResponse(scenario));

  assert.equal(first.score, second.score);
  assert.equal(first.passed, second.passed);
});
