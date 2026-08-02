const SIMULATOR_STORAGE_KEY = "suzy-order-simulator-v1";

const INSTRUMENTS = {
  EURUSD: { label: "EUR/USD DEMO", mid: 1.0875, pointSize: 0.0001, spread: 1.2, slippage: 0.5, stop: 20, target: 40 },
  XAUUSD: { label: "OURO XAU/USD DEMO", mid: 2385.4, pointSize: 0.1, spread: 3, slippage: 1, stop: 30, target: 60 },
  BTCUSD: { label: "BITCOIN BTC/USD DEMO", mid: 64250, pointSize: 1, spread: 12, slippage: 5, stop: 120, target: 240 },
  SP500: { label: "S&P 500 DEMO", mid: 5480.5, pointSize: 0.1, spread: 2, slippage: 0.8, stop: 25, target: 50 }
};

const $ = id => document.getElementById(id);
let state = loadState();

function emptyState() {
  return {
    instrument: "EURUSD",
    mid: INSTRUMENTS.EURUSD.mid,
    pendingOrder: null,
    pendingSettings: null,
    position: null,
    trades: [],
    lastBar: null
  };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SIMULATOR_STORAGE_KEY));
    if (!raw || typeof raw !== "object") return emptyState();
    return {
      ...emptyState(),
      ...raw,
      trades: Array.isArray(raw.trades) ? raw.trades.slice(-200) : []
    };
  } catch (error) {
    console.warn("Não foi possível restaurar o simulador.", error);
    return emptyState();
  }
}

function saveState() {
  localStorage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

function signedMoney(value) {
  const number = Number(value) || 0;
  return `${number > 0 ? "+" : ""}${money(number)}`;
}

function priceDecimals() {
  const point = Number($("pointSize").value) || 0.01;
  const text = point.toFixed(8).replace(/0+$/, "");
  const decimalPart = text.split(".")[1] || "";
  return Math.min(8, Math.max(0, decimalPart.length));
}

function formatPrice(value) {
  return Number(value).toFixed(priceDecimals());
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  }[char]));
}

function currentSettings() {
  return SuzySimulatorCore.normalizeSettings({
    pointSize: $("pointSize").value,
    spreadPoints: $("spreadPoints").value,
    slippagePoints: $("slippagePoints").value,
    commissionPerSide: $("commissionPerSide").value,
    valuePerPoint: $("valuePerPoint").value,
    stopPoints: $("stopPoints").value,
    targetPoints: $("targetPoints").value
  });
}

function setFeedback(message, type = "") {
  $("orderFeedback").textContent = message;
  $("orderFeedback").className = `feedback ${type}`.trim();
}

function applyInstrumentPreset(code, preserveActivity = false) {
  const preset = INSTRUMENTS[code] || INSTRUMENTS.EURUSD;
  state.instrument = code;

  if (!preserveActivity || (!state.pendingOrder && !state.position && !state.trades.length)) {
    state.mid = preset.mid;
    $("midPrice").value = preset.mid;
    $("pointSize").value = preset.pointSize;
    $("spreadPoints").value = preset.spread;
    $("slippagePoints").value = preset.slippage;
    $("stopPoints").value = preset.stop;
    $("targetPoints").value = preset.target;
    updateSuggestedTrigger();
  }

  render();
}

function updateSuggestedTrigger() {
  const mid = Number($("midPrice").value);
  const point = Number($("pointSize").value);
  const type = $("orderType").value;
  const direction = $("orderDirection").value;
  const distance = point * 10;

  if (!Number.isFinite(mid) || !Number.isFinite(point)) return;
  if (type === "MARKET") {
    $("triggerPrice").disabled = true;
    return;
  }

  $("triggerPrice").disabled = false;
  const sign = type === "LIMIT"
    ? (direction === "BUY" ? -1 : 1)
    : (direction === "BUY" ? 1 : -1);
  $("triggerPrice").value = (mid + sign * distance).toFixed(priceDecimals());
}

function renderQuote() {
  state.mid = Number($("midPrice").value) || state.mid;
  const quote = SuzySimulatorCore.buildQuote(state.mid, currentSettings());
  const instrument = INSTRUMENTS[state.instrument] || INSTRUMENTS.EURUSD;

  $("quoteAsset").textContent = instrument.label;
  $("quoteBid").textContent = quote ? formatPrice(quote.bid) : "—";
  $("quoteMid").textContent = quote ? formatPrice(quote.mid) : "—";
  $("quoteAsk").textContent = quote ? formatPrice(quote.ask) : "—";
  $("spreadCost").textContent = quote ? money(quote.spreadValue) : "—";
}

function renderMetrics() {
  const summary = SuzySimulatorCore.summarizeTrades(state.trades);
  $("metricTrades").textContent = summary.total;
  $("metricWinrate").textContent = `${summary.winrate.toFixed(1)}%`;
  $("metricGross").textContent = signedMoney(summary.gross);
  $("metricCosts").textContent = money(summary.costs);
  $("metricNet").textContent = signedMoney(summary.net);
  $("metricGross").className = summary.gross > 0 ? "green" : summary.gross < 0 ? "red" : "";
  $("metricNet").className = summary.net > 0 ? "green" : summary.net < 0 ? "red" : "";
}

function renderPending() {
  const order = state.pendingOrder;
  $("pendingEmpty").hidden = Boolean(order);
  $("pendingDetails").hidden = !order;
  $("cancelPending").disabled = !order;

  if (!order) return;
  $("pendingType").textContent = order.type === "LIMIT" ? "LIMITE" : "STOP";
  $("pendingDirection").textContent = order.direction === "BUY" ? "COMPRA" : "VENDA";
  $("pendingDirection").className = order.direction === "BUY" ? "green" : "red";
  $("pendingTrigger").textContent = formatPrice(order.trigger);
}

function renderPosition() {
  const position = state.position;
  $("positionEmpty").hidden = Boolean(position);
  $("positionDetails").hidden = !position;
  $("closeMarket").disabled = !position;

  if (!position) return;
  $("positionDirection").textContent = position.direction === "BUY" ? "COMPRADO" : "VENDIDO";
  $("positionDirection").className = position.direction === "BUY" ? "green" : "red";
  $("positionEntry").textContent = formatPrice(position.entry);
  $("positionStop").textContent = formatPrice(position.stop);
  $("positionTarget").textContent = formatPrice(position.target);
}

function renderLastBar() {
  const bar = state.lastBar;
  $("lastBar").hidden = !bar;
  if (!bar) return;
  $("barOpen").textContent = formatPrice(bar.open);
  $("barHigh").textContent = formatPrice(bar.high);
  $("barLow").textContent = formatPrice(bar.low);
  $("barClose").textContent = formatPrice(bar.close);
}

function renderTrades() {
  const rows = [...state.trades].reverse();
  $("tradeRows").innerHTML = rows.length
    ? rows.map((trade, index) => `
      <tr>
        <td>${rows.length - index}</td>
        <td>${escapeHtml(trade.orderType)}</td>
        <td>${trade.direction === "BUY" ? "COMPRA" : "VENDA"}</td>
        <td>${formatPrice(trade.entry)}</td>
        <td>${formatPrice(trade.exit)}</td>
        <td>${Number(trade.grossPoints).toFixed(2)}</td>
        <td class="${trade.grossMoney > 0 ? "green" : trade.grossMoney < 0 ? "red" : ""}">${signedMoney(trade.grossMoney)}</td>
        <td>${money(trade.costs)}</td>
        <td class="${trade.netMoney > 0 ? "green" : trade.netMoney < 0 ? "red" : ""}">${signedMoney(trade.netMoney)}</td>
        <td class="${trade.result === "WIN" ? "green" : trade.result === "LOSS" ? "red" : "orange"}">${trade.result}</td>
      </tr>`).join("")
    : '<tr><td colspan="10" class="empty-row">Nenhum trade encerrado.</td></tr>';
}

function render() {
  $("instrument").value = state.instrument;
  renderQuote();
  renderMetrics();
  renderPending();
  renderPosition();
  renderLastBar();
  renderTrades();
  $("submitOrder").disabled = Boolean(state.pendingOrder || state.position);
  saveState();
}

function submitOrder() {
  if (state.pendingOrder || state.position) {
    setFeedback("Cancele a ordem pendente ou encerre a posição antes de enviar outra.", "error");
    return;
  }

  const settings = currentSettings();
  const result = SuzySimulatorCore.submitOrder({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    type: $("orderType").value,
    direction: $("orderDirection").value,
    mid: $("midPrice").value,
    trigger: $("triggerPrice").value,
    note: $("orderNote").value
  }, settings);

  if (result.error) {
    setFeedback(result.error, "error");
    return;
  }

  state.pendingOrder = result.pendingOrder;
  state.pendingSettings = result.pendingOrder ? settings : null;
  state.position = result.position;
  $("orderNote").value = "";

  setFeedback(
    result.position
      ? "Ordem a mercado executada. Compare entrada, spread, slippage e comissão."
      : "Ordem pendente registrada. Gere candles até o preço de disparo ser alcançado.",
    "success"
  );
  render();
}

function generateAndProcessBar() {
  const settings = { ...currentSettings(), volatilityPoints: $("volatilityPoints").value };
  const bar = SuzySimulatorCore.generateArtificialBar(state.mid, settings);
  if (!bar) {
    setFeedback("Não foi possível gerar o candle. Revise o preço e o tamanho do ponto.", "error");
    return;
  }

  const hadPosition = Boolean(state.position);
  state.lastBar = bar;
  state.mid = bar.close;
  $("midPrice").value = formatPrice(bar.close);

  if (hadPosition) {
    const evaluated = SuzySimulatorCore.evaluatePositionOnBar(state.position, bar);
    if (evaluated.closed) {
      state.position = null;
      state.trades.push(evaluated.trade);
      setFeedback(`${evaluated.trade.result}: ${signedMoney(evaluated.trade.netMoney)} líquido. ${evaluated.trade.exitReason}`, evaluated.trade.result === "WIN" ? "success" : "error");
    } else {
      setFeedback("Candle processado. A posição continua aberta.");
    }
  } else if (state.pendingOrder) {
    const processed = SuzySimulatorCore.processPendingOrder(state.pendingOrder, bar, state.pendingSettings || settings);
    if (processed.filled) {
      state.pendingOrder = null;
      state.pendingSettings = null;
      state.position = processed.position;
      setFeedback("Ordem pendente executada. Stop e alvo serão avaliados a partir do próximo candle.", "success");
    } else {
      setFeedback("Candle processado. O preço de disparo ainda não foi alcançado.");
    }
  } else {
    setFeedback("Candle artificial processado sem ordem ativa.");
  }

  render();
}

function closeAtMarket() {
  const result = SuzySimulatorCore.closePositionAtMarket(state.position, state.mid);
  if (result.error) {
    setFeedback(result.error, "error");
    return;
  }

  state.trades.push(result.trade);
  state.position = null;
  setFeedback(`Posição encerrada a mercado: ${signedMoney(result.trade.netMoney)} líquido.`, result.trade.result === "WIN" ? "success" : "error");
  render();
}

function cancelPending() {
  if (!state.pendingOrder) return;
  state.pendingOrder = null;
  state.pendingSettings = null;
  setFeedback("Ordem pendente cancelada.");
  render();
}

function resetSimulator() {
  if ((state.trades.length || state.position || state.pendingOrder) && !confirm("Apagar toda a sessão do simulador?")) return;
  state = emptyState();
  applyInstrumentPreset("EURUSD");
  setFeedback("Sessão reiniciada.", "success");
}

function exportCsv() {
  if (!state.trades.length) {
    alert("Nenhum trade encerrado para exportar.");
    return;
  }

  const header = ["ordem", "direcao", "entrada", "saida", "pontos_brutos", "resultado_bruto", "custos", "resultado_liquido", "resultado", "motivo_saida"];
  const rows = state.trades.map(trade => [
    trade.orderType,
    trade.direction,
    trade.entry,
    trade.exit,
    trade.grossPoints,
    trade.grossMoney,
    trade.costs,
    trade.netMoney,
    trade.result,
    trade.exitReason
  ]);
  const csv = SuzyCore.serializeCsv([header, ...rows]);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `suzy-simulador-ordens-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

$("instrument").addEventListener("change", event => applyInstrumentPreset(event.target.value));
$("orderType").addEventListener("change", updateSuggestedTrigger);
$("orderDirection").addEventListener("change", updateSuggestedTrigger);
$("midPrice").addEventListener("input", () => { state.mid = Number($("midPrice").value) || state.mid; renderQuote(); updateSuggestedTrigger(); saveState(); });
$("pointSize").addEventListener("input", () => { renderQuote(); updateSuggestedTrigger(); });
$("spreadPoints").addEventListener("input", renderQuote);
$("valuePerPoint").addEventListener("input", renderQuote);
$("submitOrder").onclick = submitOrder;
$("generateBar").onclick = generateAndProcessBar;
$("closeMarket").onclick = closeAtMarket;
$("cancelPending").onclick = cancelPending;
$("resetSimulator").onclick = resetSimulator;
$("exportSimulator").onclick = exportCsv;

applyInstrumentPreset(state.instrument, true);
$("midPrice").value = state.mid;
updateSuggestedTrigger();
render();
