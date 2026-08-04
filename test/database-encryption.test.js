const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const {
  createAtRestCipher,
  decryptJson,
  encryptJson,
  generateDataKey,
  parseDataKey
} = require("../server/encryption.js");
const {
  ENCRYPTED_PLACEHOLDER,
  ENCRYPTION_VERSION,
  SuzyDatabase
} = require("../server/database.js");

const KEY_A = Buffer.alloc(32, 0x11);
const KEY_B = Buffer.alloc(32, 0x22);

function journalEntry(overrides = {}) {
  return {
    id: "trade-1",
    timestamp: "2026-08-04T10:00:00.000Z",
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
    lesson: "Repetir processo",
    createdAt: "2026-08-04T10:01:00.000Z",
    ...overrides
  };
}

function createTestUser(database) {
  return database.createUser({
    username: "danilo",
    passwordSalt: "c2FsdA",
    passwordHash: "aGFzaA",
    passwordIterations: 310000,
    recoveryKeyHash: null
  });
}

test("criptografa JSON com AES-GCM e detecta adulteração ou chave incorreta", () => {
  const payload = { asset: "BTC/USDT", note: "dado sensível" };
  const encrypted = encryptJson(payload, KEY_A, "journal:1:trade-1:v1");

  assert.equal(encrypted.includes("BTC/USDT"), false);
  assert.equal(encrypted.includes("dado sensível"), false);
  assert.deepEqual(decryptJson(encrypted, KEY_A, "journal:1:trade-1:v1"), payload);
  assert.throws(
    () => decryptJson(encrypted, KEY_B, "journal:1:trade-1:v1"),
    /Não foi possível autenticar/
  );

  const parts = encrypted.split(".");
  const firstCipherCharacter = parts[3][0];
  parts[3] = `${firstCipherCharacter === "A" ? "B" : "A"}${parts[3].slice(1)}`;
  const tampered = parts.join(".");
  assert.throws(
    () => decryptJson(tampered, KEY_A, "journal:1:trade-1:v1"),
    /Não foi possível autenticar/
  );
});

test("gera chave Base64URL válida e recusa formato inseguro", () => {
  const generated = generateDataKey();
  assert.match(generated, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(parseDataKey(generated).length, 32);
  assert.throws(() => parseDataKey("curta"), /Base64URL/);
});

test("cria arquivo de chave reutilizável fora do SQLite", t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-key-"));
  const keyPath = path.join(tempDir, "journal.key");
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const first = createAtRestCipher({ keyPath });
  const encrypted = first.encrypt({ ok: true }, "metadata:test");
  const second = createAtRestCipher({ keyPath });

  assert.equal(first.source, "file");
  assert.equal(second.source, "file");
  assert.deepEqual(second.decrypt(encrypted, "metadata:test"), { ok: true });
  assert.equal(fs.readFileSync(keyPath, "utf8").trim().length, 43);

  if (process.platform !== "win32") {
    assert.equal(fs.statSync(keyPath).mode & 0o777, 0o600);
  }
});

test("grava conteúdo do diário apenas no envelope criptografado", t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-encrypted-db-"));
  const dbPath = path.join(tempDir, "suzy.sqlite3");
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  let database = new SuzyDatabase(dbPath, { encryptionKey: KEY_A });
  const user = createTestUser(database);
  const entry = journalEntry();
  database.replaceJournal(user.id, [entry]);

  const raw = database.db.prepare(`
    SELECT asset, setup, context, encrypted_payload, encryption_version
    FROM journal_entries WHERE user_id = ? AND id = ?
  `).get(user.id, entry.id);

  assert.equal(raw.asset, ENCRYPTED_PLACEHOLDER);
  assert.equal(raw.setup, ENCRYPTED_PLACEHOLDER);
  assert.equal(raw.context, "");
  assert.equal(Number(raw.encryption_version), ENCRYPTION_VERSION);
  assert.equal(raw.encrypted_payload.includes("EUR/USD"), false);
  assert.equal(raw.encrypted_payload.includes("Estrutura alinhada"), false);
  assert.equal(database.encryptionInfo().algorithm, "AES-256-GCM");

  const restored = database.listJournal(user.id);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].asset, entry.asset);
  assert.equal(restored[0].setup, entry.setup);
  assert.equal(restored[0].context, entry.context);
  assert.equal(restored[0].rMultiple, 2);
  database.close();

  database = new SuzyDatabase(dbPath, { encryptionKey: KEY_A });
  assert.equal(database.listJournal(user.id)[0].lesson, entry.lesson);
  database.close();

  assert.throws(
    () => new SuzyDatabase(dbPath, { encryptionKey: KEY_B }),
    /descriptografar|chave local/i
  );
});

test("migra registros legados, preserva leitura e remove texto sensível", t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-encryption-migration-"));
  const dbPath = path.join(tempDir, "legacy.sqlite3");
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_iterations INTEGER NOT NULL,
      recovery_key_hash TEXT,
      password_updated_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE journal_entries (
      user_id INTEGER NOT NULL,
      id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      asset TEXT NOT NULL,
      market TEXT NOT NULL,
      session_name TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      direction TEXT NOT NULL,
      setup TEXT NOT NULL,
      r_multiple REAL NOT NULL,
      followed_plan INTEGER NOT NULL,
      quality INTEGER NOT NULL,
      emotion_before TEXT NOT NULL,
      emotion_after TEXT NOT NULL,
      error_type TEXT NOT NULL,
      context TEXT NOT NULL,
      lesson TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, id)
    );

    INSERT INTO users (
      username, password_salt, password_hash, password_iterations, created_at
    ) VALUES ('danilo', 'c2FsdA', 'aGFzaA', 310000, '2026-08-04T09:00:00.000Z');

    INSERT INTO journal_entries (
      user_id, id, timestamp, asset, market, session_name, timeframe, direction,
      setup, r_multiple, followed_plan, quality, emotion_before, emotion_after,
      error_type, context, lesson, created_at, updated_at
    ) VALUES (
      1, 'legacy-1', '2026-08-04T10:00:00.000Z', 'XAU/USD', 'Forex', 'Nova York',
      'M15', 'SHORT', 'Rompimento', -1, 1, 4, 'Calmo', 'Neutro', 'Nenhum',
      'Contexto legado sensível', 'Respeitar o stop',
      '2026-08-04T10:01:00.000Z', '2026-08-04T10:01:00.000Z'
    );
  `);
  legacy.close();

  const database = new SuzyDatabase(dbPath, { encryptionKey: KEY_A });
  const restored = database.listJournal(1);
  const raw = database.db.prepare(`
    SELECT asset, setup, context, encrypted_payload, encryption_version
    FROM journal_entries WHERE user_id = 1 AND id = 'legacy-1'
  `).get();

  assert.equal(restored[0].asset, "XAU/USD");
  assert.equal(restored[0].setup, "Rompimento");
  assert.equal(restored[0].context, "Contexto legado sensível");
  assert.equal(raw.asset, ENCRYPTED_PLACEHOLDER);
  assert.equal(raw.setup, ENCRYPTED_PLACEHOLDER);
  assert.equal(raw.context, "");
  assert.equal(Number(raw.encryption_version), ENCRYPTION_VERSION);
  assert.equal(raw.encrypted_payload.includes("XAU/USD"), false);
  assert.equal(raw.encrypted_payload.includes("Contexto legado sensível"), false);

  database.close();
});
