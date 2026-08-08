const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildMarketConditions,
  simulateExecution,
  evaluateExecutionQuality,
  summarizeExecutions
} = require("../js/microstructure-core.js");

const normalMarket = {
  mid: 100,
  pointSize: 1,
  baseSpreadPoints: 2,
  baseSlippagePoints: 1,
  volatility: "NORMAL",
  liquidity: "NORMAL",
  availableQuantity: 100,
  valuePerPoint: 1,
  commissionPerOrder: 2
};

function bar(overrides = {}) {
  const open = overrides.open ?? 100;
  const close = overrides.close ?? open;
  return {
    open,
    high: overrides.high ?? Math.max(open, close) + 5,
    low: overrides.low ?? Math.min(open, close) - 5,
    close
  };
}

test("amplia spread quando volatilidade sobe e liquidez afina", () => {
  const normal = buildMarketConditions(normalMarket);
  const stressed = buildMarketConditions({ ...normalMarket, volatility: "HIGH", liquidity: "THIN" });

  assert.equal(normal.spreadPoints, 2);
  assert.equal(stressed.spreadPoints, 6.48);
  assert.ok(stressed.baselineSlippagePoints > normal.baselineSlippagePoints);
});

test("ordem a mercado paga meio spread e slippage com impacto de participação", () => {
  const result = simulateExecution({
    market: normalMarket,
    order: { type: "MARKET", direction: "BUY", quantity: 50 }
  });

  assert.equal(result.status, "FILLED");
  assert.equal(result.spreadComponentPoints, 1);
  assert.equal(result.slippageComponentPoints, 1.375);
  assert.equal(result.fillPrice, 102.375);
  assert.equal(result.adverseDeviationPoints, 2.375);
});

test("liquidez insuficiente produz preenchimento parcial explícito", () => {
  const result = simulateExecution({
    market: { ...normalMarket, availableQuantity: 30 },
    order: { type: "MARKET", direction: "SELL", quantity: 100 }
  });

  assert.equal(result.status, "PARTIAL");
  assert.equal(result.filledQuantity, 30);
  assert.equal(result.unfilledQuantity, 70);
  assert.equal(result.fillPct, 30);
});

test("ausência de liquidez não fabrica preenchimento", () => {
  const result = simulateExecution({
    market: { ...normalMarket, availableQuantity: 0 },
    order: { type: "MARKET", direction: "BUY", quantity: 10 }
  });

  assert.equal(result.status, "NO_LIQUIDITY");
  assert.equal(result.filledQuantity, 0);
});

test("ordem limite nunca executa compra pior que o preço limite", () => {
  const result = simulateExecution({
    market: normalMarket,
    order: { type: "LIMIT", direction: "BUY", quantity: 10, trigger: 95 },
    bar: bar({ open: 94, high: 97, low: 93, close: 96 })
  });

  assert.equal(result.status, "FILLED");
  assert.equal(result.fillPrice, 94);
  assert.equal(result.limitProtected, true);
  assert.ok(result.adverseDeviationPoints <= 0);
});

test("ordem não tocada permanece sem execução", () => {
  const result = simulateExecution({
    market: normalMarket,
    order: { type: "LIMIT", direction: "BUY", quantity: 10, trigger: 90 },
    bar: bar({ open: 100, high: 103, low: 97, close: 101 })
  });

  assert.equal(result.status, "NOT_TRIGGERED");
  assert.equal(result.filledQuantity, 0);
});

test("stop com gap separa gap, spread e slippage no desvio", () => {
  const result = simulateExecution({
    market: normalMarket,
    order: { type: "STOP", direction: "BUY", quantity: 10, trigger: 105 },
    bar: bar({ open: 108, high: 112, low: 107, close: 110 })
  });

  assert.equal(result.status, "FILLED");
  assert.equal(result.gapComponentPoints, 3);
  assert.equal(result.spreadComponentPoints, 1);
  assert.ok(result.slippageComponentPoints > 1);
  assert.equal(result.adverseDeviationPoints, result.gapComponentPoints + result.spreadComponentPoints + result.slippageComponentPoints);
});

test("rubrica reprova fill parcial abaixo do mínimo sem olhar resultado financeiro", () => {
  const execution = simulateExecution({
    market: { ...normalMarket, availableQuantity: 40 },
    order: { type: "MARKET", direction: "BUY", quantity: 100 }
  });
  const quality = evaluateExecutionQuality(execution, { maxSlippagePoints: 3, minimumFillPct: 80, maxGapPoints: 5 });

  assert.equal(quality.passed, false);
  assert.equal(quality.checks.find(check => check.id === "fill").passed, false);
});

test("rubrica aprova execução que respeita todos os limites", () => {
  const execution = simulateExecution({
    market: { ...normalMarket, baseSlippagePoints: 0.2 },
    order: { type: "MARKET", direction: "SELL", quantity: 10 }
  });
  const quality = evaluateExecutionQuality(execution, { maxSlippagePoints: 1, minimumFillPct: 90, maxGapPoints: 2 });

  assert.equal(quality.passed, true);
  assert.equal(quality.score, 100);
});

test("custo de implementação cresce com quantidade preenchida e comissão", () => {
  const result = simulateExecution({
    market: normalMarket,
    order: { type: "MARKET", direction: "BUY", quantity: 20 }
  });

  assert.ok(result.executionCostMoney > result.commission);
  assert.equal(result.commission, 2);
});

test("resume tentativas sem usar P/L ou winrate", () => {
  const a = simulateExecution({ market: normalMarket, order: { type: "MARKET", direction: "BUY", quantity: 10 } });
  const b = simulateExecution({ market: { ...normalMarket, availableQuantity: 5 }, order: { type: "MARKET", direction: "SELL", quantity: 10 } });
  const summary = summarizeExecutions([
    { execution: a, quality: evaluateExecutionQuality(a) },
    { execution: b, quality: evaluateExecutionQuality(b) }
  ]);

  assert.equal(summary.total, 2);
  assert.equal(summary.averageFillPct, 75);
  assert.ok(!Object.hasOwn(summary, "winrate"));
});
