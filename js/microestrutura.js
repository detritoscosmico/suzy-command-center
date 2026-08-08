const $ = id => document.getElementById(id);
const STORAGE_KEY = "suzy-microstructure-lab-v1";
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 });
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

let history = loadHistory();
let lastExecution = null;
let lastQuality = null;

function numeric(id) {
  return Number($(id).value);
}

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
}

function marketInput() {
  return {
    mid: numeric("marketMid"),
    pointSize: numeric("pointSize"),
    baseSpreadPoints: numeric("baseSpread"),
    baseSlippagePoints: numeric("baseSlippage"),
    volatility: $("volatility").value,
    liquidity: $("liquidity").value,
    availableQuantity: numeric("availableQuantity"),
    valuePerPoint: numeric("valuePerPoint"),
    commissionPerOrder: numeric("commissionPerOrder")
  };
}

function orderInput() {
  return {
    type: $("orderType").value,
    direction: $("orderDirection").value,
    quantity: numeric("orderQuantity"),
    trigger: numeric("orderTrigger"),
    note: $("executionNote").value
  };
}

function barInput() {
  return {
    open: numeric("barOpen"),
    high: numeric("barHigh"),
    low: numeric("barLow"),
    close: numeric("barClose")
  };
}

function thresholdInput() {
  return {
    maxSlippagePoints: numeric("maxSlippage"),
    minimumFillPct: numeric("minimumFill"),
    maxGapPoints: numeric("maxGap")
  };
}

function updateQuote() {
  const conditions = SuzyMicrostructureCore.buildMarketConditions(marketInput());
  $("quoteBid").textContent = decimal.format(conditions.bid);
  $("quoteMid").textContent = decimal.format(conditions.mid);
  $("quoteAsk").textContent = decimal.format(conditions.ask);
  $("effectiveSpread").textContent = `${decimal.format(conditions.spreadPoints)} pts`;
  $("effectiveSlippage").textContent = `${decimal.format(conditions.baselineSlippagePoints)} pts`;
  $("kpiSpread").textContent = `${decimal.format(conditions.spreadPoints)} pts`;
}

function syncOrderType() {
  const market = $("orderType").value === "MARKET";
  $("orderTrigger").disabled = market;
  $("barFields").disabled = market;
  if (!market) setSuggestedTrigger();
}

function setSuggestedTrigger() {
  const mid = numeric("marketMid");
  const point = Math.max(0.00000001, numeric("pointSize"));
  const distance = point * 5;
  const type = $("orderType").value;
  const buy = $("orderDirection").value === "BUY";
  const trigger = type === "LIMIT"
    ? mid + (buy ? -distance : distance)
    : mid + (buy ? distance : -distance);
  $("orderTrigger").value = String(Number(trigger.toFixed(8)));
}

function renderQuality(quality) {
  $("kpiQuality").textContent = quality.status;
  $("kpiQuality").className = quality.passed ? "status-pass" : "status-fail";
  if (!quality.checks.length) {
    $("qualityChecks").innerHTML = '<p class="empty">Sem fill suficiente para aplicar a rubrica.</p>';
    return;
  }
  $("qualityChecks").innerHTML = quality.checks.map(check => {
    const suffix = check.boolean ? "" : check.minimum ? "%" : " pts";
    const detail = check.boolean
      ? "Proteção de preço verificada"
      : `${decimal.format(check.current)}${suffix} / ${check.minimum ? "mín." : "máx."} ${decimal.format(check.limit)}${suffix}`;
    return `<article class="quality-card ${check.passed ? "pass" : "fail"}"><strong>${check.passed ? "✓ DENTRO" : "✕ FORA"}</strong><span>${check.label}<br>${detail}</span></article>`;
  }).join("");
}

function clearResultMetrics() {
  ["resultBenchmark", "resultFillPrice", "resultQuantity", "resultFillPct", "resultSpread", "resultSlippage", "resultGap", "resultDeviation", "resultCost"].forEach(id => { $(id).textContent = "—"; });
  $("kpiFill").textContent = "—";
  $("kpiDeviation").textContent = "—";
}

function renderExecution(execution, quality) {
  const status = $("executionStatus");
  status.textContent = execution.status;
  status.className = ["FILLED"].includes(execution.status) ? "status-pass" : execution.status === "PARTIAL" ? "status-warn" : "status-fail";
  if (!["FILLED", "PARTIAL"].includes(execution.status)) {
    clearResultMetrics();
    $("executionMessage").textContent = execution.error || (execution.status === "NOT_TRIGGERED" ? "A ordem não foi tocada pelo candle artificial." : "Não havia quantidade disponível para preencher a ordem.");
    renderQuality(quality);
    return;
  }

  $("resultBenchmark").textContent = decimal.format(execution.benchmarkPrice);
  $("resultFillPrice").textContent = decimal.format(execution.fillPrice);
  $("resultQuantity").textContent = `${decimal.format(execution.filledQuantity)} / ${decimal.format(execution.requestedQuantity)}`;
  $("resultFillPct").textContent = `${decimal.format(execution.fillPct)}%`;
  $("resultSpread").textContent = `${decimal.format(execution.spreadComponentPoints)} pts`;
  $("resultSlippage").textContent = `${decimal.format(execution.slippageComponentPoints)} pts`;
  $("resultGap").textContent = `${decimal.format(execution.gapComponentPoints)} pts`;
  $("resultDeviation").textContent = `${decimal.format(execution.adverseDeviationPoints)} pts`;
  $("resultCost").textContent = money.format(execution.executionCostMoney);
  $("kpiFill").textContent = `${decimal.format(execution.fillPct)}%`;
  $("kpiDeviation").textContent = `${decimal.format(execution.adverseDeviationPoints)} pts`;
  $("executionMessage").textContent = execution.status === "PARTIAL"
    ? `${decimal.format(execution.unfilledQuantity)} unidade(s) ficaram sem fill. A falta de liquidez faz parte do resultado do exercício.`
    : "Fill completo. Compare os componentes do desvio com os limites definidos antes da execução.";
  renderQuality(quality);
}

function runExecution(event) {
  event?.preventDefault();
  const market = marketInput();
  const order = orderInput();
  const execution = SuzyMicrostructureCore.simulateExecution({
    market,
    order,
    bar: order.type === "MARKET" ? undefined : barInput()
  });
  const quality = SuzyMicrostructureCore.evaluateExecutionQuality(execution, thresholdInput());
  lastExecution = execution;
  lastQuality = quality;
  renderExecution(execution, quality);
  if (["FILLED", "PARTIAL"].includes(execution.status)) {
    history.unshift({
      id: `exec-${Date.now()}`,
      createdAt: new Date().toISOString(),
      market,
      order,
      execution,
      quality
    });
    history = history.slice(0, 30);
    saveHistory();
    renderHistory();
  }
}

function renderHistory() {
  const summary = SuzyMicrostructureCore.summarizeExecutions(history);
  $("historyTotal").textContent = String(summary.total);
  $("historyFill").textContent = `${decimal.format(summary.averageFillPct)}%`;
  $("historyDeviation").textContent = `${decimal.format(summary.averageAdversePoints)} pts`;
  $("historyPassed").textContent = `${summary.passed}/${summary.total}`;
  if (!history.length) {
    $("historyBody").innerHTML = '<tr><td colspan="8" class="empty">Nenhuma execução registrada.</td></tr>';
    return;
  }
  $("historyBody").innerHTML = history.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.market.volatility}/${item.market.liquidity}</td>
      <td>${item.order.type} ${item.order.direction}</td>
      <td>${decimal.format(item.execution.requestedQuantity)}</td>
      <td>${decimal.format(item.execution.fillPct)}%</td>
      <td>${decimal.format(item.execution.adverseDeviationPoints)} pts</td>
      <td>${money.format(item.execution.executionCostMoney)}</td>
      <td class="${item.quality.passed ? "status-pass" : "status-fail"}">${item.quality.score}%</td>
    </tr>
  `).join("");
}

function applyPreset(name) {
  const presets = {
    NORMAL: { volatility: "NORMAL", liquidity: "NORMAL", available: 100, spread: 2, slip: 0.5 },
    VOLATILE: { volatility: "HIGH", liquidity: "NORMAL", available: 80, spread: 2, slip: 0.8 },
    THIN: { volatility: "NORMAL", liquidity: "THIN", available: 25, spread: 2, slip: 0.8 },
    SHOCK: { volatility: "EXTREME", liquidity: "THIN", available: 15, spread: 2.5, slip: 1.2 }
  };
  const preset = presets[name] || presets.NORMAL;
  $("volatility").value = preset.volatility;
  $("liquidity").value = preset.liquidity;
  $("availableQuantity").value = String(preset.available);
  $("baseSpread").value = String(preset.spread);
  $("baseSlippage").value = String(preset.slip);
  updateQuote();
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
}

function exportHistory() {
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    educationalOnly: true,
    summary: SuzyMicrostructureCore.summarizeExecutions(history),
    executions: history,
    limitations: [
      "Modelo artificial sem livro de ofertas ou feed real.",
      "Multiplicadores de volatilidade, liquidez e impacto são didáticos, não calibração de mercado.",
      "Qualidade mede limites de implementação e não prevê P/L."
    ]
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `suzy-microestrutura-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll(".market-controls input, .market-controls select").forEach(control => control.addEventListener("change", updateQuote));
document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => applyPreset(button.dataset.preset)));
$("orderType").addEventListener("change", syncOrderType);
$("orderDirection").addEventListener("change", () => { if ($("orderType").value !== "MARKET") setSuggestedTrigger(); });
$("executionForm").addEventListener("submit", runExecution);
$("clearHistory").addEventListener("click", clearHistory);
$("exportMicrostructure").addEventListener("click", exportHistory);

updateQuote();
syncOrderType();
renderHistory();
