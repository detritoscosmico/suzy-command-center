const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeSnapshot,
  fingerprintJournal,
  compareJournalSnapshots,
  cloneJournal
} = require("../js/journal-sync-core.js");

function entry(id, overrides = {}) {
  return {
    id,
    timestamp: "2026-08-02T10:00:00.000Z",
    asset: "EUR/USD",
    market: "Forex",
    session: "Londres",
    timeframe: "M5",
    direction: "LONG",
    setup: "Pullback",
    rMultiple: 2,
    result: "WIN",
    followedPlan: true,
    quality: 4,
    emotionBefore: "Calmo",
    emotionAfter: "Neutro",
    errorType: "Nenhum",
    context: "Estrutura alinhada.",
    lesson: "Repetir o processo.",
    createdAt: "2026-08-02T10:01:00.000Z",
    ...overrides
  };
}

test("normaliza, ordena e remove IDs duplicados", () => {
  const snapshot = normalizeSnapshot([
    entry("b"),
    entry("a", { rMultiple: -1 }),
    entry("b", { rMultiple: 1 })
  ]);

  assert.deepEqual(snapshot.map(item => item.id), ["a", "b"]);
  assert.equal(snapshot[1].rMultiple, 1);
});

test("gera impressão estável independentemente da ordem", () => {
  const left = fingerprintJournal([entry("b"), entry("a")]);
  const right = fingerprintJournal([entry("a"), entry("b")]);
  assert.equal(left, right);
});

test("classifica estados de sincronização", () => {
  assert.equal(compareJournalSnapshots([], []), "empty");
  assert.equal(compareJournalSnapshots([entry("a")], [entry("a")]), "equal");
  assert.equal(compareJournalSnapshots([entry("a")], []), "local-only");
  assert.equal(compareJournalSnapshots([], [entry("a")]), "remote-only");
  assert.equal(compareJournalSnapshots([entry("a")], [entry("a", { rMultiple: -1 })]), "diverged");
});

test("clona sem compartilhar referências", () => {
  const source = [entry("a")];
  const cloned = cloneJournal(source);
  cloned[0].asset = "BTC/USD";
  assert.equal(source[0].asset, "EUR/USD");
});