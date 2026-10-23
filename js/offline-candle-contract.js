/**
 * Contrato de pesquisa OFFLINE para arquivos OHLC locais. Não importa SDK de
 * corretora, não usa rede, não autentica e nunca transmite ordens.
 *
 * Node.js 22+. Não é carregado pelas páginas do Suzy Command Center.
 */
"use strict";

const { createHash } = require("node:crypto");
const { TextDecoder } = require("node:util");
const provenance = require("./provenance-core.js");

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_CANDLES = 5000;

const TIMEFRAME_SECONDS = Object.freeze({
  S5: 5, S10: 10, S15: 15, S30: 30,
  M1: 60, M5: 300, M15: 900, M30: 1800,
  H1: 3600, H2: 7200, H4: 14400, H12: 43200,
  D1: 86400
});

const INSTRUMENT_TYPES = Object.freeze([
  "FOREX_SPOT", "FOREX_CFD", "CRYPTO_SPOT", "CRYPTO_PERPETUAL",
  "INDEX_CFD", "COMMODITY_CFD", "BINARY", "DIGITAL", "OTC_SYNTHETIC"
]);

function mandatoryString(value, name, maximum = 120) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(`Campo ${name} obrigatório, texto válido, até ${maximum} caracteres.`);
  }
  return value.trim();
}

function normalizeDescriptor(metadata, descriptor) {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)) {
    throw new Error("Descritor explícito de instrumento obrigatório.");
  }
  const symbol = mandatoryString(descriptor.symbol, "symbol", 40).toUpperCase();
  const instrumentType = mandatoryString(descriptor.instrumentType, "instrumentType", 32).toUpperCase();
  if (!INSTRUMENT_TYPES.includes(instrumentType)) {
    throw new Error("Tipo de instrumento não reconhecido; diferencie spot, CFD, perpétuo, binária, digital e OTC.");
  }
  if (symbol !== metadata.instrument) throw new Error("Símbolo do instrumento diferente do manifesto de proveniência.");
  if (symbol.endsWith("-OTC") && instrumentType !== "OTC_SYNTHETIC") {
    throw new Error("Instrumento com sufixo -OTC exige classificação OTC_SYNTHETIC.");
  }
  const timeframe = mandatoryString(metadata.timeframe, "timeframe", 20).toUpperCase();
  const timeframeSeconds = TIMEFRAME_SECONDS[timeframe];
  if (!timeframeSeconds || descriptor.timeframeSeconds !== timeframeSeconds) {
    throw new Error("Timeframe ou granularidade incompatível com o manifesto.");
  }
  if (descriptor.candleState !== "CLOSED") {
    throw new Error("Apenas candles CLOSED são aceitos no contrato offline; PROVISIONAL está bloqueado.");
  }
  if (descriptor.timestampSemantics !== "OPEN_TIME_UTC") {
    throw new Error("Declarar timestampSemantics OPEN_TIME_UTC; não presumir horário de fechamento.");
  }

  const venueOrProvider = mandatoryString(descriptor.venueOrProvider, "venueOrProvider");
  const quoteCurrency = mandatoryString(descriptor.quoteCurrency, "quoteCurrency", 12).toUpperCase();
  if (!/^[A-Z0-9]{3,12}$/.test(quoteCurrency)) throw new Error("Moeda de cotação inválida.");

  return Object.freeze({
    symbol, instrumentType, venueOrProvider, quoteCurrency,
    timeframe, timeframeSeconds, candleState: "CLOSED",
    timestampSemantics: "OPEN_TIME_UTC"
  });
}

function normalizeCandle(row, timeframeSeconds) {
  if (![row.open, row.high, row.low, row.close].every(price => Number.isFinite(price) && price > 0)) {
    throw new Error(`OHLC com preço não positivo ou não finito: ${row.timestamp}`);
  }
  const time = Date.parse(row.timestamp);
  if (!Number.isFinite(time) || time % (timeframeSeconds * 1000) !== 0) {
    throw new Error(`Timestamp não alinhado ao timeframe: ${row.timestamp}`);
  }
  if (row.high < Math.max(row.open, row.close) || row.low > Math.min(row.open, row.close)) {
    throw new Error(`OHLC inconsistente: ${row.timestamp}`);
  }
  return Object.freeze({
    time, timestampUtc: row.timestamp,
    open: row.open, high: row.high, low: row.low, close: row.close
  });
}

/**
 * Recebe bytes ORIGINAIS de um CSV UTF-8 local. Não lê arquivos nem acessa rede.
 * SHA-256 é calculado sobre os bytes; metadados e OHLC são validados pelo
 * provenance-core já existente, sem alterar a entrada atual da interface.
 */
function buildOfflineDataset({ bytes, metadata, descriptor, now } = {}) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES) {
    throw new Error("Arquivo local obrigatório, não vazio e com até 2 MB.");
  }
  if (!metadata || !provenance.SOURCE_TYPES.includes(metadata.sourceType)) {
    throw new Error("Origem precisa ser explicitamente ARTIFICIAL ou AUTHORIZED_LOCAL.");
  }
  // A validação de origem deve anteceder toda normalização (fail closed).
  const evaluation = provenance.validateMetadata(metadata);
  if (!evaluation.valid) throw new Error(evaluation.problems.join(" "));

  const instrument = normalizeDescriptor(evaluation.metadata, descriptor);
  let csv;
  try {
    csv = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("CSV precisa conter bytes UTF-8 válidos.");
  }

  const inspection = provenance.inspectCsv(csv, { timezone: evaluation.metadata.timezone, includeAllRows: true });
  if (!inspection.valid) throw new Error(inspection.error || "CSV OHLC reprovado.");
  if (inspection.rowCount > MAX_CANDLES || inspection.rows.length !== inspection.validRows) {
    throw new Error("Contrato offline aceita no máximo 5.000 candles completos.");
  }
  const candles = inspection.rows.map(row => normalizeCandle(row, instrument.timeframeSeconds));
  const digest = createHash("sha256").update(bytes).digest("hex");
  const manifest = provenance.createManifest(evaluation.metadata, inspection, digest, now);
  if (manifest.adapterPolicy.mode !== "LOCAL_FILE_ONLY" || manifest.adapterPolicy.brokerConnection) {
    throw new Error("Política offline não satisfeita.");
  }
  return Object.freeze({
    contractVersion: 1,
    policy: Object.freeze({ mode: "LOCAL_FILE_ONLY", brokerConnection: false, orderExecution: false, credentialsStored: false }),
    classification: manifest.classification,
    permanentLabel: manifest.permanentLabel,
    instrument,
    integrity: Object.freeze({
      sha256: manifest.integrity.sha256,
      digestInput: "ORIGINAL_BYTES",
      rows: manifest.integrity.rows,
      periodStart: manifest.integrity.periodStart,
      periodEnd: manifest.integrity.periodEnd
    }),
    manifest,
    candles: Object.freeze(candles)
  });
}

module.exports = Object.freeze({ buildOfflineDataset, normalizeDescriptor, TIMEFRAME_SECONDS, INSTRUMENT_TYPES, MAX_FILE_BYTES, MAX_CANDLES });
