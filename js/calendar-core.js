(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyCalendarCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MAX_FILE_BYTES = 2 * 1024 * 1024;
  const MAX_ROWS = 5000;
  const STORAGE_VERSION = 1;

  const HEADER_ALIASES = {
    datetime: ["datetime", "date_time", "datahora", "data_hora", "timestamp", "scheduled_at", "horario", "data_e_hora"],
    currency: ["currency", "moeda", "country", "pais", "asset", "ativo"],
    event: ["event", "evento", "title", "titulo", "name", "nome"],
    impact: ["impact", "impacto", "importance", "importancia"],
    actual: ["actual", "real", "resultado"],
    forecast: ["forecast", "previsao", "consenso", "consensus"],
    previous: ["previous", "anterior", "previo"],
    source: ["source", "fonte", "provider", "provedor"],
    sourceUrl: ["source_url", "fonte_url", "url", "link"]
  };

  function stripAccents(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeHeader(value) {
    return stripAccents(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function detectDelimiter(text) {
    const line = String(text ?? "").replace(/^\uFEFF/, "").split(/\r?\n/).find(item => item.trim()) || "";
    const candidates = [",", ";", "\t"];
    const counts = Object.fromEntries(candidates.map(delimiter => [delimiter, 0]));
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') index += 1;
        else quoted = !quoted;
      } else if (!quoted && Object.hasOwn(counts, char)) {
        counts[char] += 1;
      }
    }
    return candidates.sort((left, right) => counts[right] - counts[left])[0];
  }

  function parseCsvRows(text, delimiter = detectDelimiter(text)) {
    const input = String(text ?? "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (quoted) {
        if (char === '"' && input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          cell += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === delimiter) {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\n") {
        row.push(cell.trim().replace(/\r$/, ""));
        if (row.some(value => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell.trim().replace(/\r$/, ""));
    if (row.some(value => value !== "")) rows.push(row);
    return rows;
  }

  function parseCsv(text) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) throw new Error("O CSV precisa de cabeçalho e ao menos uma linha de evento.");
    const headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
  }

  function parseJson(text) {
    let parsed;
    try {
      parsed = JSON.parse(String(text ?? ""));
    } catch {
      throw new Error("O arquivo JSON não é válido.");
    }
    const rows = Array.isArray(parsed) ? parsed : parsed?.events;
    if (!Array.isArray(rows)) throw new Error("O JSON precisa ser uma lista ou conter a propriedade events.");
    return rows;
  }

  function pick(row, field) {
    const normalized = Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [normalizeHeader(key), value]));
    for (const alias of HEADER_ALIASES[field]) {
      if (normalized[alias] !== undefined && String(normalized[alias]).trim() !== "") return normalized[alias];
    }
    return "";
  }

  function normalizeDateTime(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      const milliseconds = value > 10_000_000_000 ? value : value * 1000;
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    const raw = String(value ?? "").trim();
    if (!raw || !/(Z|[+-]\d{2}:?\d{2})$/i.test(raw)) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function normalizeImpact(value) {
    const normalized = stripAccents(value).trim().toUpperCase();
    if (["HIGH", "ALTO", "ALTA", "3"].includes(normalized)) return "HIGH";
    if (["MEDIUM", "MEDIO", "MEDIA", "2"].includes(normalized)) return "MEDIUM";
    if (["LOW", "BAIXO", "BAIXA", "1"].includes(normalized)) return "LOW";
    return null;
  }

  function normalizeCurrency(value) {
    const currency = String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return /^[A-Z0-9]{2,10}$/.test(currency) ? currency : null;
  }

  function normalizeUrl(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw);
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
    } catch {
      return null;
    }
  }

  function cleanText(value, maxLength) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  }

  function normalizeEvent(row, options = {}, index = 0) {
    const datetime = normalizeDateTime(pick(row, "datetime"));
    if (!datetime) return { valid: false, reason: "Data/hora inválida ou sem fuso horário.", index };

    const currency = normalizeCurrency(pick(row, "currency"));
    if (!currency) return { valid: false, reason: "Moeda ou país inválido.", index };

    const title = cleanText(pick(row, "event"), 160);
    if (!title) return { valid: false, reason: "Nome do evento ausente.", index };

    const impact = normalizeImpact(pick(row, "impact"));
    if (!impact) return { valid: false, reason: "Impacto inválido; use HIGH, MEDIUM ou LOW.", index };

    const source = cleanText(pick(row, "source") || options.sourceName, 120);
    if (!source) return { valid: false, reason: "Fonte ausente.", index };

    const sourceUrl = normalizeUrl(pick(row, "sourceUrl") || options.sourceUrl);
    if (sourceUrl === null) return { valid: false, reason: "URL da fonte inválida.", index };

    const actual = cleanText(pick(row, "actual"), 60);
    const forecast = cleanText(pick(row, "forecast"), 60);
    const previous = cleanText(pick(row, "previous"), 60);
    const id = [datetime, currency, title.toLowerCase(), source.toLowerCase()].join("|");

    return {
      valid: true,
      event: {
        id,
        datetime,
        currency,
        title,
        impact,
        actual,
        forecast,
        previous,
        source,
        sourceUrl: sourceUrl || "",
        isDemo: Boolean(options.isDemo)
      }
    };
  }

  function normalizeEvents(rows, options = {}) {
    if (!Array.isArray(rows)) throw new Error("A lista de eventos é inválida.");
    if (rows.length > MAX_ROWS) throw new Error(`O arquivo excede o limite de ${MAX_ROWS} eventos.`);

    const rejected = [];
    const unique = new Map();
    rows.forEach((row, index) => {
      if (!row || typeof row !== "object") {
        rejected.push({ index, reason: "Linha vazia ou inválida." });
        return;
      }
      const result = normalizeEvent(row, options, index);
      if (!result.valid) rejected.push({ index, reason: result.reason });
      else unique.set(result.event.id, result.event);
    });

    const events = [...unique.values()].sort((left, right) => Date.parse(left.datetime) - Date.parse(right.datetime));
    return { events, rejected, duplicates: Math.max(0, rows.length - rejected.length - events.length) };
  }

  function importCalendarText(text, format, options = {}) {
    if (new Blob([String(text ?? "")]).size > MAX_FILE_BYTES) throw new Error("O arquivo excede o limite de 2 MB.");
    const normalizedFormat = String(format ?? "").toLowerCase();
    const rows = normalizedFormat === "json" ? parseJson(text) : parseCsv(text);
    const result = normalizeEvents(rows, options);
    if (!result.events.length) throw new Error("Nenhum evento válido foi encontrado.");
    return result;
  }

  function localDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function classifyEvent(event, now = new Date()) {
    const timestamp = Date.parse(event.datetime);
    const current = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const minutes = (timestamp - current) / 60000;
    if (minutes < -5) return "PAST";
    if (Math.abs(minutes) <= 5) return "NOW";
    if (minutes <= 60) return "NEXT";
    if (localDateKey(timestamp) === localDateKey(current)) return "TODAY";
    return "FUTURE";
  }

  function filterEvents(events, filters = {}, now = new Date()) {
    return (Array.isArray(events) ? events : []).filter(event => {
      const key = localDateKey(event.datetime);
      const status = classifyEvent(event, now);
      if (filters.from && key < filters.from) return false;
      if (filters.to && key > filters.to) return false;
      if (filters.currency && filters.currency !== "ALL" && event.currency !== filters.currency) return false;
      if (filters.impact && filters.impact !== "ALL" && event.impact !== filters.impact) return false;
      if (filters.status === "UPCOMING" && status === "PAST") return false;
      if (filters.status === "PAST" && status !== "PAST") return false;
      if (filters.status === "TODAY" && key !== localDateKey(now)) return false;
      return true;
    });
  }

  function summarizeEvents(events, now = new Date()) {
    const current = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const next24Hours = (Array.isArray(events) ? events : []).filter(event => {
      const delta = Date.parse(event.datetime) - current;
      return delta >= 0 && delta <= 24 * 60 * 60 * 1000;
    });
    return {
      total: events.length,
      upcoming24h: next24Hours.length,
      high24h: next24Hours.filter(event => event.impact === "HIGH").length,
      now: events.filter(event => classifyEvent(event, now) === "NOW").length
    };
  }

  function createDemoEvents(now = new Date()) {
    const base = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const rows = [
      { offset: 30, currency: "USD", event: "Decisão de juros — exemplo artificial", impact: "HIGH", forecast: "Exemplo", previous: "Exemplo" },
      { offset: 95, currency: "EUR", event: "Inflação ao consumidor — exemplo artificial", impact: "MEDIUM", forecast: "Exemplo", previous: "Exemplo" },
      { offset: 24 * 60 + 45, currency: "JPY", event: "Coletiva de banco central — exemplo artificial", impact: "HIGH", forecast: "—", previous: "—" }
    ].map(item => ({
      datetime: new Date(base + item.offset * 60000).toISOString(),
      currency: item.currency,
      event: item.event,
      impact: item.impact,
      forecast: item.forecast,
      previous: item.previous,
      source: "Cenário artificial da Academia Suzy"
    }));
    return normalizeEvents(rows, { isDemo: true }).events;
  }

  function createSnapshot(events, metadata = {}) {
    return {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      sourceName: cleanText(metadata.sourceName, 120),
      sourceUrl: normalizeUrl(metadata.sourceUrl) || "",
      authorized: Boolean(metadata.authorized),
      events: normalizeEvents(events, { sourceName: metadata.sourceName, sourceUrl: metadata.sourceUrl }).events
    };
  }

  function normalizeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return { version: STORAGE_VERSION, events: [], sourceName: "", sourceUrl: "", authorized: false };
    const result = normalizeEvents(Array.isArray(snapshot.events) ? snapshot.events : [], {
      sourceName: snapshot.sourceName,
      sourceUrl: snapshot.sourceUrl,
      isDemo: false
    });
    return {
      version: STORAGE_VERSION,
      savedAt: cleanText(snapshot.savedAt, 40),
      sourceName: cleanText(snapshot.sourceName, 120),
      sourceUrl: normalizeUrl(snapshot.sourceUrl) || "",
      authorized: Boolean(snapshot.authorized),
      events: result.events
    };
  }

  return {
    MAX_FILE_BYTES,
    MAX_ROWS,
    STORAGE_VERSION,
    detectDelimiter,
    parseCsvRows,
    parseCsv,
    parseJson,
    normalizeDateTime,
    normalizeImpact,
    normalizeCurrency,
    normalizeUrl,
    normalizeEvent,
    normalizeEvents,
    importCalendarText,
    localDateKey,
    classifyEvent,
    filterEvents,
    summarizeEvents,
    createDemoEvents,
    createSnapshot,
    normalizeSnapshot
  };
});