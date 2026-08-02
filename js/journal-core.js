(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyJournalCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clampNumber(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function cleanText(value, maximum = 120) {
    return String(value ?? "").trim().slice(0, maximum);
  }

  function normalizeDateTime(value) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }

  function normalizeJournalEntry(entry = {}) {
    const timestamp = normalizeDateTime(entry.timestamp);
    const asset = cleanText(entry.asset, 30).toUpperCase();
    const setup = cleanText(entry.setup, 60);
    const rMultiple = Number(entry.rMultiple);

    if (!timestamp || !asset || !setup || !Number.isFinite(rMultiple)) return null;

    const direction = String(entry.direction ?? "").toUpperCase();
    const result = rMultiple > 0 ? "WIN" : rMultiple < 0 ? "LOSS" : "BREAKEVEN";

    return {
      id: cleanText(entry.id, 80) || `${timestamp}-${asset}-${setup}`,
      timestamp,
      asset,
      market: cleanText(entry.market, 30) || "Outros",
      session: cleanText(entry.session, 30) || "Não informada",
      timeframe: cleanText(entry.timeframe, 15).toUpperCase() || "N/A",
      direction: ["LONG", "SHORT", "CALL", "PUT"].includes(direction) ? direction : "N/A",
      setup,
      rMultiple: Number(rMultiple.toFixed(2)),
      result,
      followedPlan: Boolean(entry.followedPlan),
      quality: Math.round(clampNumber(entry.quality, 1, 5, 3)),
      emotionBefore: cleanText(entry.emotionBefore, 40) || "Não informada",
      emotionAfter: cleanText(entry.emotionAfter, 40) || "Não informada",
      errorType: cleanText(entry.errorType, 50) || "Nenhum",
      context: cleanText(entry.context, 600),
      lesson: cleanText(entry.lesson, 600),
      createdAt: normalizeDateTime(entry.createdAt) || new Date().toISOString()
    };
  }

  function sortEntries(entries = []) {
    return entries
      .map(normalizeJournalEntry)
      .filter(Boolean)
      .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
  }

  function calculateMaxDrawdown(entries = []) {
    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;

    for (const entry of sortEntries(entries)) {
      equity += entry.rMultiple;
      peak = Math.max(peak, equity);
      maxDrawdown = Math.max(maxDrawdown, peak - equity);
    }

    return Number(maxDrawdown.toFixed(2));
  }

  function summarizeJournal(entries = []) {
    const normalized = sortEntries(entries);
    const wins = normalized.filter(entry => entry.rMultiple > 0);
    const losses = normalized.filter(entry => entry.rMultiple < 0);
    const breakeven = normalized.filter(entry => entry.rMultiple === 0);
    const totalR = normalized.reduce((sum, entry) => sum + entry.rMultiple, 0);
    const grossProfit = wins.reduce((sum, entry) => sum + entry.rMultiple, 0);
    const grossLoss = Math.abs(losses.reduce((sum, entry) => sum + entry.rMultiple, 0));
    const adherenceCount = normalized.filter(entry => entry.followedPlan).length;
    const qualityTotal = normalized.reduce((sum, entry) => sum + entry.quality, 0);

    return {
      total: normalized.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      winrate: normalized.length ? Number(((wins.length / normalized.length) * 100).toFixed(2)) : 0,
      totalR: Number(totalR.toFixed(2)),
      expectancy: normalized.length ? Number((totalR / normalized.length).toFixed(2)) : 0,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      profitFactor: grossLoss ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? null : 0,
      maxDrawdown: calculateMaxDrawdown(normalized),
      adherence: normalized.length ? Number(((adherenceCount / normalized.length) * 100).toFixed(2)) : 0,
      averageQuality: normalized.length ? Number((qualityTotal / normalized.length).toFixed(2)) : 0
    };
  }

  function groupJournal(entries = [], field = "setup") {
    const groups = new Map();

    for (const entry of sortEntries(entries)) {
      const key = cleanText(entry[field], 80) || "Não informado";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }

    return [...groups.entries()]
      .map(([name, rows]) => ({ name, ...summarizeJournal(rows) }))
      .sort((left, right) => right.total - left.total || right.totalR - left.totalR || left.name.localeCompare(right.name));
  }

  function filterJournal(entries = [], filters = {}) {
    const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
    const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null;
    const asset = cleanText(filters.asset, 30).toUpperCase();
    const setup = cleanText(filters.setup, 60).toLowerCase();
    const session = cleanText(filters.session, 30).toLowerCase();
    const result = String(filters.result ?? "").toUpperCase();

    return sortEntries(entries).filter(entry => {
      const timestamp = new Date(entry.timestamp);
      if (from && timestamp < from) return false;
      if (to && timestamp > to) return false;
      if (asset && entry.asset !== asset) return false;
      if (setup && entry.setup.toLowerCase() !== setup) return false;
      if (session && entry.session.toLowerCase() !== session) return false;
      if (result && entry.result !== result) return false;
      return true;
    });
  }

  function equityCurve(entries = []) {
    let equity = 0;
    return sortEntries(entries).map((entry, index) => {
      equity += entry.rMultiple;
      return {
        index: index + 1,
        timestamp: entry.timestamp,
        equity: Number(equity.toFixed(2)),
        rMultiple: entry.rMultiple
      };
    });
  }

  function topProcessErrors(entries = [], limit = 5) {
    const counts = new Map();
    for (const entry of sortEntries(entries)) {
      if (entry.errorType === "Nenhum") continue;
      counts.set(entry.errorType, (counts.get(entry.errorType) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name))
      .slice(0, Math.max(1, Number(limit) || 5));
  }

  return {
    normalizeJournalEntry,
    sortEntries,
    calculateMaxDrawdown,
    summarizeJournal,
    groupJournal,
    filterJournal,
    equityCurve,
    topProcessErrors
  };
});
