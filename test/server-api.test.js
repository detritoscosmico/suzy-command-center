const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApplication } = require("../server/server.js");

function sessionCookie(response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header, "A resposta deve criar cookie de sessão.");
  return header.split(";", 1)[0];
}

async function jsonRequest(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json();
  return { response, payload };
}

test("configura conta, autentica e persiste diário em SQLite", async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-server-"));
  const dbPath = path.join(tempDir, "suzy.sqlite3");
  const rootDir = path.resolve(__dirname, "..");
  const firstApp = createApplication({ rootDir, dbPath, port: 0 });
  const firstAddress = await firstApp.start();
  t.after(async () => {
    if (firstApp.server.listening) await firstApp.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  let result = await jsonRequest(firstAddress.url, "/api/auth/status", { method: "GET" });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.configured, false);
  assert.equal(result.payload.authenticated, false);

  result = await jsonRequest(firstAddress.url, "/api/auth/setup", {
    method: "POST",
    body: JSON.stringify({ username: "Danilo", password: "SenhaLocal2026Segura" })
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.payload.authenticated, true);
  assert.equal(result.payload.username, "danilo");
  assert.match(result.payload.recoveryKey, /^SUZY-/);
  const cookie = sessionCookie(result.response);
  const csrfToken = result.payload.csrfToken;

  const entry = {
    id: "trade-1",
    timestamp: "2026-08-02T10:00:00.000Z",
    asset: "EUR/USD",
    market: "Forex",
    session: "Londres",
    timeframe: "M5",
    direction: "LONG",
    setup: "Pullback",
    rMultiple: 2,
    followedPlan: true,
    quality: 5,
    emotionBefore: "Calmo",
    emotionAfter: "Neutro",
    errorType: "Nenhum",
    context: "Estrutura alinhada",
    lesson: "Repetir processo"
  };

  result = await jsonRequest(firstAddress.url, "/api/journal", {
    method: "PUT",
    headers: { Cookie: cookie },
    body: JSON.stringify({ entries: [entry] })
  });
  assert.equal(result.response.status, 403);

  result = await jsonRequest(firstAddress.url, "/api/journal", {
    method: "PUT",
    headers: { Cookie: cookie, "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ entries: [entry] })
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.total, 1);

  result = await jsonRequest(firstAddress.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: cookie }
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.total, 1);
  assert.equal(result.payload.entries[0].asset, "EUR/USD");
  assert.equal(result.payload.entries[0].rMultiple, 2);

  await firstApp.close();

  const secondApp = createApplication({ rootDir, dbPath, port: 0 });
  const secondAddress = await secondApp.start();
  t.after(async () => {
    if (secondApp.server.listening) await secondApp.close();
  });

  result = await jsonRequest(secondAddress.url, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaLocal2026Segura" })
  });
  assert.equal(result.response.status, 200);
  const secondCookie = sessionCookie(result.response);
  const secondCsrf = result.payload.csrfToken;

  result = await jsonRequest(secondAddress.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: secondCookie }
  });
  assert.equal(result.payload.total, 1);

  result = await jsonRequest(secondAddress.url, "/api/auth/logout", {
    method: "POST",
    headers: { Cookie: secondCookie, "X-CSRF-Token": secondCsrf },
    body: "{}"
  });
  assert.equal(result.response.status, 200);

  result = await jsonRequest(secondAddress.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: secondCookie }
  });
  assert.equal(result.response.status, 401);
});

test("rejeita nova configuração e payload de diário inválido", async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-server-invalid-"));
  const app = createApplication({
    rootDir: path.resolve(__dirname, ".."),
    dbPath: path.join(tempDir, "suzy.sqlite3"),
    port: 0
  });
  const address = await app.start();
  t.after(async () => {
    await app.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  let result = await jsonRequest(address.url, "/api/auth/setup", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaLocal2026Segura" })
  });
  const cookie = sessionCookie(result.response);
  const csrf = result.payload.csrfToken;

  result = await jsonRequest(address.url, "/api/auth/setup", {
    method: "POST",
    body: JSON.stringify({ username: "outro", password: "OutraSenha2026Segura" })
  });
  assert.equal(result.response.status, 409);

  result = await jsonRequest(address.url, "/api/journal", {
    method: "PUT",
    headers: { Cookie: cookie, "X-CSRF-Token": csrf },
    body: JSON.stringify({ entries: [{ asset: "EUR/USD" }] })
  });
  assert.equal(result.response.status, 400);
});

test("altera e recupera senha rotacionando chave e sessões", async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-password-"));
  const app = createApplication({
    rootDir: path.resolve(__dirname, ".."),
    dbPath: path.join(tempDir, "suzy.sqlite3"),
    port: 0
  });
  const address = await app.start();
  t.after(async () => {
    await app.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  let result = await jsonRequest(address.url, "/api/auth/setup", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaInicial2026Segura" })
  });
  const firstCookie = sessionCookie(result.response);
  const firstCsrf = result.payload.csrfToken;
  const firstRecoveryKey = result.payload.recoveryKey;

  result = await jsonRequest(address.url, "/api/auth/change-password", {
    method: "POST",
    headers: { Cookie: firstCookie, "X-CSRF-Token": firstCsrf },
    body: JSON.stringify({ currentPassword: "senha-errada", newPassword: "SenhaNova2026Segura" })
  });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(address.url, "/api/auth/change-password", {
    method: "POST",
    headers: { Cookie: firstCookie, "X-CSRF-Token": firstCsrf },
    body: JSON.stringify({ currentPassword: "SenhaInicial2026Segura", newPassword: "SenhaNova2026Segura" })
  });
  assert.equal(result.response.status, 200);
  const secondCookie = sessionCookie(result.response);
  const secondRecoveryKey = result.payload.recoveryKey;
  assert.notEqual(secondRecoveryKey, firstRecoveryKey);

  result = await jsonRequest(address.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: firstCookie }
  });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(address.url, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaInicial2026Segura" })
  });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(address.url, "/api/auth/recover", {
    method: "POST",
    body: JSON.stringify({
      username: "danilo",
      recoveryKey: firstRecoveryKey,
      newPassword: "SenhaFinal2026Segura"
    })
  });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(address.url, "/api/auth/recover", {
    method: "POST",
    body: JSON.stringify({
      username: "danilo",
      recoveryKey: secondRecoveryKey,
      newPassword: "SenhaFinal2026Segura"
    })
  });
  assert.equal(result.response.status, 200);
  const thirdCookie = sessionCookie(result.response);
  assert.notEqual(result.payload.recoveryKey, secondRecoveryKey);

  result = await jsonRequest(address.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: secondCookie }
  });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(address.url, "/api/journal", {
    method: "GET",
    headers: { Cookie: thirdCookie }
  });
  assert.equal(result.response.status, 200);

  result = await jsonRequest(address.url, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaNova2026Segura" })
  });
  assert.equal(result.response.status, 401);

  result = await jsonRequest(address.url, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "danilo", password: "SenhaFinal2026Segura" })
  });
  assert.equal(result.response.status, 200);
});
