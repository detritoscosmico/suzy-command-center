const {
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual
} = require("node:crypto");

const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";
const RECOVERY_KEY_PREFIX = "SUZY-";

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function hashToken(token) {
  return createHash("sha256").update(String(token ?? "")).digest("hex");
}

function generateRecoveryKey() {
  return `${RECOVERY_KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

function normalizeRecoveryKey(value) {
  return String(value ?? "").trim();
}

function hashRecoveryKey(value) {
  return hashToken(normalizeRecoveryKey(value));
}

function verifyRecoveryKey(value, expectedHash) {
  const actualHash = hashRecoveryKey(value);
  return constantTimeTextEqual(actualHash, expectedHash);
}

function normalizeUsername(value) {
  return String(value ?? "").trim().toLowerCase();
}

function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return {
      valid: false,
      username,
      message: "Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado."
    };
  }
  return { valid: true, username, message: "" };
}

function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 12 || password.length > 128) {
    return { valid: false, message: "A senha deve ter entre 12 e 128 caracteres." };
  }
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: "A senha deve conter ao menos uma letra e um número." };
  }
  return { valid: true, message: "" };
}

function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  return pbkdf2Sync(
    String(password),
    Buffer.from(String(salt), "base64url"),
    Number(iterations),
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST
  );
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = derivePassword(password, salt, PASSWORD_ITERATIONS);
  return {
    salt,
    hash: derived.toString("base64url"),
    iterations: PASSWORD_ITERATIONS
  };
}

function verifyPassword(password, record) {
  try {
    const expected = Buffer.from(String(record?.passwordHash ?? ""), "base64url");
    const actual = derivePassword(password, record?.passwordSalt, record?.passwordIterations);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function constantTimeTextEqual(left, right) {
  const leftBuffer = Buffer.from(String(left ?? ""));
  const rightBuffer = Buffer.from(String(right ?? ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header = "") {
  const cookies = {};
  for (const part of String(header).split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.expires instanceof Date) segments.push(`Expires=${options.expires.toUTCString()}`);
  segments.push(`Path=${options.path || "/"}`);
  if (options.httpOnly !== false) segments.push("HttpOnly");
  segments.push(`SameSite=${options.sameSite || "Strict"}`);
  if (options.secure) segments.push("Secure");
  return segments.join("; ");
}

module.exports = {
  PASSWORD_ITERATIONS,
  RECOVERY_KEY_PREFIX,
  randomToken,
  hashToken,
  generateRecoveryKey,
  normalizeRecoveryKey,
  hashRecoveryKey,
  verifyRecoveryKey,
  normalizeUsername,
  validateUsername,
  validatePassword,
  hashPassword,
  verifyPassword,
  constantTimeTextEqual,
  parseCookies,
  serializeCookie
};
