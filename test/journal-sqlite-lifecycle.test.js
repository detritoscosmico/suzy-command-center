const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApplication } = require("../server/server.js");
const { encodeRemoteJournal, decodeRemoteJournal, countRevisions } = require("../js/journal-sync-core.js");

function sessionCookie(response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header);
  return header.split(";", 1)[0];
}

async function requestJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  return { response, payload: await response.json() };
}

function entry(id, overrides = {}) {
  return {
    id,
    timestamp: "2026-08-04T08:00:00.000Z",
    asset: "BTC/USDT",
    market: "Cripto",
    session: "Global",
    timeframe: "M5",
    direction: "LONG",
    setup: "Pullback",
    rMultiple: 1.5,
    followedPlan: true,
    quality: 4,
    emotionBefore: "Calmo",
    emotionAfter: "Neutro",
    errorType: "Nenhum",
    context: "Contexto técnico artificial para teste.",
    lesson: "Manter o processo.",
    createdAt: "2026-08-04T08:01:00.000Z",
    ...overrides
  };
}

test("persiste e recupera registros, versões e lixeira após reiniciar o servidor", async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-lifecycle-sqlite-"));
  const dbPath = path.join(tempDir, "suzy.sqlite3");
  const rootDir = path.resolve(__dirname, "..");
  let app = createApplication({ rootDir, dbPath, port: 0 });
  let address = await app.start();

  t.after(async () => {
    if (app.server.listening) await app.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  let result = await requestJson(address.url, "/api/auth/setup", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaLifecycle2026" })
  });
  assert.equal(result.response.status, 201);
  let cookie = sessionCookie(result.response);
  let csrf = result.payload.csrfToken;

  const active = entry("active-1");
  const deleted = { ...entry("deleted-1", { rMultiple: -1 }), deletedAt: "2026-08-04T09:00:00.000Z" };
  const history = {
    "active-1": [{
      id: "revision-1",
      savedAt: "2026-08-04T08:30:00.000Z",
      reason: "Antes da edição",
      entry: entry("active-1", { setup: "Rompimento", context: "Versão anterior com acentuação: operação válida." })
    }]
  };
  const rows = encodeRemoteJournal([active], [deleted], history, { chunkSize: 120 });

  result = await requestJson(address.url, "/api/journal", {
    method: "PUT",
    headers: { Cookie: cookie, "X-CSRF-Token": csrf },
    body: JSON.stringify({ entries: rows })
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.total, rows.length);

  await app.close();
  app = createApplication({ rootDir, dbPath, port: 0 });
  address = await app.start();

  result = await requestJson(address.url, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaLifecycle2026" })
  });
  assert.equal(result.response.status, 200);
  cookie = sessionCookie(result.response);

  result = await requestJson(address.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: cookie }
  });
  assert.equal(result.response.status, 200);

  const decoded = decodeRemoteJournal(result.payload.entries);
  assert.equal(decoded.lifecycleFound, true);
  assert.equal(decoded.lifecycleError, null);
  assert.deepEqual(decoded.entries.map(item => item.id), ["active-1"]);
  assert.deepEqual(decoded.trash.map(item => item.id), ["deleted-1"]);
  assert.equal(decoded.history["active-1"][0].entry.setup, "Rompimento");
  assert.equal(decoded.history["active-1"][0].entry.context, "Versão anterior com acentuação: operação válida.");
  assert.equal(countRevisions(decoded.history), 1);
});