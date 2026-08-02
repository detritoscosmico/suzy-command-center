(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function consecutiveLosses(operations = []) {
    let count = 0;

    for (let index = operations.length - 1; index >= 0; index -= 1) {
      if (operations[index].result !== "LOSS") break;
      count += 1;
    }

    return count;
  }

  function calculateStats({ operations = [], initialBank = 0, dateKey }) {
    const daily = operations.filter(operation => operation.dateKey === dateKey);
    const wins = daily.filter(operation => operation.result === "WIN").length;
    const losses = daily.filter(operation => operation.result === "LOSS").length;
    const dailyPnl = daily.reduce((sum, operation) => sum + Number(operation.pnl), 0);
    const allPnl = operations.reduce((sum, operation) => sum + Number(operation.pnl), 0);

    return {
      daily,
      wins,
      losses,
      total: daily.length,
      dailyPnl,
      balance: Number(initialBank) + allPnl,
      winrate: daily.length ? Math.round((wins / daily.length) * 100) : 0,
      lossStreak: consecutiveLosses(daily)
    };
  }

  function calculateLimits({ balance, initialBank, riskPct, stopLossPct, stopGainPct }) {
    return {
      maxEntry: Math.max(1, Number(balance) * (Number(riskPct) / 100)),
      stopLoss: Number(initialBank) * (Number(stopLossPct) / 100),
      stopGain: Number(initialBank) * (Number(stopGainPct) / 100)
    };
  }

  function evaluateRisk({ stats, limits, maxOps, maxLosses, amount, formatMoney = String }) {
    let reason = "";

    if (stats.dailyPnl <= -limits.stopLoss) reason = "Stop loss diário atingido.";
    else if (stats.dailyPnl >= limits.stopGain) reason = "Stop gain diário atingido. Proteja o resultado.";
    else if (stats.total >= maxOps) reason = "Limite máximo de operações atingido.";
    else if (stats.lossStreak >= maxLosses) reason = "Limite de perdas consecutivas atingido.";
    else if (amount <= 0) reason = "Informe um valor de entrada válido.";
    else if (amount > limits.maxEntry) reason = `Entrada acima do limite de ${formatMoney(limits.maxEntry)}.`;

    return { blocked: Boolean(reason), reason, stats, limits };
  }

  function sanitizeCsvCell(value) {
    let text = String(value ?? "");

    if (typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(text)) {
      text = `'${text}`;
    }

    return `"${text.replaceAll('"', '""')}"`;
  }

  function serializeCsv(rows = [], delimiter = ";") {
    return rows
      .map(row => row.map(sanitizeCsvCell).join(delimiter))
      .join("\n");
  }

  return {
    localDateKey,
    consecutiveLosses,
    calculateStats,
    calculateLimits,
    evaluateRisk,
    sanitizeCsvCell,
    serializeCsv
  };
});
