(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzySimulatorCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clampNumber(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function round(value, decimals = 8) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function normalizeSettings(input = {}) {
    return {
      pointSize: clampNumber(input.pointSize, 0.00000001, 1_000_000, 0.0001),
      spreadPoints: clampNumber(input.spreadPoints, 0, 100_000, 1),
      slippagePoints: clampNumber(input.slippagePoints, 0, 100_000, 0),
      commissionPerSide: clampNumber(input.commissionPerSide, 0, 1_000_000, 0),
      valuePerPoint: clampNumber(input.valuePerPoint, 0.000001, 1_000_000, 1),
      stopPoints: clampNumber(input.stopPoints, 1, 1_000_000, 20),
      targetPoints: clampNumber(input.targetPoints, 1, 1_000_000, 40)
    };
  }

  function normalizeBar(bar = {}) {
    const open = Number(bar.open);
    const high = Number(bar.high);
    const low = Number(bar.low);
    const close = Number(bar.close);
    const time = Number(bar.time) || Date.now();

    if (![open, high, low, close].every(Number.isFinite)) return null;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return null;
    if (high < Math.max(open, close) || low > Math.min(open, close) || low > high) return null;

    return { time, open, high, low, close };
  }

  function buildQuote(mid, settings = {}) {
    const normalized = normalizeSettings(settings);
    const safeMid = Number(mid);
    if (!Number.isFinite(safeMid) || safeMid <= 0) return null;

    const halfSpread = normalized.pointSize * normalized.spreadPoints / 2;
    return {
      mid: safeMid,
      bid: round(safeMid - halfSpread),
      ask: round(safeMid + halfSpread),
      spreadValue: round(normalized.spreadPoints * normalized.valuePerPoint)
    };
  }

  function validateOrder(input = {}) {
    const type = String(input.type ?? "MARKET").toUpperCase();
    const direction = String(input.direction ?? "BUY").toUpperCase();
    const mid = Number(input.mid);
    const trigger = Number(input.trigger);

    if (!["MARKET", "LIMIT", "STOP"].includes(type)) return "Tipo de ordem inválido.";
    if (!["BUY", "SELL"].includes(direction)) return "Direção inválida.";
    if (!Number.isFinite(mid) || mid <= 0) return "Preço médio inválido.";
    if (type !== "MARKET" && (!Number.isFinite(trigger) || trigger <= 0)) return "Preço de disparo inválido.";

    if (type === "LIMIT") {
      if (direction === "BUY" && trigger >= mid) return "Uma ordem limite de compra deve ficar abaixo do preço médio.";
      if (direction === "SELL" && trigger <= mid) return "Uma ordem limite de venda deve ficar acima do preço médio.";
    }

    if (type === "STOP") {
      if (direction === "BUY" && trigger <= mid) return "Uma ordem stop de compra deve ficar acima do preço médio.";
      if (direction === "SELL" && trigger >= mid) return "Uma ordem stop de venda deve ficar abaixo do preço médio.";
    }

    return "";
  }

  function createPositionFromFill(order, fillPrice, settings = {}, metadata = {}) {
    const normalized = normalizeSettings(settings);
    const directionFactor = order.direction === "BUY" ? 1 : -1;
    const stop = fillPrice - directionFactor * normalized.stopPoints * normalized.pointSize;
    const target = fillPrice + directionFactor * normalized.targetPoints * normalized.pointSize;

    return {
      id: String(order.id ?? `${Date.now()}`),
      orderType: order.type,
      direction: order.direction,
      entry: round(fillPrice),
      stop: round(stop),
      target: round(target),
      openedAt: Number(metadata.time) || Date.now(),
      entryReason: String(metadata.reason ?? "").slice(0, 180),
      entryCommission: normalized.commissionPerSide,
      settings: normalized,
      status: "OPEN"
    };
  }

  function submitOrder(input = {}, settings = {}) {
    const error = validateOrder(input);
    if (error) return { error, pendingOrder: null, position: null };

    const normalized = normalizeSettings(settings);
    const type = String(input.type).toUpperCase();
    const direction = String(input.direction).toUpperCase();
    const order = {
      id: String(input.id ?? `${Date.now()}`),
      type,
      direction,
      trigger: type === "MARKET" ? null : Number(input.trigger),
      createdAt: Number(input.createdAt) || Date.now(),
      note: String(input.note ?? "").trim().slice(0, 180)
    };

    if (type !== "MARKET") {
      return { error: "", pendingOrder: order, position: null };
    }

    const quote = buildQuote(input.mid, normalized);
    const slippage = normalized.slippagePoints * normalized.pointSize;
    const fill = direction === "BUY"
      ? quote.ask + slippage
      : quote.bid - slippage;

    return {
      error: "",
      pendingOrder: null,
      position: createPositionFromFill(order, fill, normalized, {
        time: order.createdAt,
        reason: "Ordem a mercado executada no bid/ask com slippage adverso."
      })
    };
  }

  function processPendingOrder(order, rawBar, settings = {}) {
    const bar = normalizeBar(rawBar);
    if (!order || !bar) return { filled: false, order, position: null, error: "Ordem ou candle inválido." };

    const normalized = normalizeSettings(settings);
    const direction = order.direction;
    const trigger = Number(order.trigger);
    let touched = false;
    let fill = null;
    let reason = "";

    if (order.type === "LIMIT") {
      touched = direction === "BUY" ? bar.low <= trigger : bar.high >= trigger;
      if (touched) {
        fill = direction === "BUY"
          ? Math.min(trigger, bar.open)
          : Math.max(trigger, bar.open);
        reason = "Ordem limite executada sem preço pior que o limite definido.";
      }
    } else if (order.type === "STOP") {
      touched = direction === "BUY" ? bar.high >= trigger : bar.low <= trigger;
      if (touched) {
        const baseFill = direction === "BUY"
          ? Math.max(trigger, bar.open)
          : Math.min(trigger, bar.open);
        const slippage = normalized.slippagePoints * normalized.pointSize;
        fill = direction === "BUY" ? baseFill + slippage : baseFill - slippage;
        reason = "Ordem stop disparada com slippage adverso.";
      }
    }

    if (!touched) return { filled: false, order, position: null, error: "" };

    return {
      filled: true,
      order: null,
      position: createPositionFromFill(order, fill, normalized, { time: bar.time, reason }),
      error: ""
    };
  }

  function finalizePosition(position, exitPrice, exitTime, reason, settings = {}) {
    const normalized = normalizeSettings({ ...position.settings, ...settings });
    const directionFactor = position.direction === "BUY" ? 1 : -1;
    const grossPoints = ((exitPrice - position.entry) / normalized.pointSize) * directionFactor;
    const grossMoney = grossPoints * normalized.valuePerPoint;
    const costs = Number(position.entryCommission || 0) + normalized.commissionPerSide;
    const netMoney = grossMoney - costs;
    const riskMoney = normalized.stopPoints * normalized.valuePerPoint + costs;
    const netR = riskMoney > 0 ? netMoney / riskMoney : 0;

    return {
      ...position,
      status: "CLOSED",
      exit: round(exitPrice),
      exitedAt: Number(exitTime) || Date.now(),
      grossPoints: round(grossPoints, 4),
      grossMoney: round(grossMoney, 2),
      costs: round(costs, 2),
      netMoney: round(netMoney, 2),
      netR: round(netR, 2),
      result: netMoney > 0.005 ? "WIN" : netMoney < -0.005 ? "LOSS" : "BREAKEVEN",
      exitReason: reason
    };
  }

  function evaluatePositionOnBar(position, rawBar, settings = {}) {
    const bar = normalizeBar(rawBar);
    if (!position || position.status !== "OPEN" || !bar) {
      return { closed: false, position, trade: null, error: "Posição ou candle inválido." };
    }

    const normalized = normalizeSettings({ ...position.settings, ...settings });
    const slippage = normalized.slippagePoints * normalized.pointSize;
    let hitStop = false;
    let hitTarget = false;

    if (position.direction === "BUY") {
      hitStop = bar.low <= position.stop;
      hitTarget = bar.high >= position.target;
    } else {
      hitStop = bar.high >= position.stop;
      hitTarget = bar.low <= position.target;
    }

    if (!hitStop && !hitTarget) return { closed: false, position, trade: null, error: "" };

    if (hitStop) {
      const stopExit = position.direction === "BUY"
        ? position.stop - slippage
        : position.stop + slippage;
      const reason = hitTarget
        ? "Stop e alvo tocados no mesmo candle; aplicado critério conservador com slippage."
        : "Stop atingido com slippage adverso.";
      return {
        closed: true,
        position: null,
        trade: finalizePosition(position, stopExit, bar.time, reason, normalized),
        error: ""
      };
    }

    return {
      closed: true,
      position: null,
      trade: finalizePosition(position, position.target, bar.time, "Alvo atingido.", normalized),
      error: ""
    };
  }

  function closePositionAtMarket(position, mid, settings = {}, time = Date.now()) {
    if (!position || position.status !== "OPEN") return { error: "Não existe posição aberta.", trade: null };

    const normalized = normalizeSettings({ ...position.settings, ...settings });
    const quote = buildQuote(mid, normalized);
    if (!quote) return { error: "Preço médio inválido.", trade: null };

    const slippage = normalized.slippagePoints * normalized.pointSize;
    const exit = position.direction === "BUY"
      ? quote.bid - slippage
      : quote.ask + slippage;

    return {
      error: "",
      trade: finalizePosition(
        position,
        exit,
        time,
        "Encerramento a mercado no bid/ask com slippage adverso.",
        normalized
      )
    };
  }

  function summarizeTrades(trades = []) {
    const closed = trades.filter(trade => trade && trade.status === "CLOSED");
    const wins = closed.filter(trade => trade.result === "WIN").length;
    const losses = closed.filter(trade => trade.result === "LOSS").length;
    const gross = closed.reduce((sum, trade) => sum + Number(trade.grossMoney || 0), 0);
    const costs = closed.reduce((sum, trade) => sum + Number(trade.costs || 0), 0);
    const net = closed.reduce((sum, trade) => sum + Number(trade.netMoney || 0), 0);

    return {
      total: closed.length,
      wins,
      losses,
      winrate: closed.length ? round((wins / closed.length) * 100, 2) : 0,
      gross: round(gross, 2),
      costs: round(costs, 2),
      net: round(net, 2),
      averageNet: closed.length ? round(net / closed.length, 2) : 0
    };
  }

  function generateArtificialBar(mid, settings = {}, random = Math.random) {
    const normalized = normalizeSettings(settings);
    const safeMid = Number(mid);
    if (!Number.isFinite(safeMid) || safeMid <= 0) return null;

    const volatilityPoints = clampNumber(settings.volatilityPoints, 2, 100_000, 30);
    const range = normalized.pointSize * volatilityPoints;
    const open = safeMid;
    const close = Math.max(normalized.pointSize, open + (random() - 0.5) * range);
    const high = Math.max(open, close) + random() * range * 0.55;
    const low = Math.max(normalized.pointSize, Math.min(open, close) - random() * range * 0.55);

    return {
      time: Date.now(),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close)
    };
  }

  return {
    clampNumber,
    normalizeSettings,
    normalizeBar,
    buildQuote,
    validateOrder,
    submitOrder,
    processPendingOrder,
    evaluatePositionOnBar,
    closePositionAtMarket,
    summarizeTrades,
    generateArtificialBar
  };
});
