const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { SuzyDatabase } = require("../server/database.js");

test("migra banco antigo sem perder usuário", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "suzy-migration-"));
  const dbPath = path.join(tempDir, "legacy.sqlite3");
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_iterations INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO users (
      username, password_salt, password_hash, password_iterations, created_at
    ) VALUES (
      'danilo', 'c2FsdA', 'aGFzaA', 310000, '2026-08-02T00:00:00.000Z'
    );
  `);
  legacy.close();

  const database = new SuzyDatabase(dbPath);
  const user = database.findUserByUsername("danilo");
  const columns = database.db.prepare("PRAGMA table_info(users)").all().map(column => column.name);

  assert.equal(database.countUsers(), 1);
  assert.equal(user.username, "danilo");
  assert.equal(user.recoveryKeyHash, null);
  assert.ok(columns.includes("recovery_key_hash"));
  assert.ok(columns.includes("password_updated_at"));

  database.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
