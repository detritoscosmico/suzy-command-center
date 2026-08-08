(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyMicrostructureCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const VOLATILITY_FACTORS = Object.freeze({ LOW: 0.75, NORMAL: 1, HIGH: 1.8, EXTREME: 3 });
  const LIQUIDITY_FACTORS = Object.freeze({ DEEP: 0.75, NORMAL: 1, THIN: 1.8 });
  const DEFAULT_THRESHOLDS = Object.freeze({ maxSlippagePoints: 2, minimumFillPct: 80, maxGapPoints: 3 });

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum, fallback = minimum) {
    const number = finite(value, fallback);
    return Math.min(maximum, Math.max(minimum, number));
  }

  function round(value, digits = 8) {
    const factor = 10 ** digits;
    return Math.round((finite(value) + Number.EPSILON) * factor) / factor;
  }

  function enumValue(value, allowed, fallback) {
    const normalized = String(value ?? "").toUpperCase();
    return allowed.includes(normalized) ? normalized : fallback;
  }

  function normalizeMarket(candidate = {}) {
    return {
      mid: clamp(candidate.mid, 0.00000001, 1_000_000_000, 100),
      pointSize: clamp(candidate.pointSize, 0.00000001, 1_000_000, 0.01),
      baseSpreadPoints: clamp(candidate.baseSpreadPoints, 0, 100_000, 1),
      baseSlippagePoints: clamp(candidate.baseSlippagePoints, 0, 100_000, 0.5),
      volatility: enumValue(candidate.volatility, Object.keys(VOLATILITY_FACTORS), "NORMAL"),
      liquidity: enumValue(candidate.liquidity, Object.keys(LIQUIDITY_FACTORS), "NORMAL"),
      availableQuantity: clamp(candidate.availableQuantity, 0, 1_000_000_000, 100),
      valuePerPoint: clamp(candidate.valuePerPoint, 0.000001, 1_000_000, 1),
      commissionPerOrder: clamp(candidate.commissionPerOrder, 0, 1_000_000, 0)
    };
  }

  function buildMarketConditions(candidate = {}) {
    const market = normalizeMarket(candidate);
    const volatilityFactor = VOLATILITY_FACTORS[market.volatility];
    const liquidityFactor = LIQUIDITY_FACTORS[market.liquidity];
    const spreadPoints = market.baseSpreadPoints * volatilityFactor * liquidityFactor;
    const halfSpreadPrice = spreadPoints * market.pointSize / 2;
    const baselineSlippagePoints = market.baseSlippagePoints * volatilityFactor * liquidityFactor;
    return {
      ...market,
      volatilityFactor,
      liquidityFactor,
      spreadPoints: round(spreadPoints, 4),
      baselineSlippagePoints: round(baselineSlippagePoints, 4),
      bid: round(market.mid - halfSpreadPrice),
      ask: round(market.mid + halfSpreadPrice)
    };
  }

  function normalizeBar(raw = {}) {
    const open = finite(raw.open, Number.NaN);
    const high = finite(raw.high, Number.NaN);
    const low = finite(raw.low, Number.NaN);
    const close = finite(raw.close, Number.NaN);
    if (![open, high, low, close].every(Number.isFinite)) return null;
    if ([open, high, low, close].some(value => value <= 0)) return null;
    if (high < Math.max(open, close) || low > Math.min(open, close) || low > high) return null;
    return { open, high, low, close, time: finite(raw.time, Date.now()) };
  }

  function normalizeOrder(candidate = {}) {
    return {
      type: enumValue(candidate.type, ["MARKET", "LIMIT", "STOP"], "MARKET"),
      direction: enumValue(candidate.direction, ["BUY", "SELL"], "BUY"),
      quantity: clamp(candidate.quantity, 0, 1_000_000_000, 1),
      trigger: finite(candidate.trigger, Number.NaN),
      note: String(candidate.note ?? "").trim().slice(0, 180)
    };
  }

  function validateOrder(order, conditions) {
    if (!order.quantity) return "Quantidade precisa ser maior que zero.";
    if (order.type !== "MARKET" && (!Number.isFinite(order.trigger) || order.trigger <= 0)) return "Preço de disparo inválido.";
    if (order.type === "LIMIT" && order.direction === "BUY" && order.trigger >= conditions.mid) return "Limite de compra precisa ficar abaixo do preço médio.";
    if (order.type === "LIMIT" && order.direction === "SELL" && order.trigger <= conditions.mid) return "Limite de venda precisa ficar acima do preço médio.";
    if (order.type === "STOP" && order.direction === "BUY" && order.trigger <= conditions.mid) return "Stop de compra precisa ficar acima do preço médio.";
    if (order.type === "STOP" && order.direction === "SELL" && order.trigger >= conditions.mid) return "Stop de venda precisa ficar abaixo do preço médio.";
    return "";
  }

  function orderTouch(order, bar) {
    if (order.type === "MARKET") return true;
    if (!bar) return false;
    if (order.type === "LIMIT") return order.direction === "BUY" ? bar.low <= order.trigger : bar.high >= order.trigger;
    return order.direction === "BUY" ? bar.high >= order.trigger : bar.low <= order.trigger;
  }

  function executionBase(order, conditions, bar) {
    if (order.type === "MARKET") return conditions.mid;
    if (order.type === "LIMIT") {
      if (order.direction === "BUY") return Math.min(order.trigger, bar.open);
      return Math.max(order.trigger, bar.open);
    }
    if (order.direction === "BUY") return Math.max(order.trigger, bar.open);
    return Math.min(order.trigger, bar.open);
  }

  function simulateExecution(candidate = {}) {
    const conditions = buildMarketConditions(candidate.market);
    const order = normalizeOrder(candidate.order);
    const bar = normalizeBar(candidate.bar);
    const error = validateOrder(order, conditions);
    if (error) return { valid: false, error, status: "REJECTED", conditions, order };
    if (order.type !== "MARKET" && !bar) return { valid: false, error: "Candle de execução inválido.", status: "REJECTED", conditions, order };
    if (!orderTouch(order, bar)) {
      return { valid: true, error: "", status: "NOT_TRIGGERED", conditions, order, filledQuantity: 0, fillPct: 0 };
    }
    if (!conditions.availableQuantity) {
      return { valid: true, error: "", status: "NO_LIQUIDITY", conditions, order, filledQuantity: 0, fillPct: 0 };
    }

    const directionFactor = order.direction === "BUY" ? 1 : -1;
    const filledQuantity = Math.min(order.quantity, conditions.availableQuantity);
    const fillPct = (filledQuantity / order.quantity) * 100;
    const participation = Math.min(1, order.quantity / conditions.availableQuantity);
    const impactFactor = 1 + participation * 0.75;
    const slippagePoints = order.type === "LIMIT" ? 0 : conditions.baselineSlippagePoints * impactFactor;
    const spreadComponentPoints = order.type === "LIMIT" ? 0 : conditions.spreadPoints / 2;
    const base = executionBase(order, conditions, bar);
    const gapPoints = order.type === "STOP"
      ? Math.max(0, directionFactor * (base - order.trigger) / conditions.pointSize)
      : 0;
    const adversePrice = (spreadComponentPoints + slippagePoints) * conditions.pointSize * directionFactor;
    let fillPrice = order.type === "LIMIT" ? base : base + adversePrice;
    if (order.type === "LIMIT") {
      fillPrice = order.direction === "BUY" ? Math.min(fillPrice, order.trigger) : Math.max(fillPrice, order.trigger);
    }

    const benchmarkPrice = order.type === "MARKET" ? conditions.mid : order.trigger;
    const adverseDeviationPoints = directionFactor * (fillPrice - benchmarkPrice) / conditions.pointSize;
    const arrivalDeviationPoints = directionFactor * (fillPrice - conditions.mid) / conditions.pointSize;
    const commission = conditions.commissionPerOrder;
    const executionCostMoney = Math.max(0, adverseDeviationPoints) * conditions.valuePerPoint * filledQuantity + commission;
    const status = filledQuantity < order.quantity ? "PARTIAL" : "FILLED";

    return {
      valid: true,
      error: "",
      status,
      conditions,
      order,
      bar,
      requestedQuantity: round(order.quantity, 6),
      filledQuantity: round(filledQuantity, 6),
      unfilledQuantity: round(order.quantity - filledQuantity, 6),
      fillPct: round(fillPct, 2),
      participationPct: round(participation * 100, 2),
      benchmarkPrice: round(benchmarkPrice),
      fillPrice: round(fillPrice),
      spreadComponentPoints: round(spreadComponentPoints, 4),
      slippageComponentPoints: round(slippagePoints, 4),
      gapComponentPoints: round(gapPoints, 4),
      adverseDeviationPoints: round(adverseDeviationPoints, 4),
      arrivalDeviationPoints: round(arrivalDeviationPoints, 4),
      executionCostMoney: round(executionCostMoney, 2),
      commission: round(commission, 2),
      limitProtected: order.type !== "LIMIT" || adverseDeviationPoints <= 0.000001
    };
  }

  function normalizeThresholds(candidate = {}) {
    return {
      maxSlippagePoints: clamp(candidate.maxSlippagePoints, 0, 100_000, DEFAULT_THRESHOLDS.maxSlippagePoints),
      minimumFillPct: clamp(candidate.minimumFillPct, 0, 100, DEFAULT_THRESHOLDS.minimumFillPct),
      maxGapPoints: clamp(candidate.maxGapPoints, 0, 100_000, DEFAULT_THRESHOLDS.maxGapPoints)
    };
  }

  function evaluateExecutionQuality(execution = {}, candidateThresholds = {}) {
    const thresholds = normalizeThresholds(candidateThresholds);
    if (!execution.valid || !["FILLED", "PARTIAL"].includes(execution.status)) {
      return { passed: false, score: 0, thresholds, checks: [], status: "SEM EXECUÇÃO AVALIÁVEL" };
    }
    const checks = [
      {
        id: "slippage",
        label: "Slippage dentro do limite",
        current: finite(execution.slippageComponentPoints),
        limit: thresholds.maxSlippagePoints,
        passed: finite(execution.slippageComponentPoints) <= thresholds.maxSlippagePoints
      },
      {
        id: "fill",
        label: "Percentual preenchido mínimo",
        current: finite(execution.fillPct),
        limit: thresholds.minimumFillPct,
        passed: finite(execution.fillPct) >= thresholds.minimumFillPct,
        minimum: true
      },
      {
        id: "gap",
        label: "Gap adverso dentro do limite",
        current: finite(execution.gapComponentPoints),
        limit: thresholds.maxGapPoints,
        passed: finite(execution.gapComponentPoints) <= thresholds.maxGapPoints
      },
      {
        id: "limit",
        label: "Proteção da ordem limite respeitada",
        current: execution.limitProtected ? 1 : 0,
        limit: 1,
        passed: execution.limitProtected === true,
        boolean: true
      }
    ];
    const passedCount = checks.filter(check => check.passed).length;
    const passed = passedCount === checks.length;
    return {
      passed,
      score: Math.round((passedCount / checks.length) * 100),
      thresholds,
      checks,
      status: passed ? "PROCESSO DENTRO DOS LIMITES" : "REVISAR EXECUÇÃO"
    };
  }

  function summarizeExecutions(executions = []) {
    const valid = executions.filter(item => item && ["FILLED", "PARTIAL"].includes(item.execution?.status));
    if (!valid.length) return { total: 0, averageFillPct: 0, averageAdversePoints: 0, totalExecutionCost: 0, passed: 0 };
    const average = key => valid.reduce((sum, item) => sum + finite(item.execution[key]), 0) / valid.length;
    return {
      total: valid.length,
      averageFillPct: round(average("fillPct"), 2),
      averageAdversePoints: round(average("adverseDeviationPoints"), 4),
      totalExecutionCost: round(valid.reduce((sum, item) => sum + finite(item.execution.executionCostMoney), 0), 2),
      passed: valid.filter(item => item.quality?.passed).length
    };
  }

  return {
    VOLATILITY_FACTORS,
    LIQUIDITY_FACTORS,
    DEFAULT_THRESHOLDS,
    normalizeMarket,
    buildMarketConditions,
    normalizeBar,
    normalizeOrder,
    simulateExecution,
    evaluateExecutionQuality,
    summarizeExecutions
  };
});
