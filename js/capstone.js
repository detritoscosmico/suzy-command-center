(function () {
  "use strict";

  const core = window.SuzyCapstoneCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-capstone-v1";
  const $ = id => document.getElementById(id);
  let sessionSeed = 42;
  let cases = [];
  let currentIndex = 0;
  let attempts = [];
  let history = loadHistory();

  function loadHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.slice(0, 50) : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  }

  function formatNumber(value) {
    return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  }

  function renderPolicy(scenario) {
    const policy = $("casePolicy");
    policy.replaceChildren();
    const entries = [
      ["Risco máximo", `${formatNumber(scenario.policy.maxRiskPct)}%`],
      ["Spread máximo", `${formatNumber(scenario.policy.maxSpreadPoints)} pts`],
      ["Bloqueio macro", `${scenario.policy.macroBlockMinutes} min`],
      ["Liquidez mínima", scenario.policy.minimumLiquidity]
    ];
    entries.forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);
      policy.append(wrapper);
    });
  }

  function setTradeFields() {
    const trade = $("caseAction").value === "TRADE";
    document.querySelectorAll(".trade-field input").forEach(input => {
      input.disabled = !trade;
      input.required = trade;
    });
  }

  function setFormLocked(locked) {
    $("caseForm").querySelectorAll("input, select, textarea, button").forEach(control => {
      control.disabled = locked;
    });
    if (!locked) setTradeFields();
  }

  function renderCase() {
    const scenario = cases[currentIndex];
    if (!scenario) return;

    $("caseProgress").textContent = `CASO ${currentIndex + 1} DE ${cases.length}`;
    $("caseTitle").textContent = scenario.title;
    $("caseMarket").textContent = scenario.market;
    $("caseFacts").replaceChildren(...scenario.facts.map(fact => {
      const item = document.createElement("li");
      item.textContent = fact;
      return item;
    }));
    renderPolicy(scenario);

    $("caseForm").reset();
    $("caseAction").value = "NO_TRADE";
    $("blockerAssessment").value = "CLEAR";
    $("caseRisk").value = String(Math.min(0.5, scenario.policy.maxRiskPct));
    $("caseFeedback").textContent = "";
    $("caseResult").hidden = true;
    $("nextCase").hidden = false;
    $("nextCase").textContent = currentIndex === cases.length - 1 ? "VER RESUMO DA SESSÃO" : "PRÓXIMO CASO";
    setFormLocked(false);
  }

  function renderChecks(result) {
    const container = $("caseChecks");
    container.replaceChildren();
    result.checks.forEach(check => {
      const card = document.createElement("article");
      card.className = `check-card ${check.passed ? "pass" : "fail"}`;
      const state = document.createElement("strong");
      state.textContent = `${check.passed ? "OK" : "REVISAR"} • ${check.weight} pts`;
      const label = document.createElement("span");
      label.textContent = check.label;
      card.append(state, label);
      container.append(card);
    });
  }

  function renderResult(result) {
    $("caseScore").textContent = String(result.score);
    $("caseResultState").textContent = result.passed ? "PROCESSO APROVADO" : "PROCESSO A REVISAR";
    $("caseResultState").className = result.passed ? "pass-text" : "fail-text";
    renderChecks(result);

    const hardViolation = $("hardViolation");
    hardViolation.hidden = result.hardViolations.length === 0;
    hardViolation.textContent = result.hardViolations.length
      ? `VIOLAÇÃO DURA — ${result.hardViolations.join(" ")}`
      : "";
    $("blockerExplanation").textContent = result.blockerExplanation;
    $("caseOutcome").textContent = result.outcome;
    $("caseResult").hidden = false;
    $("caseResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updateSummary() {
    const summary = core.evaluateCapstone(attempts);
    $("kpiCases").textContent = `${Math.min(summary.total, summary.requiredCases)}/${summary.requiredCases}`;
    $("kpiAverage").textContent = String(summary.averageScore);
    $("kpiViolations").textContent = String(summary.hardViolations);
    $("kpiStatus").textContent = summary.status;
    $("kpiStatus").className = summary.passed ? "pass-text" : summary.completed ? "fail-text" : "";
    return summary;
  }

  function renderHistory() {
    const body = $("historyBody");
    body.replaceChildren();
    if (!history.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.className = "empty";
      cell.textContent = "Nenhum caso concluído.";
      row.append(cell);
      body.append(row);
      return;
    }
    history.forEach(item => {
      const row = document.createElement("tr");
      [item.date, item.seed, item.caseTitle, item.action, item.score, item.violations].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.append(cell);
      });
      body.append(row);
    });
  }

  function startSession() {
    const parsed = Number.parseInt($("sessionSeed").value, 10);
    sessionSeed = Number.isFinite(parsed) ? parsed : 42;
    $("sessionSeed").value = String(sessionSeed);
    cases = core.createCaseSet(sessionSeed, core.REQUIRED_CASES);
    currentIndex = 0;
    attempts = [];
    $("sessionLabel").textContent = `Sessão ${sessionSeed}: ${cases.length} casos reproduzíveis.`;
    updateSummary();
    renderCase();
  }

  function submitCase(event) {
    event.preventDefault();
    if (attempts.length !== currentIndex) return;
    const scenario = cases[currentIndex];
    const response = {
      action: $("caseAction").value,
      blockerAssessment: $("blockerAssessment").value,
      riskPercent: $("caseAction").value === "TRADE" ? $("caseRisk").value : 0,
      trigger: $("caseAction").value === "TRADE" ? $("caseTrigger").value : "",
      invalidation: $("caseAction").value === "TRADE" ? $("caseInvalidation").value : "",
      rationale: $("caseRationale").value,
      acceptsUncertainty: $("caseUncertainty").checked
    };
    const result = core.evaluateCase(scenario, response);
    attempts.push(result);
    history.unshift({
      date: new Date().toLocaleString("pt-BR"),
      seed: sessionSeed,
      scenarioId: scenario.id,
      caseTitle: scenario.title,
      action: result.response.action,
      score: result.score,
      violations: result.hardViolations.length
    });
    history = history.slice(0, 50);
    saveHistory();
    setFormLocked(true);
    renderResult(result);
    renderHistory();
    const summary = updateSummary();
    $("caseFeedback").textContent = "Decisão travada. O desfecho foi revelado somente após a avaliação do processo.";
    if (summary.completed) {
      $("sessionLabel").textContent = `Sessão ${sessionSeed} concluída: ${summary.status}, média ${summary.averageScore}.`;
    }
  }

  function nextCase() {
    if (currentIndex < cases.length - 1) {
      currentIndex += 1;
      renderCase();
      $("caseLab").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    $("nextCase").hidden = true;
    $("sessionLabel").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      sessionSeed,
      attempts,
      summary: core.evaluateCapstone(attempts),
      history,
      limitations: "Treino educacional com casos artificiais. Não é previsão, recomendação, diploma, licença ou autorização para operar capital real."
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suzy-capstone-${sessionSeed}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    history = [];
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }

  $("caseAction").addEventListener("change", setTradeFields);
  $("caseForm").addEventListener("submit", submitCase);
  $("startSession").addEventListener("click", startSession);
  $("nextCase").addEventListener("click", nextCase);
  $("exportCapstone").addEventListener("click", exportData);
  $("clearCapstoneHistory").addEventListener("click", clearHistory);
  renderHistory();
  startSession();
})();
