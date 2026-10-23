"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createHash } = require("node:crypto");
const provenance = require("../js/provenance-core.js");
const { buildOfflineDataset, MAX_FILE_BYTES, MAX_CANDLES } = require("../js/offline-candle-contract.js");

const bytes = readFileSync(join(__dirname, "fixtures", "ohlc-offline-artificial.csv"));
const csv = bytes.toString("utf8");

function metadata(overrides = {}) {
  return {
    datasetName: "Laboratório M5 — sintético",
    sourceType: "ARTIFICIAL",
    sourceName: "Fixture local do Suzy Command Center",
    sourceUrl: "",
    license: "",
    timezone: "UTC",
    instrument: "EUR/USD",
    timeframe: "M5",
    authorizationConfirmed: false,
    ...overrides
  };
}

function descriptor(overrides = {}) {
  return {
    symbol: "EUR/USD",
    instrumentType: "FOREX_SPOT",
    venueOrProvider: "SIMULADOR_SINTETICO",
    quoteCurrency: "USD",
    timeframeSeconds: 300,
    timestampSemantics: "OPEN_TIME_UTC",
    candleState: "CLOSED",
    ...overrides
  };
}

function build(overrides = {}) {
  return buildOfflineDataset({
    bytes,
    metadata: metadata(),
    descriptor: descriptor(),
    now: "2026-10-23T12:00:00.000Z",
    ...overrides
  });
}

test("normaliza todos os 12 candles fechados da fixture e mantém contratos sem rede", () => {
  const dataset = build();
  assert.equal(dataset.contractVersion, 1);
  assert.equal(dataset.candles.length, 12);
  assert.equal(dataset.classification, "ARTIFICIAL_PERMANENT");
  assert.match(dataset.permanentLabel, /ARTIFICIAL/);
  assert.deepEqual(dataset.policy, {
    mode: "LOCAL_FILE_ONLY", brokerConnection: false, orderExecution: false, credentialsStored: false
  });
  assert.equal(dataset.instrument.instrumentType, "FOREX_SPOT");
  assert.equal(dataset.instrument.timeframe, "M5");
  assert.equal(dataset.instrument.timestampSemantics, "OPEN_TIME_UTC");
  assert.equal(dataset.candles[0].timestampUtc, "2026-08-01T10:00:00.000Z");
  assert.equal(dataset.candles[11].timestampUtc, "2026-08-01T10:55:00.000Z");
  assert.equal(dataset.candles[11].close, 112);
  assert.equal(dataset.integrity.rows, 12);
  assert.equal(dataset.manifest.adapterPolicy.brokerConnection, false);
});

test("conserva prévia pública em dez linhas e oferece todas as linhas apenas sob opção explícita", () => {
  assert.equal(provenance.inspectCsv(csv).rows.length, 10);
  const inspected = provenance.inspectCsv(csv, { includeAllRows: true });
  assert.equal(inspected.valid, true);
  assert.equal(inspected.rows.length, 12);
  assert.equal(inspected.validRows, 12);
});

test("calcula SHA-256 dos bytes originais e reprova arquivo modificado no manifesto antigo", () => {
  const original = build();
  const hash = createHash("sha256").update(bytes).digest("hex");
  assert.equal(original.integrity.sha256, hash);
  assert.equal(original.integrity.digestInput, "ORIGINAL_BYTES");
  assert.equal(provenance.verifyDigest(original.manifest, hash).status, "MATCH");

  const tamperedBytes = Buffer.from(csv.replace(",100,102,99,101", ",100,103,99,101"), "utf8");
  const altered = build({ bytes: tamperedBytes });
  assert.notEqual(altered.integrity.sha256, hash);
  assert.equal(provenance.verifyDigest(original.manifest, altered.integrity.sha256).status, "MISMATCH");
});

test("aceita dataset local autorizado somente com licença e confirmação", () => {
  const result = build({ metadata: metadata({
    sourceType: "AUTHORIZED_LOCAL", sourceName: "CSV licenciado",
    license: "Autorização expressa para estudo local", authorizationConfirmed: true
  }) });
  assert.equal(result.classification, "AUTHORIZED_LOCAL");
  assert.equal(result.manifest.metadata.authorizationConfirmed, true);
});

test("rejeita origem desconhecida sem permitir fallback automático para autorizada", () => {
  assert.throws(() => build({ metadata: metadata({ sourceType: "UNKNOWN" }) }), /Origem precisa/);
  assert.throws(() => build({ metadata: metadata({ sourceType: "" }) }), /Origem precisa/);
  assert.throws(() => build({ metadata: metadata({ sourceType: "AUTHORIZED_LOCAL" }) }), /Licença|autorização/);
});

test("rejeita instrumento ambíguo e classificação não tipada", () => {
  assert.throws(() => build({ descriptor: descriptor({ instrumentType: "" }) }), /instrumentType/);
  assert.throws(() => build({ descriptor: descriptor({ instrumentType: "UNKNOWN" }) }), /Tipo de instrumento/);
  assert.throws(() => build({ descriptor: descriptor({ symbol: "USD/JPY" }) }), /Símbolo/);
});

test("não mistura instrumentos convencionais com mercados OTC sintéticos", () => {
  const asset = metadata({ instrument: "EURUSD-OTC" });
  assert.throws(() => build({
    metadata: asset, descriptor: descriptor({ symbol: "EURUSD-OTC", instrumentType: "FOREX_SPOT" })
  }), /OTC_SYNTHETIC/);
  const otc = build({
    metadata: asset, descriptor: descriptor({ symbol: "EURUSD-OTC", instrumentType: "OTC_SYNTHETIC" })
  });
  assert.equal(otc.instrument.instrumentType, "OTC_SYNTHETIC");
  assert.equal(otc.classification, "ARTIFICIAL_PERMANENT");
});

test("rejeita timeframe incompatível e timestamp com semântica indefinida", () => {
  assert.throws(() => build({ descriptor: descriptor({ timeframeSeconds: 60 }) }), /Timeframe/);
  assert.throws(() => build({ metadata: metadata({ timeframe: "M7" }) }), /Timeframe/);
  assert.throws(() => build({ descriptor: descriptor({ timestampSemantics: "CLOSE_TIME_UTC" }) }), /timestampSemantics/);
});

test("rejeita timestamps desalinhados do começo da vela", () => {
  const input = Buffer.from("timestamp,open,high,low,close\n2026-08-01T10:02:00Z,100,102,99,101", "utf8");
  assert.throws(() => build({ bytes: input }), /não alinhado/);
});

test("converte timestamps locais conforme IANA sem atribuir o preço a outro mercado", () => {
  const local = Buffer.from("timestamp,open,high,low,close\n2026-08-01T10:00:00,100,102,99,101", "utf8");
  const result = build({ bytes: local, metadata: metadata({ timezone: "America/Sao_Paulo" }) });
  assert.equal(result.candles[0].timestampUtc, "2026-08-01T13:00:00.000Z");
  assert.equal(result.manifest.metadata.timezone, "America/Sao_Paulo");
});

test("não aceita candle provisional ou com metadados incompletos", () => {
  assert.throws(() => build({ descriptor: descriptor({ candleState: "PROVISIONAL" }) }), /CLOSED/);
  assert.throws(() => build({ descriptor: descriptor({ venueOrProvider: "" }) }), /venueOrProvider/);
  assert.throws(() => build({ descriptor: descriptor({ quoteCurrency: "??" }) }), /Moeda de cotação/);
});

test("rejeita OHLC impossível, zero, negativo ou não numérico", () => {
  const head = "timestamp,open,high,low,close\n2026-08-01T10:00:00Z,";
  for (const tail of ["100,98,99,101", "0,2,-1,1", "-3,-1,-4,-2", "abc,102,99,101"]) {
    assert.throws(() => build({ bytes: Buffer.from(head + tail, "utf8") }), /OHLC|preço/);
  }
});

test("rejeita timestamp inválido e duplicatas antes da normalização", () => {
  const duplicated = Buffer.from(csv.trimEnd() + "\n" + csv.split("\n")[1], "utf8");
  assert.throws(() => build({ bytes: duplicated }), /duplicados/);
  const invalid = Buffer.from("timestamp,open,high,low,close\nnot-a-date,100,102,99,101", "utf8");
  assert.throws(() => build({ bytes: invalid }), /inválid/);
});

test("aceita ponto e vírgula e vírgula decimal mantendo regras de proveniência", () => {
  const content = Buffer.from("data;abertura;máxima;mínima;fechamento\n2026-08-01T10:00:00Z;100,1;102,2;99,5;101,8", "utf8");
  const dataset = build({ bytes: content });
  assert.equal(dataset.candles[0].open, 100.1);
  assert.equal(dataset.candles[0].close, 101.8);
});

test("impõe limites em bytes, quantidade de candles e UTF-8 estrito", () => {
  assert.equal(MAX_FILE_BYTES, 2 * 1024 * 1024);
  assert.equal(MAX_CANDLES, 5000);
  assert.throws(() => build({ bytes: Buffer.alloc(MAX_FILE_BYTES + 1) }), /2 MB/);
  assert.throws(() => build({ bytes: Buffer.from([0xff, 0xfe, 0xfd]) }), /UTF-8/);
  const rows = Array.from({ length: MAX_CANDLES + 1 }, (_, index) => [
    new Date(Date.UTC(2026, 7, 1, 10, index * 5)).toISOString(), 100, 102, 99, 101
  ].join(","));
  const hugeCount = Buffer.from(["timestamp,open,high,low,close", ...rows].join("\n"), "utf8");
  assert.throws(() => build({ bytes: hugeCount }), /5.000/);
});
