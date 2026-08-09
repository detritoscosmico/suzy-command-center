const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/provenance-core.js");

const sha = "a".repeat(64);
const csv = [
  "timestamp,open,high,low,close",
  "2026-08-01T10:00:00Z,100,102,99,101",
  "2026-08-01T10:05:00Z,101,103,100,102"
].join("\n");

function metadata(overrides = {}) {
  return { datasetName: "EURUSD estudo", sourceType: "AUTHORIZED_LOCAL", sourceName: "Arquivo licenciado de teste", sourceUrl: "https://example.test/source", license: "Uso educacional autorizado", timezone: "UTC", instrument: "EUR/USD", timeframe: "M5", authorizationConfirmed: true, ...overrides };
}

test("detecta delimitador e interpreta aspas", () => {
  assert.equal(core.detectDelimiter("timestamp;open;high;low;close"), ";");
  assert.deepEqual(core.parseCsvLine('"2026-08-01, 10:00",100,102,99,101', ",")[0], "2026-08-01, 10:00");
});

test("inspeciona OHLC válido e deriva período", () => {
  const result = core.inspectCsv(csv);
  assert.equal(result.valid, true);
  assert.equal(result.validRows, 2);
  assert.equal(result.periodStart, "2026-08-01T10:00:00.000Z");
  assert.equal(result.periodEnd, "2026-08-01T10:05:00.000Z");
});

test("aceita cabeçalhos em português e decimal com vírgula usando ponto e vírgula", () => {
  const text = "data;abertura;máxima;mínima;fechamento\n2026-08-01T10:00:00Z;100,1;102,2;99,5;101,8";
  const result = core.inspectCsv(text);
  assert.equal(result.valid, true);
  assert.equal(result.rows[0].close, 101.8);
});

test("reprova OHLC impossível", () => {
  const bad = "timestamp,open,high,low,close\n2026-08-01T10:00:00Z,100,98,99,101";
  const result = core.inspectCsv(bad);
  assert.equal(result.valid, false);
  assert.equal(result.invalidRows, 1);
});

test("reprova timestamps duplicados", () => {
  const duplicate = `${csv}\n2026-08-01T10:05:00Z,102,104,101,103`;
  const result = core.inspectCsv(duplicate);
  assert.equal(result.valid, false);
  assert.equal(result.duplicateTimestamps, 1);
});

test("fonte autorizada exige licença e confirmação explícita", () => {
  assert.equal(core.validateMetadata(metadata()).valid, true);
  assert.equal(core.validateMetadata(metadata({ license: "", authorizationConfirmed: false })).valid, false);
});

test("dataset artificial recebe classificação permanente", () => {
  const inspection = core.inspectCsv(csv);
  const manifest = core.createManifest(metadata({ sourceType: "ARTIFICIAL", license: "", authorizationConfirmed: false, sourceName: "Gerador interno Suzy" }), inspection, sha, "2026-08-08T12:00:00Z");
  assert.equal(manifest.classification, "ARTIFICIAL_PERMANENT");
  assert.match(manifest.permanentLabel, /ARTIFICIAL/);
  assert.equal(manifest.adapterPolicy.brokerConnection, false);
});

test("manifesto autorizado registra SHA-256, período e política sem credenciais", () => {
  const manifest = core.createManifest(metadata(), core.inspectCsv(csv), sha, "2026-08-08T12:00:00Z");
  assert.equal(manifest.integrity.sha256, sha);
  assert.equal(manifest.integrity.rows, 2);
  assert.equal(manifest.adapterPolicy.credentialsStored, false);
  assert.equal(JSON.stringify(manifest).includes("apiKey"), false);
});

test("verificação detecta arquivo idêntico e alterado", () => {
  const manifest = core.createManifest(metadata(), core.inspectCsv(csv), sha, "2026-08-08T12:00:00Z");
  assert.equal(core.verifyDigest(manifest, sha).status, "MATCH");
  assert.equal(core.verifyDigest(manifest, "b".repeat(64)).status, "MISMATCH");
});

test("registro remove duplicatas pelo digest", () => {
  const manifest = core.createManifest(metadata(), core.inspectCsv(csv), sha, "2026-08-08T12:00:00Z");
  assert.equal(core.normalizeRegistry([manifest, manifest]).length, 1);
});
