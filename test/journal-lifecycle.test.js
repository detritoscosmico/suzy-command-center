const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createRevision,
  normalizeHistoryMap,
  appendRevision,
  moveToTrash,
  restoreFromTrash,
  permanentlyDelete
} = require("../js/journal-lifecycle-core.js");

function entry(id = "trade-1", overrides = {}) {
  return {
    id,
    timestamp: "2026-08-02T12:00:00.000Z",
    asset: "EUR/USD",
    setup: "Pullback",
    rMultiple: 1,
    ...overrides
  };
}

test("cria revisão sem compartilhar referências com o registro original", () => {
  const original = entry();
  const revision = createRevision(original, "Antes da edição", "2026-08-02T13:00:00Z", "revision-1");

  original.setup = "Rompimento";

  assert.equal(revision.id, "revision-1");
  assert.equal(revision.reason, "Antes da edição");
  assert.equal(revision.entry.setup, "Pullback");
  assert.equal(revision.savedAt, "2026-08-02T13:00:00.000Z");
});

test("mantém somente as revisões mais recentes dentro do limite", () => {
  let history = {};
  for (let index = 0; index < 4; index += 1) {
    history = appendRevision(history, entry("trade-1", { rMultiple: index }), `Versão ${index}`, {
      limit: 3,
      savedAt: `2026-08-02T1${index}:00:00Z`,
      revisionId: `revision-${index}`
    });
  }

  assert.equal(history["trade-1"].length, 3);
  assert.deepEqual(history["trade-1"].map(item => item.id), ["revision-1", "revision-2", "revision-3"]);
});

test("descarta revisões inválidas ao normalizar o histórico", () => {
  const normalized = normalizeHistoryMap({
    "trade-1": [
      { id: "ok", savedAt: "2026-08-02T12:00:00Z", reason: "Teste", entry: entry("trade-1") },
      { id: "bad", savedAt: "inválida", entry: entry("trade-1") },
      null
    ]
  });

  assert.equal(normalized["trade-1"].length, 1);
  assert.equal(normalized["trade-1"][0].id, "ok");
});

test("move registro ativo para a lixeira preservando os dados", () => {
  const result = moveToTrash([entry("a"), entry("b")], [], "a", "2026-08-02T15:00:00Z");

  assert.deepEqual(result.entries.map(item => item.id), ["b"]);
  assert.equal(result.trash.length, 1);
  assert.equal(result.trash[0].id, "a");
  assert.equal(result.trash[0].deletedAt, "2026-08-02T15:00:00.000Z");
});

test("restaura item da lixeira e troca o ID quando existe conflito", () => {
  const result = restoreFromTrash(
    [entry("a", { setup: "Ativo atual" })],
    [{ ...entry("a", { setup: "Versão removida" }), deletedAt: "2026-08-02T15:00:00Z" }],
    "a",
    "a-restored"
  );

  assert.equal(result.restored.id, "a-restored");
  assert.equal(result.restored.setup, "Versão removida");
  assert.equal(result.entries.length, 2);
  assert.equal(result.trash.length, 0);
  assert.equal("deletedAt" in result.restored, false);
});

test("exclui definitivamente apenas o item selecionado da lixeira", () => {
  const trash = [entry("a"), entry("b")];
  assert.deepEqual(permanentlyDelete(trash, "a").map(item => item.id), ["b"]);
});
