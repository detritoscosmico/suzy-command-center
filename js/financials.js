(function () {
  "use strict";
  const core = window.SuzyFinancialsCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-financial-statements-v1";
  const $ = id => document.getElementById(id);
  const INTERPRETATION_LABELS = Object.freeze({
    QUALITY_STRENGTHENED: "Qualidade/consistência fortalecida",
    QUALITY_WEAKENED: "Qualidade/consistência enfraquecida",
    CONDITIONAL: "Condicional / exige reconciliação"
  });
  const DRIVER_LABELS = Object.freeze({
    MARGIN_MIX: "Margem e mix",
    WORKING_CAPITAL: "Capital de giro",
    PAYABLES_STRETCH: "Alongamento de fornecedores",
    ACQUISITION_FUNDING: "Aquisição e financiamento",
    IMPAIRMENT_NONCASH: "Impairment não caixa",
    CAPITALIZATION_POLICY: "Política de capitalização",
    ONE_OFF_GAIN: "Ganho não recorrente",
    INVENTORY_QUALITY: "Qualidade do estoque",
    LEVERAGED_BUYBACK: "Recompra alavancada",
    RESTATEMENT: "Reapresentação de comparativos",
    GROWTH_CAPEX: "Capex de expansão",
    FX_TRANSLATION: "Conversão cambial"
  });
  const ACTION_LABELS = Object.freeze({
    CHECK_SEGMENTS: "Abrir segmentos, mix, preço e volume",
    CHECK_CFO_RECONCILIATION: "Reconciliar lucro e caixa operacional",
    CHECK_WORKING_CAPITAL: "Decompor capital de giro e reversões",
    CHECK_DEBT_MATURITY: "Conferir vencimentos, custo e covenants",
    CHECK_NOTES: "Ler notas e premissas do ajuste",
    CHECK_CAPITALIZATION: "Comparar capitalização, amortização e política",
    CHECK_RECURRING: "Separar recorrente de não recorrente",
    CHECK_INVENTORY: "Conferir giro, idade e valor realizável",
    CHECK_CAPITAL_ALLOCATION: "Avaliar preço, funding e estrutura de capital",
    CHECK_RESTATED: "Usar comparativos reapresentados e reconciliação",
    CHECK_CAPEX_NATURE: "Separar manutenção, expansão e retorno esperado",
    CHECK_FX_EFFECT: "Separar tradução, transação e fluxo realizado"
  });
  const SOURCE_LABELS = Object.freeze(Object.fromEntries(core.SOURCES.map(source => [source.id, source.title])));

  let state = loadState();
  let session = null;
  let sessionId = "";
  let currentIndex = 0;
  let locked = false;
  let sessionComplete = false;

  function loadState() {
    try { return core.normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
    catch (error) { console.warn("Histórico de demonstrações financeiras inválido foi ignorado.", error); return core.normalizeState({}); }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentAttempts() {
    return state.history.filter(attempt => attempt.sessionId === sessionId);
  }

  function optionMarkup(items, labels) {
    return '<option value="">Selecione</option>' + items.map(item => `<option value="${item}">${labels[item]}</option>`).join("");
  }

  function fillOptions() {
    $("caseInterpretation").innerHTML = optionMarkup(core.INTERPRETATIONS, INTERPRETATION_LABELS);
    $("caseDriver").innerHTML = optionMarkup(core.DRIVERS, DRIVER_LABELS);
    $("caseAction").innerHTML = optionMarkup(core.ACTIONS, ACTION_LABELS);
    $("caseSource").innerHTML = '<option value="">Selecione</option>' + core.SOURCES.map(source => `<option value="${source.id}">${source.title}</option>`).join("");
  }

  function clearForm() {
    $("caseForm").reset();
    ["caseInterpretation", "caseDriver", "caseAction", "caseSource"].forEach(id => { $(id).value = ""; });
    $("caseFeedback").textContent = "";
    $("caseResult").hidden = true;
    $("hardViolation").hidden = true;
    locked = false;
    [...$("caseForm").elements].forEach(element => { element.disabled = false; });
  }

  function renderCase() {
    const item = session.cases[currentIndex];
    clearForm();
    $("caseProgress").textContent = `CASO ${currentIndex + 1} DE ${core.REQUIRED_CASES}`;
    $("caseLab").dataset.caseId = item.id;
    $("caseTitle").textContent = item.title;
    $("caseFacts").innerHTML = item.facts.map(fact => `<li>${fact}</li>`).join("");
    $("nextCase").textContent = currentIndex === session.cases.length - 1 ? "VER RESULTADO DA SESSÃO" : "PRÓXIMO CASO";
    renderKpis();
  }

  function renderKpis() {
    const summary = core.evaluateSession(currentAttempts());
    $("kpiCases").textContent = `${summary.completed}/${summary.required}`;
    $("kpiAverage").textContent = String(summary.average);
    $("kpiViolations").textContent = String(summary.hardViolations);
    $("kpiStatus").textContent = state.passed ? "E3 APROVADO" : "EM FORMAÇÃO";
    $("kpiBest").textContent = `melhor média: ${state.bestAverage}`;
  }

  function renderHistory() {
    const history = [...state.history].reverse();
    $("historyBody").innerHTML = history.length ? history.map(attempt => {
      const item = core.findCase(attempt.caseId);
      const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(attempt.timestamp));
      return `<tr><td>${date}</td><td>${attempt.seed}</td><td>${item?.title || attempt.caseId}</td><td class="${attempt.passed ? "pass" : "fail"}">${attempt.score}</td><td>${attempt.hardViolation ? "SIM" : "NÃO"}</td></tr>`;
    }).join("") : '<tr><td colspan="5" class="empty">Nenhuma resposta registrada.</td></tr>';
  }

  function startSession(shouldScroll = true) {
    const seed = Number($("sessionSeed").value) || 1;
    session = core.createSession(seed);
    sessionId = `financials-${session.seed}-${Date.now()}`;
    currentIndex = 0;
    sessionComplete = false;
    state = core.normalizeState({ ...state, lastSeed: session.seed });
    saveState();
    $("sessionSeed").value = String(session.seed);
    $("sessionLabel").textContent = `Sessão ${session.seed}: seis variantes selecionadas.`;
    renderCase();
    if (shouldScroll) $("caseLab").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitCase(event) {
    event.preventDefault();
    if (locked) return;
    const item = session.cases[currentIndex];
    const answer = {
      interpretation: $("caseInterpretation").value,
      driver: $("caseDriver").value,
      action: $("caseAction").value,
      source: $("caseSource").value,
      rationale: $("caseRationale").value
    };
    if (!answer.interpretation || !answer.driver || !answer.action || !answer.source || !answer.rationale.trim()) {
      $("caseFeedback").textContent = "Preencha os cinco campos antes de avaliar.";
      return;
    }
    const grade = core.gradeCase(item.id, answer);
    state = core.recordAttempt(state, { sessionId, seed: session.seed, caseId: item.id, answer, timestamp: new Date().toISOString() });
    saveState();
    locked = true;
    [...$("caseForm").elements].forEach(element => { element.disabled = true; });
    $("caseScore").textContent = String(grade.score);
    $("caseResultState").textContent = grade.passed ? "APROVADO" : "REVISAR";
    $("caseResultState").className = grade.passed ? "pass" : "fail";
    $("caseChecks").innerHTML = grade.checks.map(check => `<article class="check-card ${check.passed ? "pass" : "fail"}"><strong>${check.passed ? `+${check.points}` : "+0"} • ${check.label}</strong><span>${check.passed ? "Critério atendido" : "Critério não atendido"}</span></article>`).join("");
    $("hardViolation").hidden = !grade.hardViolation;
    $("hardViolation").textContent = grade.hardViolation ? `VIOLAÇÃO DURA: ${grade.hardViolation}` : "";
    $("caseExplanation").textContent = grade.explanation;
    $("caseExpected").textContent = `Resposta esperada: ${INTERPRETATION_LABELS[grade.expectedInterpretation]}; ${DRIVER_LABELS[grade.expectedDriver]}; ${ACTION_LABELS[grade.expectedAction]}; ${SOURCE_LABELS[grade.expectedSource]}.`;
    $("caseResult").hidden = false;
    $("caseFeedback").textContent = "Resposta travada. A nota mede leitura e reconciliação contábil; não mede atratividade de investimento nem prevê preço.";
    renderKpis();
    renderHistory();
  }

  function nextCase() {
    if (sessionComplete) {
      $("sessionSeed").value = String(session.seed + 1);
      startSession();
      return;
    }
    if (!locked) return;
    if (currentIndex < session.cases.length - 1) {
      currentIndex += 1;
      renderCase();
      return;
    }
    const summary = core.evaluateSession(currentAttempts());
    $("sessionLabel").textContent = summary.passed
      ? `Sessão aprovada: média ${summary.average}, sem violação dura.`
      : `Sessão concluída sem aprovação: média ${summary.average}, ${summary.hardViolations} violação(ões) dura(s).`;
    $("nextCase").textContent = "INICIAR NOVA SESSÃO";
    sessionComplete = true;
    renderKpis();
  }

  function formatRatio(value, suffix = "") {
    return value === null ? "N/A" : `${value.toFixed(2)}${suffix}`;
  }

  function calculateSnapshot(event) {
    event.preventDefault();
    const summary = core.summarizeFinancialSnapshot({
      revenue: $("finRevenue").value,
      grossProfit: $("finGrossProfit").value,
      operatingProfit: $("finOperatingProfit").value,
      netIncome: $("finNetIncome").value,
      operatingCashFlow: $("finOperatingCashFlow").value,
      capex: $("finCapex").value,
      currentAssets: $("finCurrentAssets").value,
      currentLiabilities: $("finCurrentLiabilities").value,
      totalDebt: $("finTotalDebt").value,
      cash: $("finCash").value,
      equity: $("finEquity").value
    });
    $("finGrossMargin").textContent = formatRatio(summary.grossMargin, "%");
    $("finOperatingMargin").textContent = formatRatio(summary.operatingMargin, "%");
    $("finFcf").textContent = summary.freeCashFlowApprox.toFixed(2);
    $("finCurrentRatio").textContent = formatRatio(summary.currentRatio, "x");
    $("finNetDebt").textContent = summary.netDebt.toFixed(2);
    $("finCashBridge").textContent = summary.cashBridge === "CASH_AHEAD" ? "CAIXA > LUCRO" : summary.cashBridge === "PROFIT_AHEAD" ? "LUCRO > CAIXA" : summary.cashBridge === "DIVERGENT_SIGNS" ? "SINAIS DIVERGENTES" : "PRÓXIMOS / MISTOS";
    $("finFeedback").textContent = "Snapshot calculado. Razões são pontos de partida para reconciliação; não classificam sozinhas a empresa nem geram recomendação.";
  }

  fillOptions();
  $("financialForm").addEventListener("submit", calculateSnapshot);
  $("startSession").addEventListener("click", () => startSession(true));
  $("caseForm").addEventListener("submit", submitCase);
  $("nextCase").addEventListener("click", nextCase);
  $("clearHistory").addEventListener("click", () => {
    if (!window.confirm("Limpar todo o histórico local desta trilha?")) return;
    state = core.normalizeState({ lastSeed: state.lastSeed });
    saveState(); renderHistory(); renderKpis();
  });

  $("sessionSeed").value = String(state.lastSeed || 20260810);
  renderHistory();
  startSession(false);
})();