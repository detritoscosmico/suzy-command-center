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

  function clampInteger(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
  }

  function normalizeAsset(asset) {
    if (!asset || typeof asset !== "object") return null;

    const ticker = String(asset.ticker ?? "").trim();
    const name = String(asset.name ?? "").trim();
    const price = Number(asset.price);

    if (!ticker || !name || !Number.isFinite(price) || price <= 0) return null;

    return {
      ticker,
      name,
      price,
      decimals: clampInteger(asset.decimals, 0, 8, 2),
      cat: String(asset.cat ?? "Outros").trim() || "Outros",
      icon: String(asset.icon ?? "•").trim() || "•",
      pop: clampInteger(asset.pop, 1, 3, 1),
      force: clampInteger(asset.force, 1, 4, 1)
    };
  }

  function normalizeCatalog(payload, fallback = []) {
    const candidateRows = Array.isArray(payload?.ativos) ? payload.ativos : [];
    const normalized = [];
    const seenTickers = new Set();

    for (const row of candidateRows) {
      const asset = normalizeAsset(row);
      if (!asset || seenTickers.has(asset.ticker)) continue;
      seenTickers.add(asset.ticker);
      normalized.push(asset);
    }

    if (normalized.length) return normalized;

    return fallback
      .map(normalizeAsset)
      .filter(Boolean)
      .filter(asset => {
        if (seenTickers.has(asset.ticker)) return false;
        seenTickers.add(asset.ticker);
        return true;
      });
  }

  function analyzeDemoAssets(assets = [], options = {}) {
    const category = String(options.category ?? "Todos");
    const minForce = clampInteger(options.minForce, 1, 4, 1);
    const limit = clampInteger(options.limit, 1, 50, 10);

    return assets
      .filter(asset => asset && Number(asset.force) >= minForce)
      .filter(asset => category === "Todos" || (category === "OTC" ? String(asset.ticker).includes("(OTC)") : asset.cat === category))
      .map(asset => {
        const change = Number.isFinite(Number(asset.change)) ? Number(asset.change) : 0;
        const movement = Math.abs(change);
        const score = Math.round(Number(asset.force) * 18 + Number(asset.pop) * 8 + Math.min(movement * 300, 25));
        const direction = movement < 0.02 ? "WAIT" : change > 0 ? "UP" : "DOWN";
        return { ...asset, change, movement, score, direction };
      })
      .sort((left, right) => right.score - left.score || right.movement - left.movement || left.ticker.localeCompare(right.ticker))
      .slice(0, limit);
  }

  function generateDemoCandles(options = {}) {
    const basePrice = Number(options.basePrice);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return [];

    const count = clampInteger(options.count, 10, 100, 48);
    const intervalMinutes = clampInteger(options.intervalMinutes, 1, 60, 1);
    const random = typeof options.random === "function" ? options.random : Math.random;
    const endTime = Number.isFinite(Number(options.endTime)) ? Number(options.endTime) : Date.now();
    const volatility = basePrice * 0.0015;
    const candles = [];
    let previousClose = basePrice;

    for (let index = 0; index < count; index += 1) {
      const open = previousClose;
      const close = Math.max(basePrice * 0.1, open + (random() - 0.48) * volatility);
      const wickUp = random() * volatility * 0.55;
      const wickDown = random() * volatility * 0.55;
      const high = Math.max(open, close) + wickUp;
      const low = Math.max(0.00000001, Math.min(open, close) - wickDown);
      const time = endTime - (count - 1 - index) * intervalMinutes * 60000;

      candles.push({ time, open, high, low, close });
      previousClose = close;
    }

    return candles;
  }

  function calculateEma(values = [], period = 9) {
    const safePeriod = clampInteger(period, 1, 200, 9);
    const multiplier = 2 / (safePeriod + 1);
    let previous = null;

    return values.map(value => {
      const number = Number(value);
      if (!Number.isFinite(number)) return previous;
      previous = previous === null ? number : number * multiplier + previous * (1 - multiplier);
      return previous;
    });
  }

  function buildDemoCalendar(baseDate = new Date()) {
    const templates = [
      [0, 9, 0, "USD", "Inflação — cenário de estudo", "HIGH"],
      [0, 11, 30, "BRL", "Atividade econômica — cenário de estudo", "MEDIUM"],
      [0, 15, 0, "EUR", "Discurso monetário — cenário de estudo", "LOW"],
      [1, 8, 0, "GBP", "Emprego — cenário de estudo", "HIGH"],
      [1, 10, 30, "USD", "Estoques e atividade — cenário de estudo", "MEDIUM"],
      [1, 14, 0, "JPY", "Confiança econômica — cenário de estudo", "LOW"],
      [2, 9, 30, "EUR", "Decisão de juros — cenário de estudo", "HIGH"],
      [2, 13, 0, "BRL", "Inflação ao produtor — cenário de estudo", "MEDIUM"],
      [2, 16, 0, "USD", "PIB — cenário de estudo", "HIGH"]
    ];

    return templates.map(([dayOffset, hour, minute, currency, title, impact], index) => {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + dayOffset, hour, minute, 0, 0);
      return { id: `demo-${index + 1}`, time: date.getTime(), currency, title, impact };
    });
  }

  function calendarEventStatus(eventTime, now = new Date()) {
    const difference = Number(eventTime) - now.getTime();
    if (!Number.isFinite(difference)) return "UNKNOWN";
    if (Math.abs(difference) <= 15 * 60000) return "LIVE";
    return difference > 0 ? "UPCOMING" : "DONE";
  }

  function filterCalendarEvents(events = [], options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const requestedKey = options.day === "TOMORROW" ? localDateKey(tomorrow) : localDateKey(now);

    return events
      .filter(event => options.day === "ALL" || localDateKey(new Date(event.time)) === requestedKey)
      .filter(event => !options.currency || options.currency === "ALL" || event.currency === options.currency)
      .filter(event => !options.impact || options.impact === "ALL" || event.impact === options.impact)
      .sort((left, right) => left.time - right.time);
  }

  return {
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
  };
});
