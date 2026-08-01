const test = require("node:test");
const assert = require("node:assert/strict");
const { localDateKey } = require("../js/core.js");

test("gera a chave diária usando a data local", () => {
  const lateEvening = new Date(2026, 6, 31, 23, 45, 0);

  assert.equal(localDateKey(lateEvening), "2026-07-31");
});

test("preenche mês e dia com zero", () => {
  const earlyYear = new Date(2026, 0, 5, 8, 0, 0);

  assert.equal(localDateKey(earlyYear), "2026-01-05");
});
