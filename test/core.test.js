const test = require("node:test");
const assert = require("node:assert/strict");
const assetCatalog = require("../dados/ativos.json");
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
  timeframeDuration,
  chartTimeLabelMode,
  generateDemoCandles,
  calculateEma,
  calculateSma,
  calculateBollinger,
  calculateRsi,
  detectCandlePatterns,
  detectFlagPattern
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

test("catálogo inclui 24 ações globais sem tickers duplicados", () => {
  const stocks = normalizeCatalog(assetCatalog).filter(asset => asset.cat === "Ações");
  const requestedTickers = ["TSLA", "GS", "AAPL", "AA", "MSFT", "AMZN", "GOOGL", "NVDA", "BAC", "VALE3", "WEGE3", "PETR4"];

  assert.ok(assetCatalog.categorias.includes("Ações"));
  assert.equal(stocks.length, 24);
  assert.equal(new Set(stocks.map(asset => asset.ticker)).size, stocks.length);
  for (const ticker of requestedTickers) assert.ok(stocks.some(asset => asset.ticker === ticker), `${ticker} ausente do catálogo`);
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

test("converte todos os períodos do gráfico em milissegundos", () => {
  assert.equal(timeframeDuration("S5"), 5000);
  assert.equal(timeframeDuration("S30"), 30000);
  assert.equal(timeframeDuration("M30"), 1800000);
  assert.equal(timeframeDuration("H12"), 43200000);
  assert.equal(timeframeDuration("D1"), 86400000);
  assert.equal(timeframeDuration("W1"), 604800000);
  assert.equal(timeframeDuration("MN1"), 2592000000);
  assert.equal(timeframeDuration("desconhecido"), 300000);
});

test("escolhe rótulos de eixo conforme o período total exibido", () => {
  assert.equal(chartTimeLabelMode(timeframeDuration("S5"), 79 * timeframeDuration("S5")), "TIME_SECONDS");
  assert.equal(chartTimeLabelMode(timeframeDuration("M5"), 79 * timeframeDuration("M5")), "TIME");
  assert.equal(chartTimeLabelMode(timeframeDuration("H12"), 79 * timeframeDuration("H12")), "DATE_TIME");
  assert.equal(chartTimeLabelMode(timeframeDuration("D1"), 79 * timeframeDuration("D1")), "DATE");
  assert.equal(chartTimeLabelMode(timeframeDuration("MN1"), 79 * timeframeDuration("MN1")), "DATE_YEAR");
});

test("gera candles em períodos de segundos e longo prazo", () => {
  const seconds = generateDemoCandles({ basePrice: 100, count: 10, intervalMilliseconds: timeframeDuration("S5"), endTime: 300000, random: () => 0.5 });
  const endTime = Date.UTC(2026, 7, 31, 12);
  const monthly = generateDemoCandles({ basePrice: 100, count: 10, timeframeCode: "MN1", intervalMilliseconds: timeframeDuration("MN1"), endTime, random: () => 0.5 });
  assert.equal(seconds[1].time - seconds[0].time, 5000);
  assert.equal(monthly.at(-1).time, endTime);
  assert.equal(monthly.at(-2).time, Date.UTC(2026, 6, 31, 12));
  assert.equal(monthly.at(-3).time, Date.UTC(2026, 5, 30, 12));
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

test("calcula SMA somente após completar o período", () => {
  assert.deepEqual(calculateSma([1, 2, 3, 4], 3), [null, null, 2, 3]);
});

test("calcula bandas de Bollinger ao redor da média", () => {
  const bands = calculateBollinger([1, 2, 3, 4], 3, 2);
  assert.equal(bands.middle[2], 2);
  assert.ok(bands.upper[2] > bands.middle[2]);
  assert.ok(bands.lower[2] < bands.middle[2]);
  assert.equal(bands.upper[0], null);
});

test("calcula RSI para alta, baixa e lateralidade", () => {
  assert.equal(calculateRsi([1, 2, 3, 4], 2).at(-1), 100);
  assert.equal(calculateRsi([4, 3, 2, 1], 2).at(-1), 0);
  assert.equal(calculateRsi([2, 2, 2, 2], 2).at(-1), 50);
});

test("reconhece padrões clássicos de velas por geometria", () => {
  const candles = [
    { open: 10, high: 10.55, low: 9.45, close: 10.05 },
    { open: 10, high: 10.25, low: 8, close: 10.2 },
    { open: 10.2, high: 12.4, low: 9.95, close: 10 }
  ];
  const types = detectCandlePatterns(candles).map(pattern => pattern.type);
  assert.ok(types.includes("DOJI"));
  assert.ok(types.includes("HAMMER"));
  assert.ok(types.includes("SHOOTING_STAR"));
});

test("reconhece engolfo de alta", () => {
  const patterns = detectCandlePatterns([
    { open: 10, high: 10.2, low: 8.8, close: 9 },
    { open: 8.9, high: 10.4, low: 8.7, close: 10.2 }
  ]);
  assert.ok(patterns.some(pattern => pattern.type === "BULLISH_ENGULFING"));
});

test("reconhece bandeira de alta após impulso e correção estreita", () => {
  const closes = [100, 102, 104, 106, 108, 110, 109.8, 109.6, 109.4, 109.2, 109, 108.8];
  const candles = closes.map((close, index) => ({ open: index ? closes[index - 1] : 99.8, close, high: Math.max(close, index ? closes[index - 1] : 99.8) + 0.2, low: Math.min(close, index ? closes[index - 1] : 99.8) - 0.2 }));
  const pattern = detectFlagPattern(candles, 12);
  assert.equal(pattern?.type, "BULL_FLAG");
});
