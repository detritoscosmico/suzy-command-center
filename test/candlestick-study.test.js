const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../js/candlestick-study-data.js");

test("preserva o inventário didático importado da captura", () => {
  assert.equal(data.version, 1);
  assert.equal(data.importedAt, "2026-08-16");
  assert.equal(data.entries.length, 69);
  assert.equal(data.entries.filter(entry => entry.section === "emergente").length, 9);
  assert.equal(data.entries.filter(entry => entry.section === "completo").length, 60);
  assert.equal(new Set(data.entries.map(entry => entry.pattern)).size, 35);
  assert.equal(new Set(data.entries.map(entry => entry.asset)).size, 13);
  assert.equal(new Set(data.entries.map(entry => entry.timeframe)).size, 7);
});

test("mantém somente referências de candlestick da base de estudo", () => {
  for (const entry of data.entries) {
    const url = new URL(entry.sourceUrl);
    assert.equal(url.protocol, "https:");
    assert.ok(url.hostname === "investing.com" || url.hostname.endsWith(".investing.com"));
    assert.match(url.pathname, /candlestick/);
    assert.ok(entry.pattern.length > 0);
    assert.ok(entry.asset.length > 0);
    assert.ok(entry.timeframe.length > 0);
    assert.ok(Number.isInteger(entry.sourceLine));
    assert.ok(entry.sourceLine >= 10 && entry.sourceLine <= 125);
  }
});

test("não transforma a captura de cotações finais em dado didático", () => {
  const forbiddenAssets = new Set(["EUA 500", "EUA 30", "S&P 500 VIX", "Bitcoin Futuro", "Índice Dólar", "TSLA"]);
  assert.equal(data.entries.some(entry => forbiddenAssets.has(entry.asset)), false);
});
