const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeJournalEntry } = require("../js/journal-core.js");
const {
  LIFECYCLE_META_PREFIX,
  normalizeSnapshot,
  fingerprintJournal,
  fingerprintJournalState,
  compareJournalSnapshots,
  compareJournalStates,
  cloneJournal,
  encodeRemoteJournal,
  decodeRemoteJournal,
  countRevisions
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

function state() {
  return {
    entries: [entry("active")],
    trash: [{ ...entry("deleted", { rMultiple: -1 }), deletedAt: "2026-08-03T12:00:00.000Z" }],
    history: {
      active: [{
        id: "revision-1",
        savedAt: "2026-08-03T11:00:00.000Z",
        reason: "Antes da edição",
        entry: entry("active", { setup: "Rompimento" })
      }]
    }
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

test("classifica estados de sincronização dos registros ativos", () => {
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

test("codifica e recupera registros, versões e lixeira no envelope SQLite", () => {
  const original = state();
  const remoteRows = encodeRemoteJournal(original.entries, original.trash, original.history, { chunkSize: 120 });
  const metadata = remoteRows.filter(row => row.id.startsWith(LIFECYCLE_META_PREFIX));

  assert.ok(metadata.length > 1);
  assert.ok(remoteRows.every(row => normalizeJournalEntry(row)));

  const decoded = decodeRemoteJournal(remoteRows);
  assert.equal(decoded.lifecycleFound, true);
  assert.equal(decoded.lifecycleError, null);
  assert.deepEqual(decoded.entries.map(item => item.id), ["active"]);
  assert.deepEqual(decoded.trash.map(item => item.id), ["deleted"]);
  assert.equal(decoded.history.active[0].entry.setup, "Rompimento");
  assert.equal(countRevisions(decoded.history), 1);
});

test("mantém impressão completa estável com ordem diferente", () => {
  const original = state();
  const reordered = {
    entries: [...original.entries].reverse(),
    trash: [...original.trash].reverse(),
    history: { active: [...original.history.active].reverse() }
  };

  assert.equal(fingerprintJournalState(original), fingerprintJournalState(reordered));
  assert.equal(compareJournalStates(original, reordered), "equal");
  assert.equal(compareJournalStates(original, {}), "local-only");
  assert.equal(compareJournalStates({}, original), "remote-only");
});

test("lê banco legado sem envelope sem descartar registros ativos", () => {
  const decoded = decodeRemoteJournal([entry("legacy")]);
  assert.equal(decoded.lifecycleFound, false);
  assert.equal(decoded.lifecycleError, null);
  assert.deepEqual(decoded.entries.map(item => item.id), ["legacy"]);
  assert.deepEqual(decoded.trash, []);
  assert.deepEqual(decoded.history, {});
});

test("bloqueia envelope incompleto em vez de restaurar metadados parciais", () => {
  const original = state();
  const rows = encodeRemoteJournal(original.entries, original.trash, original.history, { chunkSize: 100 });
  const corrupted = rows.filter(row => !row.id.endsWith("000001"));
  const decoded = decodeRemoteJournal(corrupted);

  assert.equal(decoded.lifecycleFound, true);
  assert.match(decoded.lifecycleError, /incompleto|ler versões/i);
  assert.deepEqual(decoded.entries.map(item => item.id), ["active"]);
  assert.deepEqual(decoded.trash, []);
});

test("recusa ciclo de vida acima do limite seguro", () => {
  const original = state();
  original.history.active = Array.from({ length: 8 }, (_, index) => ({
    id: `revision-${index}`,
    savedAt: `2026-08-03T${String(index).padStart(2, "0")}:00:00.000Z`,
    reason: "Versão extensa",
    entry: entry("active", { context: "x".repeat(600), lesson: "y".repeat(600) })
  }));

  assert.throws(
    () => encodeRemoteJournal(original.entries, original.trash, original.history, { maxLifecycleChars: 1_000 }),
    /excedem o limite seguro/i
  );
});