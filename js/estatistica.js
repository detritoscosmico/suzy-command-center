(function () {
  "use strict";
  const core = window.SuzyStatisticsCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-statistics-probability-v1";
  const $ = id => document.getElementById(id);
  const CONCLUSION_LABELS = Object.freeze({
    SUPPORTED_LIMITED: "Sustentada com limites",
    INSUFFICIENT_EVIDENCE: "Evidência insuficiente",
    INVALID_METHOD: "Método inválido para a conclusão"
  });
  const RISK_LABELS = Object.freeze({
    SMALL_SAMPLE: "Amostra pequena",
    SELECTION_BIAS: "Viés de seleção",
    MULTIPLE_TESTING: "Múltiplos testes",
    DATA_LEAKAGE: "Vazamento de dados",
    DEPENDENCE: "Dependência entre observações",
    METRIC_MISUSE: "Uso inadequado de métrica",
    NON_STATIONARITY: "Mudança de regime",
    UNCERTAINTY: "Incerteza da estimativa"
  });
  const ACTION_LABELS = Object.freeze({
    EXPAND_SAMPLE: "Dimensionar e ampliar a amostra",
    AUDIT_SELECTION: "Auditar seleção e descartes",
    USE_HOLDOUT: "Reservar teste fora da amostra",
    REBUILD_PIPELINE: "Refazer o pipeline sem vazamento",
    TIME_AWARE_VALIDATION: "Validar respeitando a ordem temporal",
    REPORT_DISTRIBUTION: "Relatar distribuição, custos e expectativa",
    STRATIFY_REGIMES: "Estratificar por regime e contexto",
    REPORT_INTERVAL: "Relatar intervalo e premissas"
  });

  let state = loadState();
  let session = null;
  let sessionId = "";
  let currentIndex = 0;
  let locked = false;
  let sessionComplete = false;

  function loadState() {
    try { return core.normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
    catch (error) { console.warn("Histórico estatístico inválido foi ignorado.", error); return core.normalizeState({}); }
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
    $("caseConclusion").innerHTML = optionMarkup(core.CONCLUSIONS, CONCLUSION_LABELS);
    $("caseRisk").innerHTML = optionMarkup(core.RISKS, RISK_LABELS);
    $("caseAction").innerHTML = optionMarkup(core.ACTIONS, ACTION_LABELS);
    $("caseSource").innerHTML = '<option value="">Selecione</option>' + core.SOURCES.map(source => `<option value="${source.id}">${source.title}</option>`).join("");
  }

  function clearForm() {
    $("caseForm").reset();
    ["caseConclusion", "caseRisk", "caseAction", "caseSource"].forEach(id => { $(id).value = ""; });
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
    sessionId = `statistics-${session.seed}-${Date.now()}`;
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
      conclusion: $("caseConclusion").value,
      risk: $("caseRisk").value,
      action: $("caseAction").value,
      source: $("caseSource").value,
      rationale: $("caseRationale").value
    };
    if (!answer.conclusion || !answer.risk || !answer.action || !answer.source || !answer.rationale.trim()) {
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
    $("caseExpected").textContent = `Resposta esperada: ${CONCLUSION_LABELS[grade.expectedConclusion]}; ${RISK_LABELS[grade.expectedRisk]}; ${ACTION_LABELS[grade.expectedAction]}.`;
    $("caseResult").hidden = false;
    $("caseFeedback").textContent = "Resposta travada. A nota mede leitura metodológica, não resultado financeiro.";
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

  function calculateSample(event) {
    event.preventDefault();
    const summary = core.summarizeSample({
      wins: $("sampleWins").value,
      losses: $("sampleLosses").value,
      averageWin: $("sampleAverageWin").value,
      averageLoss: $("sampleAverageLoss").value
    });
    if (!summary.total) {
      $("sampleFeedback").textContent = "Informe ao menos uma operação encerrada.";
      return;
    }
    $("sampleTotal").textContent = String(summary.total);
    $("sampleWinRate").textContent = `${summary.winRate}%`;
    $("sampleInterval").textContent = `${summary.interval.lower}% – ${summary.interval.upper}%`;
    $("sampleExpectancy").textContent = `${summary.expectancy.toFixed(3)}R`;
    $("sampleBreakeven").textContent = `${summary.breakevenWinRate}%`;
    $("sampleFeedback").textContent = "Resumo amostral calculado. Ele descreve estes dados; não comprova estabilidade futura.";
  }

  fillOptions();
  $("sampleForm").addEventListener("submit", calculateSample);
  $("startSession").addEventListener("click", () => startSession(true));
  $("caseForm").addEventListener("submit", submitCase);
  $("nextCase").addEventListener("click", nextCase);
  $("clearHistory").addEventListener("click", () => {
    if (!window.confirm("Limpar todo o histórico local desta trilha?")) return;
    state = core.normalizeState({ lastSeed: state.lastSeed });
    saveState(); renderHistory(); renderKpis();
  });

  $("sessionSeed").value = String(state.lastSeed || 20260809);
  renderHistory();
  startSession(false);
})();
