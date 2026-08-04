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

  function timeframeDuration(code = "M5") {
    const durations = {
      S5: 5 * 1000,
      S10: 10 * 1000,
      S15: 15 * 1000,
      S30: 30 * 1000,
      M1: 60 * 1000,
      M5: 5 * 60 * 1000,
      M15: 15 * 60 * 1000,
      M30: 30 * 60 * 1000,
      H1: 60 * 60 * 1000,
      H2: 2 * 60 * 60 * 1000,
      H3: 3 * 60 * 60 * 1000,
      H4: 4 * 60 * 60 * 1000,
      H12: 12 * 60 * 60 * 1000,
      D1: 24 * 60 * 60 * 1000,
      W1: 7 * 24 * 60 * 60 * 1000,
      MN1: 30 * 24 * 60 * 60 * 1000
    };
    return durations[String(code).toUpperCase()] || durations.M5;
  }

  function generateDemoCandles(options = {}) {
    const basePrice = Number(options.basePrice);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return [];

    const count = clampInteger(options.count, 10, 500, 48);
    const requestedMilliseconds = Number(options.intervalMilliseconds);
    const intervalMilliseconds = Number.isFinite(requestedMilliseconds) && requestedMilliseconds >= 1000
      ? Math.min(31 * 24 * 60 * 60 * 1000, Math.round(requestedMilliseconds))
      : clampInteger(options.intervalMinutes, 1, 60, 1) * 60000;
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
      const time = endTime - (count - 1 - index) * intervalMilliseconds;

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

  function calculateSma(values = [], period = 20) {
    const safePeriod = clampInteger(period, 1, 500, 20);
    const queue = [];
    let sum = 0;

    return values.map(value => {
      const number = Number(value);
      if (!Number.isFinite(number)) return null;
      queue.push(number);
      sum += number;
      if (queue.length > safePeriod) sum -= queue.shift();
      return queue.length === safePeriod ? sum / safePeriod : null;
    });
  }

  function calculateBollinger(values = [], period = 20, deviations = 2) {
    const safePeriod = clampInteger(period, 2, 500, 20);
    const safeDeviations = Number.isFinite(Number(deviations)) ? Math.max(0, Number(deviations)) : 2;
    const middle = calculateSma(values, safePeriod);
    const upper = [];
    const lower = [];

    values.forEach((value, index) => {
      if (middle[index] === null) {
        upper.push(null);
        lower.push(null);
        return;
      }
      const window = values.slice(index - safePeriod + 1, index + 1).map(Number);
      const variance = window.reduce((sum, item) => sum + (item - middle[index]) ** 2, 0) / safePeriod;
      const standardDeviation = Math.sqrt(variance);
      upper.push(middle[index] + standardDeviation * safeDeviations);
      lower.push(middle[index] - standardDeviation * safeDeviations);
    });

    return { middle, upper, lower };
  }

  function calculateRsi(values = [], period = 14) {
    const safePeriod = clampInteger(period, 2, 200, 14);
    const result = values.map(() => null);
    if (values.length <= safePeriod) return result;
    let gains = 0;
    let losses = 0;

    for (let index = 1; index <= safePeriod; index += 1) {
      const change = Number(values[index]) - Number(values[index - 1]);
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let averageGain = gains / safePeriod;
    let averageLoss = losses / safePeriod;
    const valueFromAverages = () => averageGain === 0 && averageLoss === 0 ? 50 : averageLoss === 0 ? 100 : 100 - (100 / (1 + averageGain / averageLoss));
    result[safePeriod] = valueFromAverages();

    for (let index = safePeriod + 1; index < values.length; index += 1) {
      const change = Number(values[index]) - Number(values[index - 1]);
      const gain = Math.max(0, change);
      const loss = Math.max(0, -change);
      averageGain = (averageGain * (safePeriod - 1) + gain) / safePeriod;
      averageLoss = (averageLoss * (safePeriod - 1) + loss) / safePeriod;
      result[index] = valueFromAverages();
    }
    return result;
  }

  function detectCandlePatterns(candles = []) {
    const patterns = [];
    candles.forEach((candle, index) => {
      const range = Number(candle.high) - Number(candle.low);
      if (!(range > 0)) return;
      const body = Math.abs(Number(candle.close) - Number(candle.open));
      const upperWick = Number(candle.high) - Math.max(Number(candle.open), Number(candle.close));
      const lowerWick = Math.min(Number(candle.open), Number(candle.close)) - Number(candle.low);

      if (body <= range * 0.1) patterns.push({ index, type: "DOJI", label: "Doji", bias: "NEUTRAL" });
      if (lowerWick >= body * 2 && upperWick <= Math.max(body * 0.75, range * 0.04)) patterns.push({ index, type: "HAMMER", label: "Martelo", bias: "BULLISH" });
      if (upperWick >= body * 2 && lowerWick <= Math.max(body * 0.75, range * 0.04)) patterns.push({ index, type: "SHOOTING_STAR", label: "Estrela cadente", bias: "BEARISH" });

      if (!index) return;
      const previous = candles[index - 1];
      const bullishEngulfing = previous.close < previous.open && candle.close > candle.open && candle.open <= previous.close && candle.close >= previous.open;
      const bearishEngulfing = previous.close > previous.open && candle.close < candle.open && candle.open >= previous.close && candle.close <= previous.open;
      if (bullishEngulfing) patterns.push({ index, type: "BULLISH_ENGULFING", label: "Engolfo de alta", bias: "BULLISH" });
      if (bearishEngulfing) patterns.push({ index, type: "BEARISH_ENGULFING", label: "Engolfo de baixa", bias: "BEARISH" });
    });
    return patterns;
  }

  function detectFlagPattern(candles = [], lookback = 18) {
    const safeLookback = clampInteger(lookback, 10, 80, 18);
    if (candles.length < safeLookback) return null;
    const sample = candles.slice(-safeLookback);
    const poleLength = Math.max(5, Math.floor(safeLookback * 0.45));
    const pole = sample.slice(0, poleLength);
    const flag = sample.slice(poleLength);
    const poleMove = Number(pole.at(-1).close) - Number(pole[0].open);
    const averageRange = pole.reduce((sum, candle) => sum + (Number(candle.high) - Number(candle.low)), 0) / pole.length;
    if (!averageRange || Math.abs(poleMove) < averageRange * 3) return null;
    const flagMove = Number(flag.at(-1).close) - Number(flag[0].close);
    const flagHigh = Math.max(...flag.map(candle => Number(candle.high)));
    const flagLow = Math.min(...flag.map(candle => Number(candle.low)));
    if (flagHigh - flagLow > Math.abs(poleMove) * 0.7) return null;
    if (poleMove > 0 && flagMove < 0) return { type: "BULL_FLAG", label: "Possível bandeira de alta", bias: "BULLISH", startIndex: candles.length - safeLookback };
    if (poleMove < 0 && flagMove > 0) return { type: "BEAR_FLAG", label: "Possível bandeira de baixa", bias: "BEARISH", startIndex: candles.length - safeLookback };
    return null;
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
    timeframeDuration,
    generateDemoCandles,
    calculateEma,
    calculateSma,
    calculateBollinger,
    calculateRsi,
    detectCandlePatterns,
    detectFlagPattern
  };
});
