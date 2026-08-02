(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyReplayCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const REQUIRED_CSV_FIELDS = ["time", "open", "high", "low", "close"];
  const CSV_HEADER_ALIASES = {
    time: ["time", "timestamp", "datetime", "date", "data", "datahora", "hora"],
    open: ["open", "abertura", "o"],
    high: ["high", "max", "maximum", "maxima", "maior", "h"],
    low: ["low", "min", "minimum", "minima", "menor", "l"],
    close: ["close", "fechamento", "ultimo", "last", "c"]
  };

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

  function canonicalHeader(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function countDelimiter(line, delimiter) {
    let count = 0;
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') index += 1;
        else quoted = !quoted;
      } else if (!quoted && char === delimiter) {
        count += 1;
      }
    }

    return count;
  }

  function detectDelimiter(text) {
    const firstLine = String(text ?? "").replace(/^\uFEFF/, "").split(/\r?\n/).find(line => line.trim()) || "";
    const candidates = [";", ",", "\t"];
    return candidates
      .map(delimiter => ({ delimiter, count: countDelimiter(firstLine, delimiter) }))
      .sort((left, right) => right.count - left.count)[0]?.delimiter || ",";
  }

  function parseDelimitedRows(text, delimiter = detectDelimiter(text)) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = String(text ?? "").replace(/^\uFEFF/, "");

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];

      if (char === '"') {
        if (quoted && source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (!quoted && char === delimiter) {
        row.push(cell.trim());
        cell = "";
      } else if (!quoted && (char === "\n" || char === "\r")) {
        if (char === "\r" && source[index + 1] === "\n") index += 1;
        row.push(cell.trim());
        if (row.some(value => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(value => value !== "")) rows.push(row);
    return rows;
  }

  function parseDecimal(value) {
    const raw = String(value ?? "").trim().replace(/\s/g, "");
    if (!raw) return NaN;

    let normalized = raw;
    const comma = normalized.lastIndexOf(",");
    const dot = normalized.lastIndexOf(".");

    if (comma >= 0 && dot >= 0) {
      if (comma > dot) normalized = normalized.replace(/\./g, "").replace(",", ".");
      else normalized = normalized.replace(/,/g, "");
    } else if (comma >= 0) {
      normalized = normalized.replace(",", ".");
    }

    return Number(normalized);
  }

  function parseTimestamp(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return NaN;

    if (/^\d+(\.\d+)?$/.test(raw)) {
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return NaN;
      if (numeric >= 1e12) return Math.round(numeric);
      if (numeric >= 1e9) return Math.round(numeric * 1000);
    }

    const brazilian = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brazilian) {
      const [, day, month, year, hour = "0", minute = "0", second = "0"] = brazilian;
      const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
      return Number.isFinite(timestamp) ? timestamp : NaN;
    }

    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function resolveCsvColumns(headers = []) {
    const canonical = headers.map(canonicalHeader);
    const indexes = {};

    for (const field of REQUIRED_CSV_FIELDS) {
      indexes[field] = canonical.findIndex(header => CSV_HEADER_ALIASES[field].includes(header));
    }

    return indexes;
  }

  function parseHistoricalCsv(text, options = {}) {
    const maximumRows = Math.round(clampNumber(options.maximumRows, 30, 10000, 5000));
    const minimumCandles = Math.round(clampNumber(options.minimumCandles, 10, 500, 30));
    const errors = [];
    const warnings = [];
    const source = String(text ?? "");

    if (!source.trim()) {
      return { valid: false, candles: [], errors: ["O arquivo está vazio."], warnings, delimiter: ",", totalRows: 0 };
    }

    const delimiter = detectDelimiter(source);
    const rows = parseDelimitedRows(source, delimiter);
    if (rows.length < 2) {
      return { valid: false, candles: [], errors: ["O CSV precisa conter cabeçalho e linhas de candles."], warnings, delimiter, totalRows: 0 };
    }

    const indexes = resolveCsvColumns(rows[0]);
    const missing = REQUIRED_CSV_FIELDS.filter(field => indexes[field] < 0);
    if (missing.length) {
      return {
        valid: false,
        candles: [],
        errors: [`Colunas obrigatórias ausentes: ${missing.join(", ")}.`],
        warnings,
        delimiter,
        totalRows: rows.length - 1
      };
    }

    const dataRows = rows.slice(1);
    if (dataRows.length > maximumRows) {
      warnings.push(`O arquivo possui ${dataRows.length} linhas; somente as primeiras ${maximumRows} foram processadas.`);
    }

    const candlesByTime = new Map();
    let invalidRows = 0;
    let duplicateRows = 0;

    dataRows.slice(0, maximumRows).forEach((row, rowIndex) => {
      const candle = normalizeCandle({
        time: parseTimestamp(row[indexes.time]),
        open: parseDecimal(row[indexes.open]),
        high: parseDecimal(row[indexes.high]),
        low: parseDecimal(row[indexes.low]),
        close: parseDecimal(row[indexes.close])
      });

      if (!candle) {
        invalidRows += 1;
        if (errors.length < 8) errors.push(`Linha ${rowIndex + 2}: timestamp ou OHLC inválido.`);
        return;
      }

      if (candlesByTime.has(candle.time)) {
        duplicateRows += 1;
        return;
      }

      candlesByTime.set(candle.time, candle);
    });

    const originalTimes = [...candlesByTime.keys()];
    const candles = [...candlesByTime.values()].sort((left, right) => left.time - right.time);
    const reordered = originalTimes.some((time, index) => time !== candles[index]?.time);

    if (invalidRows > errors.length) warnings.push(`${invalidRows} linhas inválidas foram descartadas.`);
    if (duplicateRows) warnings.push(`${duplicateRows} timestamps duplicados foram descartados.`);
    if (reordered) warnings.push("Os candles foram reordenados cronologicamente.");
    if (candles.length < minimumCandles) {
      errors.push(`São necessários pelo menos ${minimumCandles} candles válidos; foram encontrados ${candles.length}.`);
    }

    return {
      valid: candles.length >= minimumCandles,
      candles,
      errors,
      warnings,
      delimiter,
      totalRows: dataRows.length,
      validRows: candles.length,
      invalidRows,
      duplicateRows
    };
  }

  function createReplaySession(candles = [], options = {}) {
    const normalized = candles.map(normalizeCandle).filter(Boolean).sort((left, right) => left.time - right.time);
    const minimumVisible = Math.min(20, normalized.length);
    const requestedVisible = Math.round(clampNumber(options.initialVisible, minimumVisible, normalized.length, 30));

    return {
      version: 2,
      asset: String(options.asset ?? "ATIVO DEMO").trim().slice(0, 40) || "ATIVO DEMO",
      timeframe: String(options.timeframe ?? "M5").trim().slice(0, 12) || "M5",
      source: String(options.source ?? "ARTIFICIAL").trim().slice(0, 24) || "ARTIFICIAL",
      sourceName: String(options.sourceName ?? "Cenário gerado pela Suzy").trim().slice(0, 120),
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
    detectDelimiter,
    parseDelimitedRows,
    parseDecimal,
    parseTimestamp,
    resolveCsvColumns,
    parseHistoricalCsv,
    createReplaySession,
    visibleCandles,
    openReplayTrade,
    evaluateTradeOnCandle,
    advanceReplay,
    summarizeReplay
  };
});
