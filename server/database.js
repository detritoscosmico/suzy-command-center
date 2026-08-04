const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { hashToken, randomToken } = require("./security.js");
const { createAtRestCipher } = require("./encryption.js");

const ENCRYPTION_VERSION = 1;
const ENCRYPTION_CHECK_KEY = "journal_encryption_check_v1";
const ENCRYPTED_PLACEHOLDER = "__encrypted__";

class SuzyDatabase {
  constructor(filePath, options = {}) {
    this.filePath = path.resolve(filePath);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.encryption = createAtRestCipher({
      encryptionKey: options.encryptionKey,
      keyPath: options.keyPath || `${this.filePath}.key`
    });
    this.db = new DatabaseSync(this.filePath);

    try {
      this.initialize();
    } catch (error) {
      this.db.close();
      throw error;
    }
  }

  initialize() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_iterations INTEGER NOT NULL,
        recovery_key_hash TEXT,
        password_updated_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        csrf_token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS journal_entries (
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
        encrypted_payload TEXT,
        encryption_version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_journal_user_timestamp
      ON journal_entries(user_id, timestamp);

      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.ensureColumn("users", "recovery_key_hash", "TEXT");
    this.ensureColumn("users", "password_updated_at", "TEXT");
    this.ensureColumn("journal_entries", "encrypted_payload", "TEXT");
    this.ensureColumn("journal_entries", "encryption_version", "INTEGER NOT NULL DEFAULT 0");
    this.initializeEncryption();
  }

  ensureColumn(tableName, columnName, definition) {
    const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
    if (columns.some(column => column.name === columnName)) return;
    this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }

  journalAad(userId, entryId) {
    return `journal:${Number(userId)}:${String(entryId)}:v${ENCRYPTION_VERSION}`;
  }

  initializeEncryption() {
    const check = this.db.prepare("SELECT value FROM app_metadata WHERE key = ?").get(ENCRYPTION_CHECK_KEY);
    if (check) {
      const decoded = this.encryption.decrypt(check.value, "metadata:journal:v1");
      if (decoded?.purpose !== "journal" || decoded?.version !== ENCRYPTION_VERSION) {
        throw new Error("A chave local não corresponde ao banco de dados informado.");
      }
    } else {
      const encryptedRow = this.db.prepare(`
        SELECT user_id, id, encrypted_payload
        FROM journal_entries
        WHERE encryption_version = ? AND encrypted_payload IS NOT NULL
        LIMIT 1
      `).get(ENCRYPTION_VERSION);

      if (encryptedRow) {
        this.encryption.decrypt(
          encryptedRow.encrypted_payload,
          this.journalAad(encryptedRow.user_id, encryptedRow.id)
        );
      }

      const value = this.encryption.encrypt(
        { purpose: "journal", version: ENCRYPTION_VERSION },
        "metadata:journal:v1"
      );
      this.db.prepare(`
        INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
      `).run(ENCRYPTION_CHECK_KEY, value, new Date().toISOString());
    }

    this.migratePlaintextJournal();
  }

  legacyRowToEntry(row) {
    const rMultiple = Number(row.r_multiple);
    return {
      id: row.id,
      timestamp: row.timestamp,
      asset: row.asset,
      market: row.market,
      session: row.session_name,
      timeframe: row.timeframe,
      direction: row.direction,
      setup: row.setup,
      rMultiple,
      result: rMultiple > 0 ? "WIN" : rMultiple < 0 ? "LOSS" : "BREAKEVEN",
      followedPlan: Boolean(row.followed_plan),
      quality: Number(row.quality),
      emotionBefore: row.emotion_before,
      emotionAfter: row.emotion_after,
      errorType: row.error_type,
      context: row.context,
      lesson: row.lesson,
      createdAt: row.created_at
    };
  }

  encryptEntry(userId, entry) {
    return this.encryption.encrypt(entry, this.journalAad(userId, entry.id));
  }

  decryptEntry(row) {
    const entry = this.encryption.decrypt(
      row.encrypted_payload,
      this.journalAad(row.user_id, row.id)
    );
    if (!entry || String(entry.id) !== String(row.id)) {
      throw new Error("O registro criptografado não corresponde ao identificador armazenado.");
    }

    const rMultiple = Number(entry.rMultiple);
    return {
      id: row.id,
      timestamp: String(entry.timestamp),
      asset: String(entry.asset),
      market: String(entry.market),
      session: String(entry.session),
      timeframe: String(entry.timeframe),
      direction: String(entry.direction),
      setup: String(entry.setup),
      rMultiple,
      result: rMultiple > 0 ? "WIN" : rMultiple < 0 ? "LOSS" : "BREAKEVEN",
      followedPlan: Boolean(entry.followedPlan),
      quality: Number(entry.quality),
      emotionBefore: String(entry.emotionBefore),
      emotionAfter: String(entry.emotionAfter),
      errorType: String(entry.errorType),
      context: String(entry.context),
      lesson: String(entry.lesson),
      createdAt: String(entry.createdAt || row.created_at)
    };
  }

  migratePlaintextJournal() {
    const rows = this.db.prepare(`
      SELECT user_id, id, timestamp, asset, market, session_name, timeframe, direction,
             setup, r_multiple, followed_plan, quality, emotion_before, emotion_after,
             error_type, context, lesson, encrypted_payload, encryption_version,
             created_at, updated_at
      FROM journal_entries
      WHERE encryption_version <> ? OR encrypted_payload IS NULL
    `).all(ENCRYPTION_VERSION);

    if (!rows.length) return 0;

    const update = this.db.prepare(`
      UPDATE journal_entries
      SET timestamp = ?, asset = ?, market = ?, session_name = ?, timeframe = ?,
          direction = ?, setup = ?, r_multiple = ?, followed_plan = ?, quality = ?,
          emotion_before = ?, emotion_after = ?, error_type = ?, context = ?, lesson = ?,
          encrypted_payload = ?, encryption_version = ?, updated_at = ?
      WHERE user_id = ? AND id = ?
    `);
    const updatedAt = new Date().toISOString();

    this.db.exec("BEGIN IMMEDIATE");
    try {
      for (const row of rows) {
        const encrypted = this.encryptEntry(row.user_id, this.legacyRowToEntry(row));
        update.run(
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          0,
          0,
          1,
          "",
          "",
          "",
          "",
          "",
          encrypted,
          ENCRYPTION_VERSION,
          updatedAt,
          row.user_id,
          row.id
        );
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return rows.length;
  }

  encryptionInfo() {
    return {
      enabled: true,
      algorithm: this.encryption.algorithm,
      version: this.encryption.version,
      keySource: this.encryption.source
    };
  }

  countUsers() {
    return Number(this.db.prepare("SELECT COUNT(*) AS total FROM users").get().total);
  }

  createUser({ username, passwordSalt, passwordHash, passwordIterations, recoveryKeyHash = null }) {
    const createdAt = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO users (
        username, password_salt, password_hash, password_iterations,
        recovery_key_hash, password_updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      username,
      passwordSalt,
      passwordHash,
      passwordIterations,
      recoveryKeyHash,
      createdAt,
      createdAt
    );
    return { id: Number(result.lastInsertRowid), username, createdAt, recoveryConfigured: Boolean(recoveryKeyHash) };
  }

  mapUser(row) {
    return row ? {
      id: Number(row.id),
      username: row.username,
      passwordSalt: row.password_salt,
      passwordHash: row.password_hash,
      passwordIterations: Number(row.password_iterations),
      recoveryKeyHash: row.recovery_key_hash || null,
      passwordUpdatedAt: row.password_updated_at || null,
      createdAt: row.created_at
    } : null;
  }

  findUserByUsername(username) {
    const row = this.db.prepare(`
      SELECT id, username, password_salt, password_hash, password_iterations,
             recovery_key_hash, password_updated_at, created_at
      FROM users WHERE username = ? COLLATE NOCASE
    `).get(username);
    return this.mapUser(row);
  }

  findUserById(userId) {
    const row = this.db.prepare(`
      SELECT id, username, password_salt, password_hash, password_iterations,
             recovery_key_hash, password_updated_at, created_at
      FROM users WHERE id = ?
    `).get(userId);
    return this.mapUser(row);
  }

  updatePassword(userId, { passwordSalt, passwordHash, passwordIterations, recoveryKeyHash }) {
    const passwordUpdatedAt = new Date().toISOString();
    const result = this.db.prepare(`
      UPDATE users
      SET password_salt = ?, password_hash = ?, password_iterations = ?,
          recovery_key_hash = COALESCE(?, recovery_key_hash), password_updated_at = ?
      WHERE id = ?
    `).run(
      passwordSalt,
      passwordHash,
      passwordIterations,
      recoveryKeyHash ?? null,
      passwordUpdatedAt,
      userId
    );
    return { changed: Number(result.changes) === 1, passwordUpdatedAt };
  }

  setRecoveryKeyHash(userId, recoveryKeyHash) {
    const result = this.db.prepare(`
      UPDATE users SET recovery_key_hash = ? WHERE id = ?
    `).run(recoveryKeyHash, userId);
    return Number(result.changes) === 1;
  }

  createSession(userId, ttlSeconds = 7 * 24 * 60 * 60) {
    this.cleanupExpiredSessions();
    const token = randomToken(32);
    const csrfToken = randomToken(24);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ttlSeconds * 1000);
    this.db.prepare(`
      INSERT INTO sessions (user_id, token_hash, csrf_token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, hashToken(token), csrfToken, expiresAt.toISOString(), createdAt.toISOString());
    return { token, csrfToken, expiresAt: expiresAt.toISOString(), ttlSeconds };
  }

  getSession(token) {
    if (!token) return null;
    const row = this.db.prepare(`
      SELECT sessions.id, sessions.user_id, sessions.csrf_token, sessions.expires_at,
             users.username
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `).get(hashToken(token));
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      this.db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
      return null;
    }
    return {
      id: Number(row.id),
      userId: Number(row.user_id),
      username: row.username,
      csrfToken: row.csrf_token,
      expiresAt: row.expires_at
    };
  }

  deleteSession(token) {
    if (!token) return;
    this.db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }

  deleteSessionsForUser(userId) {
    const result = this.db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    return Number(result.changes);
  }

  cleanupExpiredSessions() {
    this.db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  }

  listJournal(userId) {
    const rows = this.db.prepare(`
      SELECT user_id, id, timestamp, asset, market, session_name, timeframe, direction,
             setup, r_multiple, followed_plan, quality, emotion_before, emotion_after,
             error_type, context, lesson, encrypted_payload, encryption_version, created_at
      FROM journal_entries
      WHERE user_id = ?
    `).all(userId);

    return rows
      .map(row => Number(row.encryption_version) === ENCRYPTION_VERSION && row.encrypted_payload
        ? this.decryptEntry(row)
        : this.legacyRowToEntry(row))
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp) || left.id.localeCompare(right.id));
  }

  replaceJournal(userId, entries) {
    const insert = this.db.prepare(`
      INSERT INTO journal_entries (
        user_id, id, timestamp, asset, market, session_name, timeframe, direction,
        setup, r_multiple, followed_plan, quality, emotion_before, emotion_after,
        error_type, context, lesson, encrypted_payload, encryption_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updatedAt = new Date().toISOString();

    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("DELETE FROM journal_entries WHERE user_id = ?").run(userId);
      for (const entry of entries) {
        const createdAt = entry.createdAt || updatedAt;
        insert.run(
          userId,
          entry.id,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          ENCRYPTED_PLACEHOLDER,
          0,
          0,
          1,
          "",
          "",
          "",
          "",
          "",
          this.encryptEntry(userId, { ...entry, createdAt }),
          ENCRYPTION_VERSION,
          createdAt,
          updatedAt
        );
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { total: entries.length, updatedAt };
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  ENCRYPTION_VERSION,
  ENCRYPTION_CHECK_KEY,
  ENCRYPTED_PLACEHOLDER,
  SuzyDatabase
};
