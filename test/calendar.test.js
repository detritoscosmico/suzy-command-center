const test = require("node:test");
const assert = require("node:assert/strict");
const {
  detectDelimiter,
  parseCsv,
  normalizeDateTime,
  normalizeImpact,
  normalizeEvents,
  importCalendarText,
  classifyEvent,
  filterEvents,
  summarizeEvents,
  createDemoEvents,
  normalizeSnapshot
} = require("../js/calendar-core.js");

function event(overrides = {}) {
  return {
    datetime: "2026-08-03T13:30:00-03:00",
    currency: "USD",
    event: "Decisão de juros",
    impact: "HIGH",
    previous: "5,25%",
    forecast: "5,00%",
    actual: "",
    source: "Fonte autorizada",
    source_url: "https://example.com/calendar",
    ...overrides
  };
}

test("detecta vírgula, ponto e vírgula e tabulação", () => {
  assert.equal(detectDelimiter("a,b,c\n1,2,3"), ",");
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");
});

test("interpreta CSV com aspas e vírgulas internas", () => {
  const rows = parseCsv('datetime,currency,event,impact,source\n2026-08-03T13:30:00-03:00,USD,"Inflação, núcleo",HIGH,"Fonte oficial"');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].event, "Inflação, núcleo");
});

test("exige fuso horário explícito e normaliza impacto", () => {
  assert.equal(normalizeDateTime("2026-08-03T13:30:00"), null);
  assert.equal(normalizeDateTime("2026-08-03T13:30:00-03:00"), "2026-08-03T16:30:00.000Z");
  assert.equal(normalizeImpact("alto"), "HIGH");
  assert.equal(normalizeImpact("médio"), "MEDIUM");
  assert.equal(normalizeImpact("baixo"), "LOW");
});

test("normaliza, ordena, rejeita inválidos e remove duplicatas", () => {
  const result = normalizeEvents([
    event({ datetime: "2026-08-03T14:30:00-03:00" }),
    event(),
    event(),
    event({ datetime: "2026-08-03T13:30:00", event: "Sem fuso" })
  ]);

  assert.equal(result.events.length, 2);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.duplicates, 1);
  assert.equal(result.events[0].datetime, "2026-08-03T16:30:00.000Z");
});

test("importa cabeçalhos em português com fonte padrão", () => {
  const csv = [
    "data_hora;moeda;evento;impacto;anterior;previsao",
    "2026-08-03T13:30:00-03:00;USD;Decisão de juros;alto;5,25%;5,00%"
  ].join("\n");
  const result = importCalendarText(csv, "csv", { sourceName: "Banco central", sourceUrl: "https://example.com" });
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].source, "Banco central");
  assert.equal(result.events[0].impact, "HIGH");
});

test("classifica janelas de risco pelo relógio informado", () => {
  const now = new Date("2026-08-03T16:00:00.000Z");
  assert.equal(classifyEvent({ datetime: "2026-08-03T15:50:00.000Z" }, now), "PAST");
  assert.equal(classifyEvent({ datetime: "2026-08-03T16:03:00.000Z" }, now), "NOW");
  assert.equal(classifyEvent({ datetime: "2026-08-03T16:30:00.000Z" }, now), "NEXT");
  assert.equal(classifyEvent({ datetime: "2026-08-03T20:00:00.000Z" }, now), "TODAY");
  assert.equal(classifyEvent({ datetime: "2026-08-04T20:00:00.000Z" }, now), "FUTURE");
});

test("filtra por moeda, impacto e status", () => {
  const normalized = normalizeEvents([
    event({ datetime: "2026-08-03T13:30:00-03:00", currency: "USD", impact: "HIGH" }),
    event({ datetime: "2026-08-03T14:30:00-03:00", currency: "EUR", impact: "MEDIUM", event: "Inflação" }),
    event({ datetime: "2026-08-02T13:30:00-03:00", currency: "JPY", impact: "LOW", event: "Evento anterior" })
  ]).events;
  const now = new Date("2026-08-03T16:00:00.000Z");
  assert.equal(filterEvents(normalized, { currency: "USD", impact: "HIGH", status: "UPCOMING" }, now).length, 1);
  assert.equal(filterEvents(normalized, { status: "PAST" }, now).length, 1);
});

test("resume eventos das próximas 24 horas", () => {
  const events = normalizeEvents([
    event({ datetime: "2026-08-03T16:30:00Z", impact: "HIGH" }),
    event({ datetime: "2026-08-03T18:00:00Z", impact: "MEDIUM", event: "Inflação" }),
    event({ datetime: "2026-08-05T18:00:00Z", impact: "HIGH", event: "Fora da janela" })
  ]).events;
  const summary = summarizeEvents(events, new Date("2026-08-03T16:00:00Z"));
  assert.equal(summary.total, 3);
  assert.equal(summary.upcoming24h, 2);
  assert.equal(summary.high24h, 1);
});

test("gera cenário artificial explícito e recupera snapshot salvo", () => {
  const demo = createDemoEvents(new Date("2026-08-03T16:00:00Z"));
  assert.equal(demo.length, 3);
  assert.equal(demo.every(item => item.isDemo), true);
  const snapshot = normalizeSnapshot({
    sourceName: "Cenário artificial da Academia Suzy",
    authorized: false,
    events: demo
  });
  assert.equal(snapshot.events.length, 3);
});