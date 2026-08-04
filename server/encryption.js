const fs = require("node:fs");
const path = require("node:path");
const {
  createCipheriv,
  createDecipheriv,
  randomBytes
} = require("node:crypto");

const DATA_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;
const PAYLOAD_PREFIX = "suzy:aes-256-gcm:v1";

function parseDataKey(value) {
  if (Buffer.isBuffer(value)) {
    if (value.length !== DATA_KEY_BYTES) {
      throw new Error("A chave de criptografia deve possuir exatamente 32 bytes.");
    }
    return Buffer.from(value);
  }

  const encoded = String(value ?? "").trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(encoded)) {
    throw new Error("SUZY_DATA_KEY deve estar em Base64URL e representar exatamente 32 bytes.");
  }

  const key = Buffer.from(encoded, "base64url");
  if (key.length !== DATA_KEY_BYTES) {
    throw new Error("SUZY_DATA_KEY deve representar exatamente 32 bytes.");
  }
  return key;
}

function generateDataKey() {
  return randomBytes(DATA_KEY_BYTES).toString("base64url");
}

function readKeyFile(keyPath) {
  return parseDataKey(fs.readFileSync(keyPath, "utf8"));
}

function createKeyFile(keyPath) {
  const absolutePath = path.resolve(keyPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const encoded = generateDataKey();

  try {
    fs.writeFileSync(absolutePath, `${encoded}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return readKeyFile(absolutePath);
  }

  try {
    fs.chmodSync(absolutePath, 0o600);
  } catch {
    // O Windows pode não aplicar permissões POSIX. A chave ainda permanece fora do SQLite.
  }

  return parseDataKey(encoded);
}

function loadDataKey(options = {}) {
  const provided = options.key ?? options.encryptionKey ?? process.env.SUZY_DATA_KEY;
  if (provided) {
    return {
      key: parseDataKey(provided),
      source: "environment",
      keyPath: null
    };
  }

  const configuredPath = options.keyPath ?? process.env.SUZY_KEY_PATH;
  if (!configuredPath) {
    throw new Error("Defina um caminho para a chave local ou informe SUZY_DATA_KEY.");
  }

  const keyPath = path.resolve(configuredPath);
  const key = fs.existsSync(keyPath) ? readKeyFile(keyPath) : createKeyFile(keyPath);
  return { key, source: "file", keyPath };
}

function associatedData(value) {
  return Buffer.from(String(value ?? ""), "utf8");
}

function encryptJson(value, key, aad = "") {
  const normalizedKey = parseDataKey(key);
  const iv = randomBytes(GCM_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", normalizedKey, iv);
  cipher.setAAD(associatedData(aad));
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    PAYLOAD_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url")
  ].join(".");
}

function decryptJson(payload, key, aad = "") {
  try {
    const normalizedKey = parseDataKey(key);
    const parts = String(payload ?? "").split(".");
    if (parts.length !== 4 || parts[0] !== PAYLOAD_PREFIX) {
      throw new Error("Formato criptografado desconhecido.");
    }

    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const ciphertext = Buffer.from(parts[3], "base64url");
    if (iv.length !== GCM_IV_BYTES || tag.length !== 16 || !ciphertext.length) {
      throw new Error("Envelope criptografado inválido.");
    }

    const decipher = createDecipheriv("aes-256-gcm", normalizedKey, iv);
    decipher.setAAD(associatedData(aad));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    throw new Error("Não foi possível autenticar ou descriptografar os dados locais.");
  }
}

function isEncryptedPayload(value) {
  return typeof value === "string" && value.startsWith(`${PAYLOAD_PREFIX}.`);
}

function createAtRestCipher(options = {}) {
  const loaded = loadDataKey(options);
  return {
    algorithm: "AES-256-GCM",
    version: 1,
    source: loaded.source,
    keyPath: loaded.keyPath,
    encrypt(value, aad) {
      return encryptJson(value, loaded.key, aad);
    },
    decrypt(payload, aad) {
      return decryptJson(payload, loaded.key, aad);
    },
    isEncryptedPayload
  };
}

module.exports = {
  DATA_KEY_BYTES,
  GCM_IV_BYTES,
  PAYLOAD_PREFIX,
  parseDataKey,
  generateDataKey,
  loadDataKey,
  encryptJson,
  decryptJson,
  isEncryptedPayload,
  createAtRestCipher
};
