const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeJournalEntry,
  calculateMaxDrawdown,
  summarizeJournal,
  groupJournal,
  filterJournal,
  equityCurve,
  topProcessErrors
} = require("../js/journal-core.js");

function entry(overrides = {}) {
  return {
    id: overrides.id ?? Math.random().toString(36),
    timestamp: overrides.timestamp ?? "2026-08-01T12:00:00.000Z",
    asset: overrides.asset ?? "EUR/USD",
    market: overrides.market ?? "Forex",
    session: overrides.session ?? "Londres",
    timeframe: overrides.timeframe ?? "M5",
    direction: overrides.direction ?? "LONG",
    setup: overrides.setup ?? "Pullback",
    rMultiple: overrides.rMultiple ?? 1,
    followedPlan: overrides.followedPlan ?? true,
    quality: overrides.quality ?? 4,
    emotionBefore: overrides.emotionBefore ?? "Calmo",
    emotionAfter: overrides.emotionAfter ?? "Neutro",
    errorType: overrides.errorType ?? "Nenhum",
    context: overrides.context ?? "Estrutura favorável",
    lesson: overrides.lesson ?? "Repetir processo"
  };
}

test("normaliza registro e deriva resultado pelo múltiplo R", () => {
  const normalized = normalizeJournalEntry(entry({ asset: " btc/usdt ", rMultiple: -1.234, quality: 9 }));

  assert.equal(normalized.asset, "BTC/USDT");
  assert.equal(normalized.result, "LOSS");
  assert.equal(normalized.rMultiple, -1.23);
  assert.equal(normalized.quality, 5);
});

test("rejeita registro sem data, ativo, setup ou resultado válido", () => {
  assert.equal(normalizeJournalEntry(entry({ timestamp: "inválida" })), null);
  assert.equal(normalizeJournalEntry(entry({ asset: "" })), null);
  assert.equal(normalizeJournalEntry(entry({ setup: "" })), null);
  assert.equal(normalizeJournalEntry(entry({ rMultiple: "abc" })), null);
});

test("calcula expectativa, profit factor, aderência e drawdown", () => {
  const entries = [
    entry({ id: "1", timestamp: "2026-08-01T10:00:00Z", rMultiple: 2, followedPlan: true, quality: 5 }),
    entry({ id: "2", timestamp: "2026-08-01T11:00:00Z", rMultiple: -1, followedPlan: true, quality: 4 }),
    entry({ id: "3", timestamp: "2026-08-01T12:00:00Z", rMultiple: -1, followedPlan: false, quality: 2 }),
    entry({ id: "4", timestamp: "2026-08-01T13:00:00Z", rMultiple: 1.5, followedPlan: true, quality: 3 })
  ];
  const summary = summarizeJournal(entries);

  assert.equal(summary.total, 4);
  assert.equal(summary.winrate, 50);
  assert.equal(summary.totalR, 1.5);
  assert.equal(summary.expectancy, 0.38);
  assert.equal(summary.profitFactor, 1.75);
  assert.equal(summary.maxDrawdown, 2);
  assert.equal(summary.adherence, 75);
  assert.equal(summary.averageQuality, 3.5);
});

test("retorna profit factor infinito como null quando não há perdas", () => {
  const summary = summarizeJournal([entry({ rMultiple: 1 }), entry({ rMultiple: 2 })]);
  assert.equal(summary.profitFactor, null);
});

test("agrupa estatísticas por setup", () => {
  const groups = groupJournal([
    entry({ id: "1", setup: "Pullback", rMultiple: 2 }),
    entry({ id: "2", setup: "Pullback", rMultiple: -1 }),
    entry({ id: "3", setup: "Rompimento", rMultiple: 1 })
  ], "setup");

  assert.equal(groups[0].name, "Pullback");
  assert.equal(groups[0].total, 2);
  assert.equal(groups[0].totalR, 1);
  assert.equal(groups[1].name, "Rompimento");
});

test("filtra por período, ativo, sessão e resultado", () => {
  const entries = [
    entry({ id: "1", timestamp: "2026-08-01T10:00:00Z", asset: "EUR/USD", session: "Londres", rMultiple: 1 }),
    entry({ id: "2", timestamp: "2026-08-02T10:00:00Z", asset: "BTC/USDT", session: "Nova York", rMultiple: -1 }),
    entry({ id: "3", timestamp: "2026-08-03T10:00:00Z", asset: "EUR/USD", session: "Londres", rMultiple: 0 })
  ];

  const filtered = filterJournal(entries, {
    from: "2026-08-01",
    to: "2026-08-02",
    asset: "BTC/USDT",
    session: "Nova York",
    result: "LOSS"
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "2");
});

test("gera curva acumulada em ordem cronológica", () => {
  const curve = equityCurve([
    entry({ id: "2", timestamp: "2026-08-02T10:00:00Z", rMultiple: -1 }),
    entry({ id: "1", timestamp: "2026-08-01T10:00:00Z", rMultiple: 2 }),
    entry({ id: "3", timestamp: "2026-08-03T10:00:00Z", rMultiple: 1.5 })
  ]);

  assert.deepEqual(curve.map(point => point.equity), [2, 1, 2.5]);
});

test("classifica erros recorrentes por frequência", () => {
  const errors = topProcessErrors([
    entry({ id: "1", errorType: "FOMO" }),
    entry({ id: "2", errorType: "FOMO" }),
    entry({ id: "3", errorType: "Stop alterado" }),
    entry({ id: "4", errorType: "Nenhum" })
  ]);

  assert.deepEqual(errors, [
    { name: "FOMO", total: 2 },
    { name: "Stop alterado", total: 1 }
  ]);
});

test("calcula drawdown pela curva acumulada", () => {
  const entries = [
    entry({ id: "1", timestamp: "2026-08-01T10:00:00Z", rMultiple: 3 }),
    entry({ id: "2", timestamp: "2026-08-01T11:00:00Z", rMultiple: -1 }),
    entry({ id: "3", timestamp: "2026-08-01T12:00:00Z", rMultiple: -2 }),
    entry({ id: "4", timestamp: "2026-08-01T13:00:00Z", rMultiple: 1 })
  ];

  assert.equal(calculateMaxDrawdown(entries), 3);
});
