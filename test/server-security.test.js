const test = require("node:test");
const assert = require("node:assert/strict");
const {
  constantTimeTextEqual,
  hashPassword,
  hashToken,
  parseCookies,
  serializeCookie,
  validatePassword,
  validateUsername,
  verifyPassword
} = require("../server/security.js");

test("valida usuário local com formato restrito", () => {
  assert.equal(validateUsername(" Danilo_01 ").valid, true);
  assert.equal(validateUsername(" Danilo_01 ").username, "danilo_01");
  assert.equal(validateUsername("a").valid, false);
  assert.equal(validateUsername("danilo espaço").valid, false);
});

test("exige senha longa com letra e número", () => {
  assert.equal(validatePassword("curta1").valid, false);
  assert.equal(validatePassword("abcdefghijklmnop").valid, false);
  assert.equal(validatePassword("1234567890123456").valid, false);
  assert.equal(validatePassword("SenhaLocal2026Segura").valid, true);
});

test("gera e verifica hash PBKDF2 sem armazenar senha", () => {
  const record = hashPassword("SenhaLocal2026Segura");
  assert.notEqual(record.hash, "SenhaLocal2026Segura");
  assert.equal(verifyPassword("SenhaLocal2026Segura", {
    passwordHash: record.hash,
    passwordSalt: record.salt,
    passwordIterations: record.iterations
  }), true);
  assert.equal(verifyPassword("senha-incorreta", {
    passwordHash: record.hash,
    passwordSalt: record.salt,
    passwordIterations: record.iterations
  }), false);
});

test("protege token e compara CSRF em tempo constante", () => {
  assert.equal(hashToken("abc").length, 64);
  assert.equal(constantTimeTextEqual("token", "token"), true);
  assert.equal(constantTimeTextEqual("token", "outro"), false);
});

test("analisa e serializa cookie de sessão seguro", () => {
  const cookie = serializeCookie("suzy_session", "abc 123", { maxAge: 60, secure: true });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
  assert.deepEqual(parseCookies("a=1; suzy_session=abc%20123"), { a: "1", suzy_session: "abc 123" });
});
