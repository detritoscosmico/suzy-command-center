(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyProvenanceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MAX_DATASETS = 30;
  const SOURCE_TYPES = Object.freeze(["AUTHORIZED_LOCAL", "ARTIFICIAL"]);
  const HEADER_ALIASES = Object.freeze({
    timestamp: ["timestamp", "datetime", "date", "data", "hora"],
    open: ["open", "abertura"],
    high: ["high", "max", "maxima", "máxima"],
    low: ["low", "min", "minima", "mínima"],
    close: ["close", "fechamento"]
  });

  function cleanText(value, maximum = 240) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function normalizeHeader(value) {
    return cleanText(value, 80).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function parseNumber(value) {
    const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  function parseCsvLine(line, delimiter) {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else quoted = !quoted;
      } else if (character === delimiter && !quoted) {
        cells.push(current.trim());
        current = "";
      } else current += character;
    }
    cells.push(current.trim());
    return cells;
  }

  function detectDelimiter(headerLine) {
    const candidates = [",", ";", "\t"];
    return candidates.map(delimiter => ({ delimiter, count: parseCsvLine(headerLine, delimiter).length }))
      .sort((left, right) => right.count - left.count)[0].delimiter;
  }

  function columnMap(headers) {
    const normalized = headers.map(normalizeHeader);
    const result = {};
    Object.entries(HEADER_ALIASES).forEach(([key, aliases]) => {
      result[key] = normalized.findIndex(header => aliases.map(normalizeHeader).includes(header));
    });
    return result;
  }

  function normalizeTimezone(value) {
    const timezone = cleanText(value, 80);
    if (!timezone) return "";
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: timezone }).resolvedOptions().timeZone;
    } catch {
      return timezone;
    }
  }

  function isValidTimezone(value) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }

  function zonedParts(timestamp, timezone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(timestamp));
    return Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
  }

  function timezoneOffset(timestamp, timezone) {
    const parts = zonedParts(timestamp, timezone);
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - timestamp;
  }

  function parseTimestamp(value, timezone = "UTC") {
    const text = String(value ?? "").trim();
    const normalizedTimezone = normalizeTimezone(timezone);
    if (!text || !isValidTimezone(normalizedTimezone)) return null;
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
      const explicit = new Date(text);
      return Number.isFinite(explicit.getTime()) ? explicit : null;
    }
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/);
    if (!match) return null;
    const values = match.slice(1, 7).map(value => Number(value || 0));
    const [year, month, day, hour, minute, second] = values;
    const milliseconds = Number(String(match[7] || "0").padEnd(3, "0"));
    const wallClock = Date.UTC(year, month - 1, day, hour, minute, second);
    const check = new Date(wallClock);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day
      || check.getUTCHours() !== hour || check.getUTCMinutes() !== minute || check.getUTCSeconds() !== second) return null;
    let timestamp = wallClock - timezoneOffset(wallClock, normalizedTimezone);
    timestamp = wallClock - timezoneOffset(timestamp, normalizedTimezone);
    const converted = zonedParts(timestamp, normalizedTimezone);
    if (converted.year !== year || converted.month !== month || converted.day !== day || converted.hour !== hour
      || converted.minute !== minute || converted.second !== second) return null;
    return new Date(timestamp + milliseconds);
  }

  function inspectCsv(text, options = {}) {
    const timezone = normalizeTimezone(options.timezone || "UTC");
    if (!isValidTimezone(timezone)) return { valid: false, error: "Fuso horário inválido. Use UTC ou um identificador IANA, como America/Sao_Paulo.", timezone, rowCount: 0, invalidRows: 0, duplicateTimestamps: 0, rows: [] };
    const raw = String(text ?? "").replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return { valid: false, error: "O CSV precisa de cabeçalho e pelo menos uma linha de dados.", rowCount: 0, invalidRows: 0, duplicateTimestamps: 0, rows: [] };
    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter);
    const columns = columnMap(headers);
    const missingColumns = Object.entries(columns).filter(([, index]) => index < 0).map(([key]) => key);
    if (missingColumns.length) return { valid: false, error: `Colunas OHLC obrigatórias ausentes: ${missingColumns.join(", ")}.`, delimiter, headers, missingColumns, rowCount: lines.length - 1, invalidRows: lines.length - 1, duplicateTimestamps: 0, rows: [] };

    const timestamps = new Set();
    const rows = [];
    let invalidRows = 0;
    let duplicateTimestamps = 0;
    for (let index = 1; index < lines.length; index += 1) {
      const cells = parseCsvLine(lines[index], delimiter);
      const timestampText = cells[columns.timestamp];
      const timestamp = parseTimestamp(timestampText, timezone);
      const open = parseNumber(cells[columns.open]);
      const high = parseNumber(cells[columns.high]);
      const low = parseNumber(cells[columns.low]);
      const close = parseNumber(cells[columns.close]);
      const timestampValid = timestamp && Number.isFinite(timestamp.getTime());
      const pricesValid = [open, high, low, close].every(value => value !== null)
        && high >= Math.max(open, close, low) && low <= Math.min(open, close, high);
      if (!timestampValid || !pricesValid) {
        invalidRows += 1;
        continue;
      }
      const iso = timestamp.toISOString();
      if (timestamps.has(iso)) {
        duplicateTimestamps += 1;
        continue;
      }
      timestamps.add(iso);
      rows.push({ timestamp: iso, open, high, low, close });
    }
    rows.sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
    const valid = rows.length > 0 && invalidRows === 0 && duplicateTimestamps === 0;
    return {
      valid,
      error: valid ? null : "O arquivo contém linhas OHLC inválidas ou timestamps duplicados.",
      timezone,
      delimiter,
      headers,
      rowCount: lines.length - 1,
      validRows: rows.length,
      invalidRows,
      duplicateTimestamps,
      periodStart: rows[0]?.timestamp || null,
      periodEnd: rows[rows.length - 1]?.timestamp || null,
      rows: rows.slice(0, 10)
    };
  }

  function normalizeMetadata(candidate = {}) {
    const sourceType = SOURCE_TYPES.includes(String(candidate.sourceType)) ? String(candidate.sourceType) : "AUTHORIZED_LOCAL";
    return {
      datasetName: cleanText(candidate.datasetName, 80),
      sourceType,
      sourceName: cleanText(candidate.sourceName, 120),
      sourceUrl: cleanText(candidate.sourceUrl, 300),
      license: cleanText(candidate.license, 160),
      timezone: normalizeTimezone(candidate.timezone),
      instrument: cleanText(candidate.instrument, 40).toUpperCase(),
      timeframe: cleanText(candidate.timeframe, 20).toUpperCase(),
      authorizationConfirmed: candidate.authorizationConfirmed === true
    };
  }

  function validateMetadata(candidate = {}, options = {}) {
    const metadata = normalizeMetadata(candidate);
    const problems = [];
    if (!metadata.datasetName) problems.push("Nome do dataset obrigatório.");
    if (!metadata.sourceName) problems.push("Fonte obrigatória.");
    if (!metadata.timezone) problems.push("Fuso horário obrigatório.");
    else if (!isValidTimezone(metadata.timezone) && options.allowLegacyTimezone !== true) problems.push("Fuso horário inválido. Use UTC ou um identificador IANA.");
    if (!metadata.instrument) problems.push("Instrumento obrigatório.");
    if (!metadata.timeframe) problems.push("Período/timeframe obrigatório.");
    if (metadata.sourceType === "AUTHORIZED_LOCAL") {
      if (!metadata.license) problems.push("Licença ou base de autorização obrigatória.");
      if (!metadata.authorizationConfirmed) problems.push("Confirme que você tem autorização para usar o arquivo.");
    }
    return { metadata, valid: problems.length === 0, problems };
  }

  function normalizeDigest(value) {
    const digest = cleanText(value, 80).toLowerCase();
    return /^[a-f0-9]{64}$/.test(digest) ? digest : "";
  }

  function createManifest(candidateMetadata, inspection, sha256, now = new Date().toISOString()) {
    const evaluation = validateMetadata(candidateMetadata);
    if (!evaluation.valid) throw new Error(evaluation.problems.join(" "));
    if (!inspection?.valid) throw new Error(inspection?.error || "Integridade estrutural do CSV não aprovada.");
    if (inspection.timezone !== evaluation.metadata.timezone) throw new Error("O CSV precisa ser inspecionado novamente com o fuso horário declarado.");
    const digest = normalizeDigest(sha256);
    if (!digest) throw new Error("SHA-256 do arquivo não disponível.");
    const timestamp = new Date(now);
    if (!Number.isFinite(timestamp.getTime())) throw new Error("Data do manifesto inválida.");
    const artificial = evaluation.metadata.sourceType === "ARTIFICIAL";
    return {
      schemaVersion: 2,
      id: `${digest.slice(0, 12)}-${timestamp.getTime()}`,
      createdAt: timestamp.toISOString(),
      classification: artificial ? "ARTIFICIAL_PERMANENT" : "AUTHORIZED_LOCAL",
      permanentLabel: artificial ? "DADO ARTIFICIAL — ETIQUETA PERMANENTE" : "DADO AUTORIZADO — ARQUIVO LOCAL",
      metadata: evaluation.metadata,
      integrity: {
        algorithm: "SHA-256",
        digestInput: "ORIGINAL_BYTES",
        sha256: digest,
        structuralValidation: "PASS",
        rows: inspection.validRows,
        invalidRows: inspection.invalidRows,
        duplicateTimestamps: inspection.duplicateTimestamps,
        periodStart: inspection.periodStart,
        periodEnd: inspection.periodEnd
      },
      adapterPolicy: { mode: "LOCAL_FILE_ONLY", credentialsStored: false, brokerConnection: false }
    };
  }

  function normalizeManifest(candidate = {}) {
    const digest = normalizeDigest(candidate?.integrity?.sha256);
    const legacyDigest = Number(candidate.schemaVersion || 1) < 2 && candidate?.integrity?.digestInput !== "ORIGINAL_BYTES";
    const metadataEvaluation = validateMetadata(candidate.metadata, { allowLegacyTimezone: legacyDigest });
    const createdAt = new Date(candidate.createdAt);
    if (!digest || !metadataEvaluation.valid || !Number.isFinite(createdAt.getTime())) return null;
    const artificial = candidate.classification === "ARTIFICIAL_PERMANENT" || metadataEvaluation.metadata.sourceType === "ARTIFICIAL";
    return {
      ...candidate,
      schemaVersion: legacyDigest ? 1 : 2,
      classification: artificial ? "ARTIFICIAL_PERMANENT" : "AUTHORIZED_LOCAL",
      permanentLabel: artificial ? "DADO ARTIFICIAL — ETIQUETA PERMANENTE" : "DADO AUTORIZADO — ARQUIVO LOCAL",
      metadata: metadataEvaluation.metadata,
      integrity: { ...candidate.integrity, algorithm: "SHA-256", digestInput: legacyDigest ? "UTF8_DECODED_TEXT" : "ORIGINAL_BYTES", sha256: digest },
      adapterPolicy: { mode: "LOCAL_FILE_ONLY", credentialsStored: false, brokerConnection: false }
    };
  }

  function normalizeRegistry(candidate = []) {
    if (!Array.isArray(candidate)) return [];
    const seen = new Set();
    return candidate.map(normalizeManifest).filter(manifest => {
      if (!manifest || seen.has(manifest.integrity.sha256)) return false;
      seen.add(manifest.integrity.sha256);
      return true;
    }).slice(0, MAX_DATASETS);
  }

  function verifyDigest(manifest, sha256, legacySha256) {
    const normalized = normalizeManifest(manifest);
    const digest = normalizeDigest(sha256);
    const legacyDigest = normalizeDigest(legacySha256);
    if (!normalized || (!digest && !legacyDigest)) return { valid: false, status: "INVALID", message: "Manifesto ou SHA-256 inválido." };
    const stored = normalized.integrity.sha256;
    const match = stored === digest || (normalized.integrity.digestInput === "UTF8_DECODED_TEXT" && stored === legacyDigest);
    return { valid: match, status: match ? "MATCH" : "MISMATCH", message: match ? "Arquivo corresponde ao manifesto registrado." : "Arquivo diferente: SHA-256 não corresponde ao manifesto." };
  }

  return {
    MAX_DATASETS,
    SOURCE_TYPES,
    parseCsvLine,
    detectDelimiter,
    parseTimestamp,
    inspectCsv,
    normalizeMetadata,
    validateMetadata,
    createManifest,
    normalizeManifest,
    normalizeRegistry,
    verifyDigest
  };
});
