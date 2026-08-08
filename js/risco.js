const $ = id => document.getElementById(id);
const STORAGE_KEY = "suzy-risk-lab-v1";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 });

let positions = loadPositions();
let lastPosition = null;
let lastExposure = null;
let lastStress = null;
let lastPolicy = null;
let lastRuin = null;

function numeric(id) {
  return Number($(id).value);
}

function percent(value) {
  return `${number.format(Number(value) || 0)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadPositions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50).filter(item => item && typeof item === "object");
  } catch {
    return [];
  }
}

function savePositions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions.slice(0, 50)));
}

function syncRiskMode() {
  const fixed = $("riskMode").value === "FIXED";
  $("riskPercentLabel").hidden = fixed;
  $("fixedRiskLabel").hidden = !fixed;
  $("riskPercent").required = !fixed;
  $("fixedRisk").required = fixed;
}

function positionInput() {
  return {
    capital: numeric("riskCapital"),
    riskMode: $("riskMode").value,
    riskPercent: numeric("riskPercent"),
    fixedRisk: numeric("fixedRisk"),
    entry: numeric("entryPrice"),
    stop: numeric("stopPrice"),
    unitMultiplier: numeric("unitMultiplier"),
    quantityStep: numeric("quantityStep")
  };
}

function renderPosition(result) {
  const state = $("positionState");
  if (!result.valid) {
    state.textContent = "REVISAR DADOS";
    state.style.color = "var(--red)";
    $("positionBudget").textContent = "—";
    $("positionQuantity").textContent = "—";
    $("positionActualRisk").textContent = "—";
    $("positionNotional").textContent = "—";
    $("positionStopDistance").textContent = "—";
    $("positionMultiple").textContent = "—";
    $("kpiTradeRisk").textContent = "—";
    $("positionMessages").innerHTML = result.errors.map(message => `<li class="error">${escapeHtml(message)}</li>`).join("");
    return;
  }

  state.textContent = result.warnings.length ? "ATENÇÃO" : "CALCULADO";
  state.style.color = result.warnings.length ? "var(--orange)" : "var(--green)";
  $("positionBudget").textContent = money.format(result.requestedRisk);
  $("positionQuantity").textContent = number.format(result.quantity);
  $("positionActualRisk").textContent = `${money.format(result.actualRisk)} • ${percent(result.actualRiskPct)}`;
  $("positionNotional").textContent = money.format(result.notional);
  $("positionStopDistance").textContent = `${number.format(result.stopDistance)} • ${percent(result.stopDistancePct)}`;
  $("positionMultiple").textContent = `${number.format(result.notionalToCapital)}x`;
  $("kpiTradeRisk").textContent = percent(result.actualRiskPct);
  const messages = [
    "Quantidade arredondada para baixo pelo passo mínimo informado.",
    ...result.warnings
  ];
  $("positionMessages").innerHTML = messages.map((message, index) => `<li class="${index ? "warning" : ""}">${escapeHtml(message)}</li>`).join("");
}

function calculatePosition(event) {
  event?.preventDefault();
  lastPosition = SuzyRiskLabCore.calculatePositionSize(positionInput());
  renderPosition(lastPosition);
  evaluatePolicy();
}

function renderPositions() {
  const body = $("exposureBody");
  if (!positions.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma posição adicionada.</td></tr>';
    return;
  }

  body.innerHTML = positions.map(position => `
    <tr>
      <td>${escapeHtml(position.asset)}</td>
      <td>${escapeHtml(position.group)}</td>
      <td>${escapeHtml(position.side)}</td>
      <td>${money.format(Number(position.plannedRisk) || 0)}</td>
      <td><button class="remove-position" type="button" data-remove-position="${escapeHtml(position.id)}" aria-label="Remover ${escapeHtml(position.asset)}">REMOVER</button></td>
    </tr>
  `).join("");
}

function evaluateExposure() {
  lastExposure = SuzyRiskLabCore.evaluatePortfolioExposure({
    capital: numeric("riskCapital"),
    maxOpenRiskPct: numeric("maxOpenRisk"),
    maxGroupRiskPct: numeric("maxGroupRisk"),
    positions
  });
  $("kpiOpenRisk").textContent = percent(lastExposure.totalRiskPct);
  $("kpiGroupRisk").textContent = percent(lastExposure.largestGroup.riskPct);
  $("kpiGroupName").textContent = lastExposure.largestGroup.group === "—" ? "sem grupo" : lastExposure.largestGroup.group;
  const summary = $("exposureSummary");
  if (!positions.length) {
    summary.className = "status-strip";
    summary.textContent = "Adicione posições para estudar a exposição agregada.";
  } else if (lastExposure.passed) {
    summary.className = "status-strip pass";
    summary.textContent = `Dentro dos limites do cenário: ${percent(lastExposure.totalRiskPct)} abertos; ${money.format(lastExposure.remainingRisk)} de orçamento ainda disponível.`;
  } else {
    summary.className = "status-strip fail";
    const reasons = [];
    if (!lastExposure.withinTotalLimit) reasons.push(`risco aberto acima de ${percent(lastExposure.maxOpenRiskPct)}`);
    if (!lastExposure.withinGroupLimit) reasons.push(`${lastExposure.largestGroup.group} acima de ${percent(lastExposure.maxGroupRiskPct)}`);
    summary.textContent = `Limite violado: ${reasons.join("; ")}. Resultado financeiro não anula esta quebra.`;
  }
  evaluatePolicy();
}

function addExposure(event) {
  event.preventDefault();
  if (positions.length >= 50) return;
  const asset = $("exposureAsset").value.trim();
  const group = $("exposureGroup").value.trim();
  const plannedRisk = numeric("exposureRisk");
  if (!asset || !group || !Number.isFinite(plannedRisk) || plannedRisk <= 0) return;
  positions.push({
    id: `p-${Date.now()}-${positions.length}`,
    asset: asset.slice(0, 30),
    group: group.slice(0, 30),
    side: $("exposureSide").value === "SHORT" ? "SHORT" : "LONG",
    plannedRisk
  });
  savePositions();
  renderPositions();
  evaluateExposure();
  $("exposureAsset").value = "";
  $("exposureAsset").focus();
}

function removeExposure(id) {
  positions = positions.filter(position => position.id !== id);
  savePositions();
  renderPositions();
  evaluateExposure();
}

function clearPositions() {
  positions = [];
  savePositions();
  renderPositions();
  evaluateExposure();
}

function stressInput() {
  return {
    capital: numeric("riskCapital"),
    riskPercent: numeric("stressRisk"),
    sessionStopPct: numeric("stressStop"),
    outcomes: $("stressSequence").value
  };
}

function runStress(event) {
  event?.preventDefault();
  lastStress = SuzyRiskLabCore.runStressTest(stressInput());
  if (!lastStress.valid) {
    $("stressState").textContent = "REVISAR DADOS";
    $("stressState").style.color = "var(--red)";
    $("stressMessage").textContent = lastStress.errors.join(" ");
    return;
  }
  $("stressState").textContent = lastStress.halted ? "STOP ATIVADO" : "SEQUÊNCIA CONCLUÍDA";
  $("stressState").style.color = lastStress.halted ? "var(--orange)" : "var(--green)";
  $("stressEquity").textContent = money.format(lastStress.finalEquity);
  $("stressPnl").textContent = `${money.format(lastStress.totalPnl)} • ${percent(lastStress.totalPnlPct)}`;
  $("stressDrawdown").textContent = percent(lastStress.maxDrawdownPct);
  $("stressTrades").textContent = `${lastStress.executedTrades}/${lastStress.outcomes.length}`;
  $("stressMessage").textContent = lastStress.halted
    ? `O limite de ${percent(lastStress.sessionStopPct)} interrompeu ${lastStress.skippedTrades} operação(ões) do cenário. Gaps podem ultrapassar o limite antes do bloqueio.`
    : "A sequência terminou sem atingir o stop. Isso não torna o risco adequado; valide também exposição e política.";
}

function policyInput() {
  return {
    tradeRiskPct: lastPosition?.valid ? lastPosition.actualRiskPct : 0,
    openRiskPct: lastExposure?.totalRiskPct || 0,
    groupRiskPct: lastExposure?.largestGroup?.riskPct || 0,
    sessionLossPct: numeric("currentSessionLoss"),
    weeklyLossPct: numeric("currentWeekLoss"),
    limits: {
      maxTradeRiskPct: numeric("limitTrade"),
      maxOpenRiskPct: numeric("limitOpen"),
      maxGroupRiskPct: numeric("limitGroup"),
      maxSessionLossPct: numeric("limitSession"),
      maxWeeklyLossPct: numeric("limitWeek")
    }
  };
}

function evaluatePolicy() {
  lastPolicy = SuzyRiskLabCore.evaluateRiskPolicy(policyInput());
  $("kpiPolicy").textContent = lastPolicy.passed ? "DENTRO DO PLANO" : "LIMITE VIOLADO";
  $("kpiPolicy").style.color = lastPolicy.passed ? "var(--green)" : "var(--red)";
  $("policyChecks").innerHTML = lastPolicy.checks.map(check => `
    <article class="check-item ${check.passed ? "pass" : "fail"}">
      <strong>${check.passed ? "✓ DENTRO" : "✕ VIOLADO"}</strong>
      <span>${escapeHtml(check.label)}: ${percent(check.current)} / ${percent(check.limit)}</span>
    </article>
  `).join("");
}

function ruinInput() {
  return {
    capital: numeric("riskCapital"),
    riskPercent: numeric("ruinRisk"),
    winRate: numeric("ruinWinRate"),
    averageWinR: numeric("ruinWinR"),
    averageLossR: numeric("ruinLossR"),
    trades: numeric("ruinTrades"),
    paths: numeric("ruinPaths"),
    ruinDrawdownPct: numeric("ruinThreshold"),
    seed: numeric("ruinSeed")
  };
}

function runRuinSimulation(event) {
  event?.preventDefault();
  lastRuin = SuzyRiskLabCore.simulateRuinRisk(ruinInput());
  if (!lastRuin.valid) {
    $("ruinState").textContent = "REVISAR PREMISSAS";
    $("ruinState").style.color = "var(--red)";
    $("ruinDisclaimer").textContent = lastRuin.errors.join(" ");
    return;
  }
  $("ruinState").textContent = "SIMULAÇÃO REPRODUZÍVEL";
  $("ruinState").style.color = "var(--cyan)";
  $("ruinProbability").textContent = `${percent(lastRuin.ruinProbabilityPct)} • ${lastRuin.ruinedPaths}/${lastRuin.assumptions.paths}`;
  $("ruinMedian").textContent = money.format(lastRuin.medianFinalEquity);
  $("ruinP10").textContent = money.format(lastRuin.p10FinalEquity);
  $("ruinP90").textContent = money.format(lastRuin.p90FinalEquity);
  $("ruinDisclaimer").textContent = lastRuin.disclaimer;
}

function exportReport() {
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    educationalOnly: true,
    position: lastPosition,
    exposure: lastExposure,
    stress: lastStress,
    policy: lastPolicy,
    ruinSimulation: lastRuin,
    limitations: [
      "Sem feed de mercado, corretora ou execução real.",
      "Grupos de correlação são hipóteses manuais, não estimativas estatísticas.",
      "Monte Carlo assume independência e parâmetros estacionários e não prevê risco real."
    ]
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `suzy-risk-lab-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

$("riskMode").addEventListener("change", syncRiskMode);
$("positionForm").addEventListener("submit", calculatePosition);
$("riskCapital").addEventListener("change", () => { calculatePosition(); evaluateExposure(); });
$("exposureForm").addEventListener("submit", addExposure);
$("clearPositions").addEventListener("click", clearPositions);
$("maxOpenRisk").addEventListener("change", evaluateExposure);
$("maxGroupRisk").addEventListener("change", evaluateExposure);
$("exposureBody").addEventListener("click", event => {
  const button = event.target.closest("[data-remove-position]");
  if (button) removeExposure(button.dataset.removePosition);
});
$("stressForm").addEventListener("submit", runStress);
document.querySelectorAll("[data-stress]").forEach(button => button.addEventListener("click", () => {
  $("stressSequence").value = button.dataset.stress;
  runStress();
}));
$("evaluatePolicy").addEventListener("click", evaluatePolicy);
$("ruinForm").addEventListener("submit", runRuinSimulation);
$("exportRiskReport").addEventListener("click", exportReport);

syncRiskMode();
renderPositions();
calculatePosition();
evaluateExposure();
runStress();
evaluatePolicy();
