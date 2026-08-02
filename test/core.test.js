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
  normalizeCatalog
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
