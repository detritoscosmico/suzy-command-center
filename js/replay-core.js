(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyReplayCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clampNumber(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function normalizeCandle(candle) {
    if (!candle || typeof candle !== "object") return null;

    const time = Number(candle.time);
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);

    if (![time, open, high, low, close].every(Number.isFinite)) return null;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return null;
    if (high < Math.max(open, close) || low > Math.min(open, close) || low > high) return null;

    return { time, open, high, low, close };
  }

  function createReplaySession(candles = [], options = {}) {
    const normalized = candles.map(normalizeCandle).filter(Boolean);
    const minimumVisible = Math.min(20, normalized.length);
    const requestedVisible = Math.round(clampNumber(options.initialVisible, minimumVisible, normalized.length, 30));

    return {
      version: 1,
      asset: String(options.asset ?? "ATIVO DEMO"),
      timeframe: String(options.timeframe ?? "M5"),
      candles: normalized,
      cursor: requestedVisible,
      openTrade: null,
      trades: [],
      complete: normalized.length === 0 || requestedVisible >= normalized.length,
      startedAt: Number(options.startedAt) || Date.now()
    };
  }

  function visibleCandles(state) {
    if (!state || !Array.isArray(state.candles)) return [];
    return state.candles.slice(0, Math.max(0, Number(state.cursor) || 0));
  }

  function openReplayTrade(state, options = {}) {
    if (!state || !Array.isArray(state.candles) || !state.candles.length) {
      return { state, error: "Sessão de replay inválida." };
    }
    if (state.complete || state.cursor >= state.candles.length) {
      return { state, error: "O replay já terminou." };
    }
    if (state.openTrade) {
      return { state, error: "Já existe uma posição aberta." };
    }

    const direction = String(options.direction ?? "").toUpperCase();
    if (!["LONG", "SHORT"].includes(direction)) {
      return { state, error: "Direção inválida." };
    }

    const entryCandle = state.candles[state.cursor - 1];
    const entry = entryCandle.close;
    const stopDistancePct = clampNumber(options.stopDistancePct, 0.02, 5, 0.2);
    const riskReward = clampNumber(options.riskReward, 0.5, 10, 2);
    const distance = entry * (stopDistancePct / 100);
    const stop = direction === "LONG" ? entry - distance : entry + distance;
    const target = direction === "LONG" ? entry + distance * riskReward : entry - distance * riskReward;

    const trade = {
      id: String(options.id ?? `${Date.now()}-${state.cursor}`),
      direction,
      entryIndex: state.cursor - 1,
      entryTime: entryCandle.time,
      entry,
      stop,
      target,
      stopDistancePct,
      riskReward,
      status: "OPEN",
      exit: null,
      exitTime: null,
      result: null,
      rMultiple: null,
      note: String(options.note ?? "").trim().slice(0, 240)
    };

    return { state: { ...state, openTrade: trade }, error: "" };
  }

  function closeTrade(trade, candle, outcome, exit, rMultiple, reason) {
    return {
      ...trade,
      status: "CLOSED",
      exit,
      exitTime: candle.time,
      result: outcome,
      rMultiple: Number(rMultiple.toFixed(2)),
      reason
    };
  }

  function evaluateTradeOnCandle(trade, candle) {
    if (!trade || trade.status !== "OPEN") return null;

    if (trade.direction === "LONG") {
      const hitStop = candle.low <= trade.stop;
      const hitTarget = candle.high >= trade.target;

      if (hitStop && hitTarget) {
        return closeTrade(trade, candle, "LOSS", trade.stop, -1, "Stop e alvo tocados na mesma vela; aplicado critério conservador.");
      }
      if (hitStop) return closeTrade(trade, candle, "LOSS", trade.stop, -1, "Stop atingido.");
      if (hitTarget) return closeTrade(trade, candle, "WIN", trade.target, trade.riskReward, "Alvo atingido.");
    } else {
      const hitStop = candle.high >= trade.stop;
      const hitTarget = candle.low <= trade.target;

      if (hitStop && hitTarget) {
        return closeTrade(trade, candle, "LOSS", trade.stop, -1, "Stop e alvo tocados na mesma vela; aplicado critério conservador.");
      }
      if (hitStop) return closeTrade(trade, candle, "LOSS", trade.stop, -1, "Stop atingido.");
      if (hitTarget) return closeTrade(trade, candle, "WIN", trade.target, trade.riskReward, "Alvo atingido.");
    }

    return null;
  }

  function closeAtEnd(trade, candle) {
    const riskDistance = Math.abs(trade.entry - trade.stop) || 1;
    const rawR = trade.direction === "LONG"
      ? (candle.close - trade.entry) / riskDistance
      : (trade.entry - candle.close) / riskDistance;
    const outcome = rawR > 0.01 ? "WIN" : rawR < -0.01 ? "LOSS" : "BREAKEVEN";

    return closeTrade(trade, candle, outcome, candle.close, rawR, "Sessão encerrada no último candle disponível.");
  }

  function advanceReplay(state) {
    if (!state || !Array.isArray(state.candles) || !state.candles.length) {
      return { state, event: { type: "ERROR", message: "Sessão inválida." } };
    }
    if (state.complete || state.cursor >= state.candles.length) {
      return { state: { ...state, complete: true }, event: { type: "COMPLETE", message: "Replay concluído." } };
    }

    const nextCandle = state.candles[state.cursor];
    const nextCursor = state.cursor + 1;
    let openTrade = state.openTrade;
    let trades = [...state.trades];
    let event = { type: "CANDLE", candle: nextCandle };

    if (openTrade) {
      const closed = evaluateTradeOnCandle(openTrade, nextCandle);
      if (closed) {
        trades.push(closed);
        openTrade = null;
        event = { type: "TRADE_CLOSED", trade: closed };
      }
    }

    const complete = nextCursor >= state.candles.length;
    if (complete && openTrade) {
      const closed = closeAtEnd(openTrade, nextCandle);
      trades.push(closed);
      openTrade = null;
      event = { type: "TRADE_CLOSED", trade: closed };
    }

    return {
      state: { ...state, cursor: nextCursor, openTrade, trades, complete },
      event
    };
  }

  function summarizeReplay(trades = []) {
    const closed = trades.filter(trade => trade && trade.status === "CLOSED" && Number.isFinite(Number(trade.rMultiple)));
    const wins = closed.filter(trade => trade.result === "WIN").length;
    const losses = closed.filter(trade => trade.result === "LOSS").length;
    const breakeven = closed.filter(trade => trade.result === "BREAKEVEN").length;
    const totalR = closed.reduce((sum, trade) => sum + Number(trade.rMultiple), 0);
    const expectancy = closed.length ? totalR / closed.length : 0;
    const winrate = closed.length ? (wins / closed.length) * 100 : 0;

    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    const curve = closed.map(trade => {
      equity += Number(trade.rMultiple);
      peak = Math.max(peak, equity);
      maxDrawdown = Math.max(maxDrawdown, peak - equity);
      return Number(equity.toFixed(2));
    });

    return {
      total: closed.length,
      wins,
      losses,
      breakeven,
      winrate: Number(winrate.toFixed(2)),
      totalR: Number(totalR.toFixed(2)),
      expectancy: Number(expectancy.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      curve
    };
  }

  return {
    normalizeCandle,
    createReplaySession,
    visibleCandles,
    openReplayTrade,
    evaluateTradeOnCandle,
    advanceReplay,
    summarizeReplay
  };
});
