const test = require("node:test");
const assert = require("node:assert/strict");
const {
  THRESHOLDS,
  normalizePlaybook,
  evaluatePlaybook,
  evaluateProgram
} = require("../js/professional-core.js");

function completePlaybook(overrides = {}) {
  return {
    market: "Forex — EUR/USD",
    setup: "Pullback a favor da estrutura",
    context: "Tendência definida e ausência de evento bloqueador",
    trigger: "Retomada com fechamento além da máxima do candle de rejeição",
    invalidation: "Perda do fundo estrutural que sustenta a hipótese",
    riskPerTradePct: 0.5,
    dailyStopR: 2,
    maxTrades: 3,
    reviewRoutine: "Revisar execução, captura e aderência depois da sessão",
    acceptsUncertainty: true,
    ...overrides
  };
}

function completeEvidence(overrides = {}) {
  return {
    academy1: { completed: 6, total: 6, passed: true, bestScore: 80 },
    academy2: { completed: 8, total: 8, passed: true, bestScore: 83 },
    replayTrades: 20,
    simulatorTrades: 10,
    journal: { total: 20, adherence: 85, averageQuality: 4.2 },
    psychology: { lessons: 5, assessments: 1, checkIns: 7 },
    ...overrides
  };
}

test("inicia a jornada sem liberar etapas posteriores", () => {
  const result = evaluateProgram();

  assert.equal(result.percent, 0);
  assert.equal(result.completedStages, 0);
  assert.equal(result.stages[0].unlocked, true);
  assert.equal(result.stages[1].unlocked, false);
  assert.equal(result.nextAction.label, "Academia Nível 1 aprovada");
});

test("mede prática por amostra e não exige resultado financeiro positivo", () => {
  const evidence = completeEvidence({
    replayTrades: THRESHOLDS.replayTrades,
    simulatorTrades: THRESHOLDS.simulatorTrades,
    totalR: -12,
    netMoney: -500
  });
  const result = evaluateProgram(evidence, completePlaybook());

  assert.equal(result.stages.find(stage => stage.id === "practice").passed, true);
  assert.equal(result.qualified, true);
});

test("não contabiliza gate posterior antes da sequência obrigatória", () => {
  const evidence = completeEvidence({
    academy1: { completed: 0, total: 6, passed: false, bestScore: 0 },
    academy2: { completed: 0, total: 8, passed: false, bestScore: 0 }
  });
  const result = evaluateProgram(evidence, completePlaybook());

  assert.equal(result.completedStages, 0);
  assert.equal(result.stages.find(stage => stage.id === "practice").evidenceComplete, true);
  assert.equal(result.stages.find(stage => stage.id === "practice").passed, false);
  assert.equal(result.stages.find(stage => stage.id === "practice").unlocked, false);
});

test("conclui o ciclo somente com todas as evidências e playbook válido", () => {
  const result = evaluateProgram(completeEvidence(), completePlaybook());

  assert.equal(result.completedStages, 5);
  assert.equal(result.percent, 100);
  assert.equal(result.qualified, true);
  assert.equal(result.nextAction, null);
  assert.equal(result.status, "Ciclo profissional concluído");
});

test("recusa playbook incompleto ou com risco acima do limite educacional", () => {
  const missing = evaluatePlaybook({});
  const excessiveRisk = evaluatePlaybook(completePlaybook({ riskPerTradePct: 5 }));

  assert.equal(missing.valid, false);
  assert.ok(missing.missing.includes("Setup descrito em regras"));
  assert.equal(excessiveRisk.valid, false);
  assert.ok(excessiveRisk.missing.includes("Risco por operação entre 0,10% e 2%"));
});

test("normaliza texto e limites numéricos do playbook", () => {
  const normalized = normalizePlaybook({
    market: `  ${"A".repeat(80)}  `,
    riskPerTradePct: -10,
    dailyStopR: 150,
    maxTrades: 3.9,
    acceptsUncertainty: "sim"
  });

  assert.equal(normalized.market.length, 50);
  assert.equal(normalized.riskPerTradePct, 0);
  assert.equal(normalized.dailyStopR, 100);
  assert.equal(normalized.maxTrades, 3);
  assert.equal(normalized.acceptsUncertainty, false);
});

test("mantém a disciplina independente da faixa da autoavaliação", () => {
  const result = evaluateProgram(completeEvidence({
    psychology: { lessons: 5, assessments: 2, checkIns: 10, score: 100 }
  }), completePlaybook());

  assert.equal(result.stages.find(stage => stage.id === "discipline").passed, true);
});
