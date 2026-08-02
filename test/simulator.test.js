const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildQuote,
  validateOrder,
  submitOrder,
  processPendingOrder,
  evaluatePositionOnBar,
  closePositionAtMarket,
  summarizeTrades
} = require("../js/simulator-core.js");

const baseSettings = {
  pointSize: 1,
  spreadPoints: 2,
  slippagePoints: 1,
  commissionPerSide: 3,
  valuePerPoint: 2,
  stopPoints: 10,
  targetPoints: 20
};

function bar(overrides = {}) {
  const open = overrides.open ?? 100;
  const close = overrides.close ?? 100;
  return {
    time: 1_700_000_000_000,
    open,
    high: overrides.high ?? Math.max(open, close) + 2,
    low: overrides.low ?? Math.min(open, close) - 2,
    close
  };
}

test("calcula bid, ask e custo do spread", () => {
  const quote = buildQuote(100, baseSettings);
  assert.equal(quote.bid, 99);
  assert.equal(quote.ask, 101);
  assert.equal(quote.spreadValue, 4);
});

test("valida a posição de ordens limite e stop", () => {
  assert.equal(validateOrder({ type: "LIMIT", direction: "BUY", mid: 100, trigger: 101 }), "Uma ordem limite de compra deve ficar abaixo do preço médio.");
  assert.equal(validateOrder({ type: "STOP", direction: "SELL", mid: 100, trigger: 101 }), "Uma ordem stop de venda deve ficar abaixo do preço médio.");
  assert.equal(validateOrder({ type: "LIMIT", direction: "BUY", mid: 100, trigger: 95 }), "");
});

test("ordem a mercado compra no ask com slippage adverso", () => {
  const result = submitOrder({ id: "m1", type: "MARKET", direction: "BUY", mid: 100 }, baseSettings);
  assert.equal(result.error, "");
  assert.equal(result.position.entry, 102);
  assert.equal(result.position.stop, 92);
  assert.equal(result.position.target, 122);
  assert.equal(result.position.entryCommission, 3);
});

test("ordem limite recebe melhora em abertura abaixo do limite", () => {
  const submitted = submitOrder({ id: "l1", type: "LIMIT", direction: "BUY", mid: 100, trigger: 95 }, baseSettings);
  const processed = processPendingOrder(submitted.pendingOrder, bar({ open: 94, high: 97, low: 93, close: 96 }), baseSettings);

  assert.equal(processed.filled, true);
  assert.equal(processed.position.entry, 94);
});

test("ordem stop aplica gap e slippage adverso", () => {
  const submitted = submitOrder({ id: "s1", type: "STOP", direction: "BUY", mid: 100, trigger: 105 }, baseSettings);
  const processed = processPendingOrder(submitted.pendingOrder, bar({ open: 107, high: 110, low: 106, close: 109 }), baseSettings);

  assert.equal(processed.filled, true);
  assert.equal(processed.position.entry, 108);
});

test("alvo registra bruto, comissões e resultado líquido", () => {
  const settings = { ...baseSettings, spreadPoints: 0, slippagePoints: 0, commissionPerSide: 2, valuePerPoint: 1 };
  const position = submitOrder({ id: "p1", type: "MARKET", direction: "BUY", mid: 100 }, settings).position;
  const result = evaluatePositionOnBar(position, bar({ open: 100, high: 121, low: 99, close: 120 }), settings);

  assert.equal(result.closed, true);
  assert.equal(result.trade.result, "WIN");
  assert.equal(result.trade.grossPoints, 20);
  assert.equal(result.trade.grossMoney, 20);
  assert.equal(result.trade.costs, 4);
  assert.equal(result.trade.netMoney, 16);
});

test("stop prevalece quando stop e alvo aparecem no mesmo candle", () => {
  const settings = { ...baseSettings, spreadPoints: 0, slippagePoints: 0, commissionPerSide: 2, valuePerPoint: 1 };
  const position = submitOrder({ id: "p2", type: "MARKET", direction: "BUY", mid: 100 }, settings).position;
  const result = evaluatePositionOnBar(position, bar({ open: 100, high: 125, low: 85, close: 110 }), settings);

  assert.equal(result.trade.result, "LOSS");
  assert.equal(result.trade.grossPoints, -10);
  assert.equal(result.trade.netMoney, -14);
  assert.match(result.trade.exitReason, /critério conservador/);
});

test("fechamento a mercado paga spread, slippage e comissão", () => {
  const position = submitOrder({ id: "p3", type: "MARKET", direction: "BUY", mid: 100 }, baseSettings).position;
  const result = closePositionAtMarket(position, 110);

  assert.equal(result.error, "");
  assert.equal(result.trade.exit, 108);
  assert.equal(result.trade.grossPoints, 6);
  assert.equal(result.trade.grossMoney, 12);
  assert.equal(result.trade.costs, 6);
  assert.equal(result.trade.netMoney, 6);
});

test("resume resultado bruto, custos, líquido e taxa de acerto", () => {
  const summary = summarizeTrades([
    { status: "CLOSED", result: "WIN", grossMoney: 20, costs: 4, netMoney: 16 },
    { status: "CLOSED", result: "LOSS", grossMoney: -10, costs: 4, netMoney: -14 }
  ]);

  assert.equal(summary.total, 2);
  assert.equal(summary.winrate, 50);
  assert.equal(summary.gross, 10);
  assert.equal(summary.costs, 8);
  assert.equal(summary.net, 2);
  assert.equal(summary.averageNet, 1);
});
