const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createReplaySession,
  visibleCandles,
  openReplayTrade,
  evaluateTradeOnCandle,
  advanceReplay,
  summarizeReplay
} = require("../js/replay-core.js");

function candle(index, overrides = {}) {
  const open = overrides.open ?? 100;
  const close = overrides.close ?? 100;
  return {
    time: 1_700_000_000_000 + index * 300_000,
    open,
    high: overrides.high ?? Math.max(open, close) + 0.4,
    low: overrides.low ?? Math.min(open, close) - 0.4,
    close
  };
}

function series(count = 25) {
  return Array.from({ length: count }, (_, index) => candle(index));
}

test("cria replay ocultando os candles futuros", () => {
  const session = createReplaySession(series(40), { initialVisible: 20, asset: "TESTE", timeframe: "M5" });

  assert.equal(session.cursor, 20);
  assert.equal(session.complete, false);
  assert.equal(visibleCandles(session).length, 20);
  assert.equal(session.asset, "TESTE");
});

test("abre compra com stop e alvo definidos antes do avanço", () => {
  const session = createReplaySession(series(30), { initialVisible: 20 });
  const result = openReplayTrade(session, {
    id: "trade-1",
    direction: "LONG",
    stopDistancePct: 1,
    riskReward: 2,
    note: "pullback"
  });

  assert.equal(result.error, "");
  assert.equal(result.state.openTrade.entry, 100);
  assert.equal(result.state.openTrade.stop, 99);
  assert.equal(result.state.openTrade.target, 102);
  assert.equal(result.state.openTrade.note, "pullback");
});

test("impede abrir duas posições simultâneas", () => {
  const session = createReplaySession(series(30), { initialVisible: 20 });
  const first = openReplayTrade(session, { direction: "LONG", stopDistancePct: 1, riskReward: 2 });
  const second = openReplayTrade(first.state, { direction: "SHORT", stopDistancePct: 1, riskReward: 2 });

  assert.equal(second.error, "Já existe uma posição aberta.");
});

test("fecha compra no alvo e registra resultado em R", () => {
  const candles = series(30);
  candles[20] = candle(20, { open: 100, high: 102.2, low: 99.5, close: 101.8 });
  const session = createReplaySession(candles, { initialVisible: 20 });
  const opened = openReplayTrade(session, { direction: "LONG", stopDistancePct: 1, riskReward: 2 });
  const advanced = advanceReplay(opened.state);

  assert.equal(advanced.event.type, "TRADE_CLOSED");
  assert.equal(advanced.event.trade.result, "WIN");
  assert.equal(advanced.event.trade.rMultiple, 2);
  assert.equal(advanced.state.openTrade, null);
  assert.equal(advanced.state.trades.length, 1);
});

test("usa stop conservador quando stop e alvo são tocados na mesma vela", () => {
  const trade = openReplayTrade(
    createReplaySession(series(30), { initialVisible: 20 }),
    { direction: "LONG", stopDistancePct: 1, riskReward: 2 }
  ).state.openTrade;
  const closed = evaluateTradeOnCandle(trade, candle(20, { high: 103, low: 98, close: 101 }));

  assert.equal(closed.result, "LOSS");
  assert.equal(closed.rMultiple, -1);
  assert.match(closed.reason, /critério conservador/);
});

test("avança sem posição e mantém futuros ocultos", () => {
  const session = createReplaySession(series(30), { initialVisible: 20 });
  const advanced = advanceReplay(session);

  assert.equal(advanced.event.type, "CANDLE");
  assert.equal(advanced.state.cursor, 21);
  assert.equal(visibleCandles(advanced.state).length, 21);
  assert.equal(advanced.state.trades.length, 0);
});

test("resume winrate, expectativa e drawdown em R", () => {
  const summary = summarizeReplay([
    { status: "CLOSED", result: "WIN", rMultiple: 2 },
    { status: "CLOSED", result: "LOSS", rMultiple: -1 },
    { status: "CLOSED", result: "LOSS", rMultiple: -1 },
    { status: "CLOSED", result: "WIN", rMultiple: 1.5 }
  ]);

  assert.equal(summary.total, 4);
  assert.equal(summary.wins, 2);
  assert.equal(summary.losses, 2);
  assert.equal(summary.winrate, 50);
  assert.equal(summary.totalR, 1.5);
  assert.equal(summary.expectancy, 0.38);
  assert.equal(summary.maxDrawdown, 2);
  assert.deepEqual(summary.curve, [2, 1, 0, 1.5]);
});
