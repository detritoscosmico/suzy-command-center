const test = require("node:test");
const assert = require("node:assert/strict");
const {
  localDateKey,
  consecutiveLosses,
  calculateStats,
  calculateLimits,
  evaluateRisk,
  sanitizeCsvCell,
  serializeCsv,
  normalizeAsset,
  normalizeCatalog,
  analyzeDemoAssets,
  generateDemoCandles,
  calculateEma,
  buildDemoCalendar,
  calendarEventStatus,
  filterCalendarEvents
} = require("../js/core.js");

test("gera a chave diária usando a data local", () => {
  const lateEvening = new Date(2026, 6, 31, 23, 45, 0);
  assert.equal(localDateKey(lateEvening), "2026-07-31");
});

test("preenche mês e dia com zero", () => {
  const earlyYear = new Date(2026, 0, 5, 8, 0, 0);
  assert.equal(localDateKey(earlyYear), "2026-01-05");
});

test("conta somente as perdas consecutivas mais recentes", () => {
  const operations = [{ result: "LOSS" }, { result: "WIN" }, { result: "LOSS" }, { result: "LOSS" }];
  assert.equal(consecutiveLosses(operations), 2);
});

test("calcula estatísticas diárias sem perder o saldo histórico", () => {
  const operations = [
    { dateKey: "2026-07-31", result: "WIN", pnl: 85 },
    { dateKey: "2026-08-01", result: "LOSS", pnl: -100 },
    { dateKey: "2026-08-01", result: "WIN", pnl: 85 }
  ];
  const stats = calculateStats({ operations, initialBank: 10000, dateKey: "2026-08-01" });
  assert.equal(stats.total, 2);
  assert.equal(stats.dailyPnl, -15);
  assert.equal(stats.balance, 10070);
  assert.equal(stats.winrate, 50);
});

test("calcula os limites financeiros da missão", () => {
  const limits = calculateLimits({
    balance: 10000,
    initialBank: 10000,
    riskPct: 1,
    stopLossPct: 3,
    stopGainPct: 5
  });
  assert.deepEqual(limits, { maxEntry: 100, stopLoss: 300, stopGain: 500 });
});

const baseLimits = { maxEntry: 100, stopLoss: 300, stopGain: 500 };
const baseStats = { dailyPnl: 0, total: 0, lossStreak: 0 };

test("bloqueia ao atingir stop loss, stop gain e limites operacionais", () => {
  const cases = [
    [{ ...baseStats, dailyPnl: -300 }, "Stop loss diário atingido."],
    [{ ...baseStats, dailyPnl: 500 }, "Stop gain diário atingido. Proteja o resultado."],
    [{ ...baseStats, total: 5 }, "Limite máximo de operações atingido."],
    [{ ...baseStats, lossStreak: 3 }, "Limite de perdas consecutivas atingido."]
  ];
  for (const [stats, expectedReason] of cases) {
    const risk = evaluateRisk({ stats, limits: baseLimits, maxOps: 5, maxLosses: 3, amount: 100 });
    assert.equal(risk.blocked, true);
    assert.equal(risk.reason, expectedReason);
  }
});

test("bloqueia entrada inválida ou acima do limite", () => {
  const invalid = evaluateRisk({ stats: baseStats, limits: baseLimits, maxOps: 5, maxLosses: 3, amount: 0 });
  const excessive = evaluateRisk({
    stats: baseStats,
    limits: baseLimits,
    maxOps: 5,
    maxLosses: 3,
    amount: 101,
    formatMoney: value => `R$ ${value}`
  });
  assert.equal(invalid.reason, "Informe um valor de entrada válido.");
  assert.equal(excessive.reason, "Entrada acima do limite de R$ 100.");
});

test("libera entrada que respeita todas as regras", () => {
  const risk = evaluateRisk({ stats: baseStats, limits: baseLimits, maxOps: 5, maxLosses: 3, amount: 100 });
  assert.equal(risk.blocked, false);
  assert.equal(risk.reason, "");
});

test("neutraliza fórmulas de planilha em células CSV", () => {
  assert.equal(sanitizeCsvCell("=2+2"), '"\'=2+2"');
  assert.equal(sanitizeCsvCell(" +SUM(A1:A2)"), '"\' +SUM(A1:A2)"');
  assert.equal(sanitizeCsvCell("@cmd"), '"\'@cmd"');
  assert.equal(sanitizeCsvCell("texto seguro"), '"texto seguro"');
});

test("preserva números como dados e escapa aspas no CSV", () => {
  assert.equal(sanitizeCsvCell(-100), '"-100"');
  assert.equal(sanitizeCsvCell('observação "manual"'), '"observação ""manual"""');
});

test("serializa todas as células usando a proteção contra fórmulas", () => {
  const csv = serializeCsv([
    ["motivo", "pnl"],
    ["=HYPERLINK(\"https://example.invalid\")", -100]
  ]);
  assert.equal(
    csv,
    '"motivo";"pnl"\n"\'=HYPERLINK(""https://example.invalid"")";"-100"'
  );
});

test("normaliza um ativo válido e limita campos numéricos", () => {
  const asset = normalizeAsset({
    ticker: " BTC/USD ",
    name: " Bitcoin ",
    price: "123.45",
    decimals: 99,
    cat: "Cripto",
    icon: "₿",
    pop: 8,
    force: 0
  });

  assert.deepEqual(asset, {
    ticker: "BTC/USD",
    name: "Bitcoin",
    price: 123.45,
    decimals: 8,
    cat: "Cripto",
    icon: "₿",
    pop: 3,
    force: 1
  });
});

test("descarta ativos inválidos e remove tickers duplicados", () => {
  const catalog = normalizeCatalog({
    ativos: [
      { ticker: "EUR/USD", name: "Euro / Dólar", price: 1.08, decimals: 5 },
      { ticker: "EUR/USD", name: "Duplicado", price: 2 },
      { ticker: "SEM-PRECO", name: "Inválido", price: 0 },
      null
    ]
  });

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].ticker, "EUR/USD");
});

test("usa catálogo de segurança quando o JSON não possui ativos válidos", () => {
  const fallback = [{ ticker: "XLM/USD", name: "Stellar", price: 0.28, decimals: 5 }];
  const catalog = normalizeCatalog({ ativos: [{ ticker: "", name: "Inválido", price: -1 }] }, fallback);

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].ticker, "XLM/USD");
  assert.notEqual(catalog[0], fallback[0]);
});

test("scanner demo classifica direção e ordena pela pontuação", () => {
  const result = analyzeDemoAssets([
    { ticker: "LENTO", cat: "Cripto", force: 2, pop: 1, change: 0.01 },
    { ticker: "ALTA", cat: "Cripto", force: 4, pop: 3, change: 0.08 },
    { ticker: "BAIXA", cat: "Moedas", force: 4, pop: 2, change: -0.07 }
  ]);
  assert.equal(result[0].ticker, "ALTA");
  assert.equal(result[0].direction, "UP");
  assert.equal(result[1].direction, "DOWN");
  assert.equal(result[2].direction, "WAIT");
});

test("scanner demo respeita categoria, força mínima e limite", () => {
  const result = analyzeDemoAssets([
    { ticker: "BTC/USD (OTC)", cat: "Cripto", force: 4, pop: 3, change: 0.05 },
    { ticker: "ETH/USD", cat: "Cripto", force: 3, pop: 3, change: 0.04 },
    { ticker: "USD/JPY (OTC)", cat: "OTC", force: 4, pop: 2, change: -0.03 }
  ], { category: "OTC", minForce: 4, limit: 1 });
  assert.equal(result.length, 1);
  assert.equal(result[0].ticker, "BTC/USD (OTC)");
});

test("scanner demo não altera os ativos originais", () => {
  const source = [{ ticker: "XLM/USD", cat: "Cripto", force: 4, pop: 2, change: 0.03 }];
  const result = analyzeDemoAssets(source);
  assert.notEqual(result[0], source[0]);
  assert.deepEqual(source, [{ ticker: "XLM/USD", cat: "Cripto", force: 4, pop: 2, change: 0.03 }]);
});

test("gera velas demo com OHLC válido e intervalo correto", () => {
  const candles = generateDemoCandles({ basePrice: 100, count: 10, intervalMinutes: 5, endTime: 10000000, random: () => 0.5 });
  assert.equal(candles.length, 10);
  assert.equal(candles[1].time - candles[0].time, 5 * 60000);
  for (const candle of candles) {
    assert.ok(candle.high >= Math.max(candle.open, candle.close));
    assert.ok(candle.low <= Math.min(candle.open, candle.close));
    assert.ok(candle.low > 0);
  }
});

test("não gera velas para preço base inválido", () => {
  assert.deepEqual(generateDemoCandles({ basePrice: 0 }), []);
  assert.deepEqual(generateDemoCandles({ basePrice: "inválido" }), []);
});

test("calcula média móvel exponencial", () => {
  const ema = calculateEma([10, 11, 12], 2);
  assert.equal(ema[0], 10);
  assert.ok(Math.abs(ema[1] - 10.6666666667) < 0.000001);
  assert.ok(Math.abs(ema[2] - 11.5555555556) < 0.000001);
});

test("gera calendário demo relativo à data local informada", () => {
  const events = buildDemoCalendar(new Date(2026, 7, 2, 18, 0));
  assert.equal(events.length, 9);
  assert.equal(localDateKey(new Date(events[0].time)), "2026-08-02");
  assert.equal(localDateKey(new Date(events.at(-1).time)), "2026-08-04");
  assert.ok(events.every(event => event.title.includes("cenário de estudo")));
});

test("classifica evento demo como próximo, ao vivo ou encerrado", () => {
  const now = new Date(2026, 7, 2, 10, 0);
  assert.equal(calendarEventStatus(new Date(2026, 7, 2, 11, 0).getTime(), now), "UPCOMING");
  assert.equal(calendarEventStatus(new Date(2026, 7, 2, 9, 50).getTime(), now), "LIVE");
  assert.equal(calendarEventStatus(new Date(2026, 7, 2, 9, 0).getTime(), now), "DONE");
});

test("filtra calendário demo por dia, moeda e impacto", () => {
  const now = new Date(2026, 7, 2, 7, 0);
  const events = buildDemoCalendar(now);
  const result = filterCalendarEvents(events, { day: "TOMORROW", currency: "GBP", impact: "HIGH", now });
  assert.equal(result.length, 1);
  assert.equal(result[0].currency, "GBP");
  assert.equal(localDateKey(new Date(result[0].time)), "2026-08-03");
});
