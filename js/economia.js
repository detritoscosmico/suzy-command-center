(function () {
  "use strict";
  const core = window.SuzyEconomicsCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-economics-macro-v1";
  const $ = id => document.getElementById(id);
  const INTERPRETATION_LABELS = Object.freeze({
    TIGHTENING_BIAS: "Viés relativamente mais restritivo",
    EASING_BIAS: "Viés relativamente menos restritivo",
    CONDITIONAL: "Condicional / contexto insuficiente"
  });
  const DRIVER_LABELS = Object.freeze({
    INFLATION_SURPRISE: "Surpresa de inflação",
    PRICING_SURPRISE: "Surpresa versus precificação",
    INFLATION_COMPOSITION: "Composição da inflação",
    ACTIVITY_LABOR: "Atividade e mercado de trabalho",
    GROWTH_SLOWDOWN: "Desaceleração de crescimento",
    FISCAL_TERM_PREMIUM: "Fiscal e prêmio de prazo",
    EXTERNAL_FX: "Choque externo e câmbio",
    SUPPLY_SHOCK: "Choque de oferta",
    REAL_RATE: "Taxa real ex ante",
    DATA_REVISION: "Revisões de dados",
    CURVE_EXPECTATIONS: "Curva e expectativas"
  });
  const ACTION_LABELS = Object.freeze({
    CHECK_EXPECTATIONS: "Conferir expectativas e persistência",
    CHECK_PRICING: "Comparar decisão com curva e consenso",
    CHECK_COMPOSITION: "Abrir composição, núcleos e difusão",
    CHECK_LAGS: "Avaliar defasagens da política",
    CHECK_INFLATION_PERSISTENCE: "Reavaliar persistência inflacionária",
    CHECK_FISCAL: "Separar fiscal, prêmio e política monetária",
    CHECK_EXTERNAL: "Conferir diferencial, repasse e cenário externo",
    CHECK_SECOND_ROUND: "Avaliar efeitos de segunda ordem",
    CHECK_REAL_RATE: "Calcular taxa real e condições financeiras",
    CHECK_REVISIONS: "Incorporar revisões e confirmação cruzada",
    CHECK_CURVE: "Decompor curva, expectativas e prêmio de prazo"
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
    catch (error) { console.warn("Histórico macroeconômico inválido foi ignorado.", error); return core.normalizeState({}); }
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
    sessionId = `economics-${session.seed}-${Date.now()}`;
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
    $("caseFeedback").textContent = "Resposta travada. A nota mede leitura macroeconômica e causal, não previsão de preço.";
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

  function calculateSnapshot(event) {
    event.preventDefault();
    const summary = core.summarizeMacroSnapshot({
      nominalRate: $("macroNominalRate").value,
      expectedInflation: $("macroExpectedInflation").value,
      actualInflation: $("macroActualInflation").value,
      consensusInflation: $("macroConsensusInflation").value,
      actualGrowth: $("macroActualGrowth").value,
      consensusGrowth: $("macroConsensusGrowth").value
    });
    $("macroRealRate").textContent = `${summary.realRateApprox.toFixed(2)}%`;
    $("macroInflationSurprise").textContent = `${summary.inflationSurprise >= 0 ? "+" : ""}${summary.inflationSurprise.toFixed(2)} p.p.`;
    $("macroGrowthSurprise").textContent = `${summary.growthSurprise >= 0 ? "+" : ""}${summary.growthSurprise.toFixed(2)} p.p.`;
    $("macroSignal").textContent = summary.signal === "HOTTER" ? "MAIS QUENTE" : summary.signal === "COOLER" ? "MAIS FRIO" : "MISTO";
    $("macroFeedback").textContent = "Snapshot calculado. É uma decomposição educacional; não é sinal de compra, venda ou previsão de decisão do banco central.";
  }

  fillOptions();
  $("macroForm").addEventListener("submit", calculateSnapshot);
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
