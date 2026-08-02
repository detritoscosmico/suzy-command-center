const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createReplaySession,
  visibleCandles,
  openReplayTrade,
  evaluateTradeOnCandle,
  advanceReplay,
  summarizeReplay,
  detectDelimiter,
  parseHistoricalCsv
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

function csvRows(count = 30, delimiter = ",") {
  const header = ["time", "open", "high", "low", "close"].join(delimiter);
  const rows = Array.from({ length: count }, (_, index) => {
    const time = new Date(Date.UTC(2026, 0, 2, 10, index * 5)).toISOString();
    return [time, 100 + index, 101 + index, 99 + index, 100.5 + index].join(delimiter);
  });
  return [header, ...rows].join("\n");
}

test("cria replay ocultando os candles futuros", () => {
  const session = createReplaySession(series(40), { initialVisible: 20, asset: "TESTE", timeframe: "M5" });

  assert.equal(session.cursor, 20);
  assert.equal(session.complete, false);
  assert.equal(visibleCandles(session).length, 20);
  assert.equal(session.asset, "TESTE");
  assert.equal(session.source, "ARTIFICIAL");
});

test("preserva a origem do histórico importado", () => {
  const session = createReplaySession(series(40), {
    initialVisible: 20,
    source: "CSV_IMPORT",
    sourceName: "historico.csv"
  });

  assert.equal(session.source, "CSV_IMPORT");
  assert.equal(session.sourceName, "historico.csv");
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

test("detecta delimitadores comuns e importa CSV válido", () => {
  assert.equal(detectDelimiter(csvRows(30, ";")), ";");
  assert.equal(detectDelimiter(csvRows(30, ",")), ",");

  const parsed = parseHistoricalCsv(csvRows(30, ","));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.validRows, 30);
  assert.equal(parsed.candles.length, 30);
  assert.ok(parsed.candles[0].time < parsed.candles.at(-1).time);
});

test("aceita cabeçalhos em português e números com vírgula decimal", () => {
  const rows = ["data;abertura;máxima;mínima;fechamento"];
  for (let index = 0; index < 30; index += 1) {
    const minute = String(index).padStart(2, "0");
    rows.push(`02/01/2026 10:${minute};1,1000;1,1020;1,0990;1,1010`);
  }

  const parsed = parseHistoricalCsv(rows.join("\n"));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.candles[0].open, 1.1);
  assert.equal(parsed.candles[0].high, 1.102);
});

test("reordena candles e remove timestamps duplicados", () => {
  const lines = csvRows(30, ",").split("\n");
  const header = lines.shift();
  const duplicated = lines[5];
  const parsed = parseHistoricalCsv([header, ...lines.reverse(), duplicated].join("\n"));

  assert.equal(parsed.valid, true);
  assert.equal(parsed.duplicateRows, 1);
  assert.match(parsed.warnings.join(" "), /reordenados/);
  assert.ok(parsed.candles[0].time < parsed.candles.at(-1).time);
});

test("rejeita CSV sem colunas obrigatórias ou sem amostra mínima", () => {
  const missing = parseHistoricalCsv("time,open,close\n2026-01-01,1,1");
  assert.equal(missing.valid, false);
  assert.match(missing.errors[0], /Colunas obrigatórias ausentes/);

  const tooShort = parseHistoricalCsv(csvRows(12, ","));
  assert.equal(tooShort.valid, false);
  assert.match(tooShort.errors.at(-1), /pelo menos 30 candles/);
});
