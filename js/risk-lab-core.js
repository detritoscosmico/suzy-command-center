(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyRiskLabCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_LIMITS = Object.freeze({
    maxTradeRiskPct: 1,
    maxOpenRiskPct: 3,
    maxGroupRiskPct: 2,
    maxSessionLossPct: 2,
    maxWeeklyLossPct: 5
  });

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function positive(value, fallback = 0) {
    return Math.max(0, finite(value, fallback));
  }

  function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((finite(value) + Number.EPSILON) * factor) / factor;
  }

  function floorToStep(value, step) {
    const safeStep = positive(step);
    if (!safeStep) return 0;
    const units = Math.floor((positive(value) + Number.EPSILON) / safeStep);
    return round(units * safeStep, 8);
  }

  function calculatePositionSize(candidate = {}) {
    const capital = positive(candidate.capital);
    const riskMode = candidate.riskMode === "FIXED" ? "FIXED" : "PERCENT";
    const riskPercent = positive(candidate.riskPercent);
    const fixedRisk = positive(candidate.fixedRisk);
    const entry = positive(candidate.entry);
    const stop = positive(candidate.stop);
    const unitMultiplier = positive(candidate.unitMultiplier, 1) || 1;
    const quantityStep = positive(candidate.quantityStep, 1) || 1;
    const errors = [];

    if (!capital) errors.push("Capital precisa ser maior que zero.");
    if (!entry) errors.push("Preço de entrada precisa ser maior que zero.");
    if (!stop) errors.push("Preço de stop precisa ser maior que zero.");
    if (entry === stop && entry > 0) errors.push("Entrada e stop não podem ter o mesmo preço.");

    const requestedRisk = riskMode === "FIXED"
      ? fixedRisk
      : capital * (riskPercent / 100);
    if (!requestedRisk) errors.push("Defina um risco planejado maior que zero.");

    if (errors.length) {
      return {
        valid: false,
        errors,
        warnings: [],
        capital,
        riskMode,
        requestedRisk: round(requestedRisk),
        quantity: 0,
        actualRisk: 0,
        actualRiskPct: 0,
        notional: 0,
        stopDistance: round(Math.abs(entry - stop), 8),
        stopDistancePct: entry ? round((Math.abs(entry - stop) / entry) * 100, 4) : 0
      };
    }

    const stopDistance = Math.abs(entry - stop);
    const riskPerUnit = stopDistance * unitMultiplier;
    const rawQuantity = requestedRisk / riskPerUnit;
    const quantity = floorToStep(rawQuantity, quantityStep);
    const actualRisk = quantity * riskPerUnit;
    const actualRiskPct = capital ? (actualRisk / capital) * 100 : 0;
    const notional = quantity * entry * unitMultiplier;
    const warnings = [];

    if (!quantity) warnings.push("O passo mínimo de quantidade é maior que o tamanho calculado.");
    if (actualRiskPct > 2) warnings.push("Risco por operação acima de 2% do capital: cenário de alta exposição para este laboratório.");
    if (requestedRisk > capital) warnings.push("O risco solicitado supera o capital informado.");
    if (capital && notional / capital > 5) warnings.push("Exposição nominal acima de 5x o capital; confirme multiplicador e características do instrumento.");

    return {
      valid: true,
      errors: [],
      warnings,
      capital: round(capital),
      riskMode,
      requestedRisk: round(requestedRisk),
      requestedRiskPct: round((requestedRisk / capital) * 100, 4),
      entry: round(entry, 8),
      stop: round(stop, 8),
      stopDistance: round(stopDistance, 8),
      stopDistancePct: round((stopDistance / entry) * 100, 4),
      unitMultiplier: round(unitMultiplier, 8),
      quantityStep: round(quantityStep, 8),
      rawQuantity: round(rawQuantity, 8),
      quantity,
      actualRisk: round(actualRisk),
      actualRiskPct: round(actualRiskPct, 4),
      notional: round(notional),
      notionalToCapital: round(notional / capital, 2)
    };
  }

  function normalizePositions(positions) {
    if (!Array.isArray(positions)) return [];
    return positions
      .map((position, index) => ({
        id: String(position?.id || `position-${index + 1}`),
        asset: String(position?.asset || "Ativo").trim().slice(0, 30) || "Ativo",
        group: String(position?.group || "Sem grupo").trim().slice(0, 30) || "Sem grupo",
        side: position?.side === "SHORT" ? "SHORT" : "LONG",
        plannedRisk: positive(position?.plannedRisk)
      }))
      .filter(position => position.plannedRisk > 0);
  }

  function evaluatePortfolioExposure(candidate = {}) {
    const capital = positive(candidate.capital);
    const maxOpenRiskPct = positive(candidate.maxOpenRiskPct, DEFAULT_LIMITS.maxOpenRiskPct) || DEFAULT_LIMITS.maxOpenRiskPct;
    const maxGroupRiskPct = positive(candidate.maxGroupRiskPct, DEFAULT_LIMITS.maxGroupRiskPct) || DEFAULT_LIMITS.maxGroupRiskPct;
    const positions = normalizePositions(candidate.positions);
    const totalRisk = positions.reduce((sum, position) => sum + position.plannedRisk, 0);
    const totalRiskPct = capital ? (totalRisk / capital) * 100 : 0;
    const groups = new Map();

    positions.forEach(position => {
      const current = groups.get(position.group) || 0;
      groups.set(position.group, current + position.plannedRisk);
    });

    const groupExposure = Array.from(groups.entries())
      .map(([group, risk]) => ({
        group,
        risk: round(risk),
        riskPct: capital ? round((risk / capital) * 100, 4) : 0
      }))
      .sort((a, b) => b.risk - a.risk || a.group.localeCompare(b.group));
    const largestGroup = groupExposure[0] || { group: "—", risk: 0, riskPct: 0 };
    const maxOpenRisk = capital * (maxOpenRiskPct / 100);
    const withinTotalLimit = capital > 0 && totalRiskPct <= maxOpenRiskPct;
    const withinGroupLimit = capital > 0 && largestGroup.riskPct <= maxGroupRiskPct;

    return {
      valid: capital > 0,
      capital: round(capital),
      positions,
      totalRisk: round(totalRisk),
      totalRiskPct: round(totalRiskPct, 4),
      maxOpenRiskPct: round(maxOpenRiskPct, 4),
      maxGroupRiskPct: round(maxGroupRiskPct, 4),
      remainingRisk: round(Math.max(0, maxOpenRisk - totalRisk)),
      largestGroup,
      groups: groupExposure,
      withinTotalLimit,
      withinGroupLimit,
      passed: capital > 0 && withinTotalLimit && withinGroupLimit
    };
  }

  function parseOutcomes(value) {
    const source = Array.isArray(value)
      ? value
      : String(value ?? "").split(/[\s,;]+/);
    return source
      .map(item => finite(item, Number.NaN))
      .filter(Number.isFinite)
      .slice(0, 100);
  }

  function runStressTest(candidate = {}) {
    const initialCapital = positive(candidate.capital);
    const riskPercent = positive(candidate.riskPercent);
    const sessionStopPct = positive(candidate.sessionStopPct, DEFAULT_LIMITS.maxSessionLossPct) || DEFAULT_LIMITS.maxSessionLossPct;
    const outcomes = parseOutcomes(candidate.outcomes);
    const errors = [];
    if (!initialCapital) errors.push("Capital precisa ser maior que zero.");
    if (!riskPercent) errors.push("Risco por operação precisa ser maior que zero.");
    if (!outcomes.length) errors.push("Informe pelo menos um resultado em R.");
    if (errors.length) return { valid: false, errors, outcomes, trades: [] };

    let equity = initialCapital;
    let peak = initialCapital;
    let maxDrawdownPct = 0;
    let halted = false;
    const trades = [];

    for (let index = 0; index < outcomes.length; index += 1) {
      if (halted) break;
      const outcomeR = outcomes[index];
      const riskAmount = equity * (riskPercent / 100);
      const pnl = riskAmount * outcomeR;
      equity = Math.max(0, equity + pnl);
      peak = Math.max(peak, equity);
      const drawdownPct = peak ? ((peak - equity) / peak) * 100 : 100;
      maxDrawdownPct = Math.max(maxDrawdownPct, drawdownPct);
      const sessionLossPct = ((initialCapital - equity) / initialCapital) * 100;
      halted = equity <= 0 || sessionLossPct >= sessionStopPct;
      trades.push({
        index: index + 1,
        outcomeR: round(outcomeR, 4),
        riskAmount: round(riskAmount),
        pnl: round(pnl),
        equity: round(equity),
        drawdownPct: round(drawdownPct, 4),
        sessionLossPct: round(Math.max(0, sessionLossPct), 4),
        halted
      });
    }

    const totalPnl = equity - initialCapital;
    return {
      valid: true,
      errors: [],
      initialCapital: round(initialCapital),
      finalEquity: round(equity),
      totalPnl: round(totalPnl),
      totalPnlPct: round((totalPnl / initialCapital) * 100, 4),
      riskPercent: round(riskPercent, 4),
      sessionStopPct: round(sessionStopPct, 4),
      maxDrawdownPct: round(maxDrawdownPct, 4),
      halted,
      executedTrades: trades.length,
      skippedTrades: outcomes.length - trades.length,
      outcomes,
      trades
    };
  }

  function normalizeLimits(candidate = {}) {
    return {
      maxTradeRiskPct: positive(candidate.maxTradeRiskPct, DEFAULT_LIMITS.maxTradeRiskPct) || DEFAULT_LIMITS.maxTradeRiskPct,
      maxOpenRiskPct: positive(candidate.maxOpenRiskPct, DEFAULT_LIMITS.maxOpenRiskPct) || DEFAULT_LIMITS.maxOpenRiskPct,
      maxGroupRiskPct: positive(candidate.maxGroupRiskPct, DEFAULT_LIMITS.maxGroupRiskPct) || DEFAULT_LIMITS.maxGroupRiskPct,
      maxSessionLossPct: positive(candidate.maxSessionLossPct, DEFAULT_LIMITS.maxSessionLossPct) || DEFAULT_LIMITS.maxSessionLossPct,
      maxWeeklyLossPct: positive(candidate.maxWeeklyLossPct, DEFAULT_LIMITS.maxWeeklyLossPct) || DEFAULT_LIMITS.maxWeeklyLossPct
    };
  }

  function evaluateRiskPolicy(candidate = {}) {
    const limits = normalizeLimits(candidate.limits);
    const metrics = {
      tradeRiskPct: positive(candidate.tradeRiskPct),
      openRiskPct: positive(candidate.openRiskPct),
      groupRiskPct: positive(candidate.groupRiskPct),
      sessionLossPct: positive(candidate.sessionLossPct),
      weeklyLossPct: positive(candidate.weeklyLossPct)
    };
    const checks = [
      { id: "trade", label: "Risco por operação", current: metrics.tradeRiskPct, limit: limits.maxTradeRiskPct },
      { id: "open", label: "Risco aberto agregado", current: metrics.openRiskPct, limit: limits.maxOpenRiskPct },
      { id: "group", label: "Risco no maior grupo correlacionado", current: metrics.groupRiskPct, limit: limits.maxGroupRiskPct },
      { id: "session", label: "Perda acumulada da sessão", current: metrics.sessionLossPct, limit: limits.maxSessionLossPct },
      { id: "week", label: "Perda acumulada da semana", current: metrics.weeklyLossPct, limit: limits.maxWeeklyLossPct }
    ].map(check => ({ ...check, passed: check.current <= check.limit }));

    return {
      limits,
      metrics,
      checks,
      passed: checks.every(check => check.passed),
      violations: checks.filter(check => !check.passed)
    };
  }

  function seededRandom(seed) {
    let state = (Math.floor(finite(seed, 42)) >>> 0) || 42;
    return function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function quantile(sorted, q) {
    if (!sorted.length) return 0;
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
    return sorted[index];
  }

  function simulateRuinRisk(candidate = {}) {
    const capital = positive(candidate.capital);
    const riskPercent = positive(candidate.riskPercent);
    const winRate = positive(candidate.winRate);
    const averageWinR = positive(candidate.averageWinR);
    const averageLossR = positive(candidate.averageLossR);
    const trades = Math.min(1000, Math.max(1, Math.floor(positive(candidate.trades, 100) || 100)));
    const paths = Math.min(10000, Math.max(100, Math.floor(positive(candidate.paths, 2000) || 2000)));
    const ruinDrawdownPct = Math.min(99.9, Math.max(1, positive(candidate.ruinDrawdownPct, 50) || 50));
    const seed = Math.floor(finite(candidate.seed, 42));
    const errors = [];
    if (!capital) errors.push("Capital precisa ser maior que zero.");
    if (!riskPercent) errors.push("Risco por operação precisa ser maior que zero.");
    if (winRate > 100) errors.push("Taxa de acerto precisa estar entre 0% e 100%.");
    if (!averageWinR) errors.push("Ganho médio em R precisa ser maior que zero.");
    if (!averageLossR) errors.push("Perda média em R precisa ser maior que zero.");
    if (errors.length) return { valid: false, errors };

    const random = seededRandom(seed);
    const ruinEquity = capital * (1 - ruinDrawdownPct / 100);
    const finals = [];
    let ruinedPaths = 0;

    for (let path = 0; path < paths; path += 1) {
      let equity = capital;
      let ruined = false;
      for (let trade = 0; trade < trades; trade += 1) {
        const riskAmount = equity * (riskPercent / 100);
        const outcomeR = random() < winRate / 100 ? averageWinR : -averageLossR;
        equity = Math.max(0, equity + riskAmount * outcomeR);
        if (equity <= ruinEquity) {
          ruined = true;
          break;
        }
      }
      if (ruined) ruinedPaths += 1;
      finals.push(equity);
    }

    finals.sort((a, b) => a - b);
    return {
      valid: true,
      errors: [],
      assumptions: {
        capital: round(capital),
        riskPercent: round(riskPercent, 4),
        winRate: round(winRate, 2),
        averageWinR: round(averageWinR, 4),
        averageLossR: round(averageLossR, 4),
        trades,
        paths,
        ruinDrawdownPct: round(ruinDrawdownPct, 2),
        seed
      },
      ruinedPaths,
      ruinProbabilityPct: round((ruinedPaths / paths) * 100, 2),
      medianFinalEquity: round(quantile(finals, 0.5)),
      p10FinalEquity: round(quantile(finals, 0.1)),
      p90FinalEquity: round(quantile(finals, 0.9)),
      disclaimer: "Simulação educacional: assume resultados independentes e parâmetros estacionários. Não prevê risco real nem captura todos os regimes, gaps, liquidez ou custos."
    };
  }

  return {
    DEFAULT_LIMITS,
    calculatePositionSize,
    evaluatePortfolioExposure,
    evaluateRiskPolicy,
    parseOutcomes,
    runStressTest,
    simulateRuinRisk
  };
});
