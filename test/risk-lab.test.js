const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_LIMITS,
  calculatePositionSize,
  evaluatePortfolioExposure,
  evaluateRiskPolicy,
  parseOutcomes,
  runStressTest,
  simulateRuinRisk
} = require("../js/risk-lab-core.js");

test("dimensiona posição percentual pela distância do stop", () => {
  const result = calculatePositionSize({
    capital: 10000,
    riskMode: "PERCENT",
    riskPercent: 0.5,
    entry: 100,
    stop: 98,
    quantityStep: 1
  });

  assert.equal(result.valid, true);
  assert.equal(result.requestedRisk, 50);
  assert.equal(result.quantity, 25);
  assert.equal(result.actualRisk, 50);
  assert.equal(result.actualRiskPct, 0.5);
  assert.equal(result.notional, 2500);
});

test("arredonda quantidade para baixo para nunca exceder o orçamento de risco", () => {
  const result = calculatePositionSize({
    capital: 5000,
    riskMode: "FIXED",
    fixedRisk: 37,
    entry: 20,
    stop: 18.5,
    quantityStep: 5
  });

  assert.equal(result.quantity, 20);
  assert.equal(result.actualRisk, 30);
  assert.ok(result.actualRisk <= 37);
});

test("recusa entrada e stop iguais", () => {
  const result = calculatePositionSize({ capital: 10000, riskPercent: 1, entry: 50, stop: 50 });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("mesmo preço")));
});

test("sinaliza exposição agressiva sem fabricar recomendação", () => {
  const result = calculatePositionSize({ capital: 10000, riskPercent: 3, entry: 100, stop: 99 });

  assert.equal(result.valid, true);
  assert.ok(result.warnings.some(warning => warning.includes("acima de 2%")));
});

test("soma risco aberto e agrupa cenários correlacionados de forma conservadora", () => {
  const result = evaluatePortfolioExposure({
    capital: 10000,
    maxOpenRiskPct: 3,
    maxGroupRiskPct: 2,
    positions: [
      { asset: "AAPL", group: "Tecnologia EUA", plannedRisk: 80 },
      { asset: "NVDA", group: "Tecnologia EUA", plannedRisk: 70 },
      { asset: "VALE3", group: "Mineração", plannedRisk: 50 }
    ]
  });

  assert.equal(result.totalRisk, 200);
  assert.equal(result.totalRiskPct, 2);
  assert.equal(result.largestGroup.group, "Tecnologia EUA");
  assert.equal(result.largestGroup.risk, 150);
  assert.equal(result.passed, true);
});

test("reprova concentração mesmo quando o risco total ainda cabe no limite", () => {
  const result = evaluatePortfolioExposure({
    capital: 10000,
    maxOpenRiskPct: 4,
    maxGroupRiskPct: 1,
    positions: [
      { asset: "AAPL", group: "Tecnologia EUA", plannedRisk: 80 },
      { asset: "NVDA", group: "Tecnologia EUA", plannedRisk: 70 }
    ]
  });

  assert.equal(result.withinTotalLimit, true);
  assert.equal(result.withinGroupLimit, false);
  assert.equal(result.passed, false);
});

test("interpreta sequência em R e interrompe stress ao atingir stop da sessão", () => {
  const result = runStressTest({
    capital: 10000,
    riskPercent: 1,
    sessionStopPct: 2,
    outcomes: "-1, -1, -1, +2"
  });

  assert.equal(result.valid, true);
  assert.equal(result.halted, true);
  assert.equal(result.executedTrades, 3);
  assert.equal(result.skippedTrades, 1);
  assert.ok(result.finalEquity < 9801);
});

test("stress preserva resultados positivos sem confundi-los com aprovação de risco", () => {
  const result = runStressTest({ capital: 10000, riskPercent: 0.5, sessionStopPct: 2, outcomes: [1, -1, 1.5] });

  assert.equal(result.halted, false);
  assert.equal(result.executedTrades, 3);
  assert.ok(result.finalEquity > 10000);
});

test("política penaliza excesso de exposição mesmo sem considerar lucro", () => {
  const result = evaluateRiskPolicy({
    tradeRiskPct: 0.8,
    openRiskPct: 3.4,
    groupRiskPct: 2.4,
    sessionLossPct: 0,
    weeklyLossPct: 0,
    limits: DEFAULT_LIMITS
  });

  assert.equal(result.passed, false);
  assert.deepEqual(result.violations.map(item => item.id), ["open", "group"]);
});

test("parser limita o stress a cem resultados numéricos", () => {
  const outcomes = parseOutcomes(Array.from({ length: 140 }, (_, index) => index % 3 ? -1 : 2));
  assert.equal(outcomes.length, 100);
});

test("simulação de ruína é reproduzível com a mesma semente", () => {
  const input = {
    capital: 10000,
    riskPercent: 1,
    winRate: 45,
    averageWinR: 1.5,
    averageLossR: 1,
    trades: 100,
    paths: 500,
    ruinDrawdownPct: 50,
    seed: 42
  };
  const first = simulateRuinRisk(input);
  const second = simulateRuinRisk(input);

  assert.equal(first.valid, true);
  assert.deepEqual(first, second);
  assert.ok(first.ruinProbabilityPct >= 0 && first.ruinProbabilityPct <= 100);
});

test("simulação de ruína rejeita premissas impossíveis", () => {
  const result = simulateRuinRisk({ capital: 10000, riskPercent: 1, winRate: 120, averageWinR: 1, averageLossR: 1 });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("Taxa de acerto")));
});
