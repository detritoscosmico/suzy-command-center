const test = require("node:test");
const assert = require("node:assert/strict");
const {
  localDateKey,
  consecutiveLosses,
  calculateStats,
  calculateLimits,
  evaluateRisk
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
