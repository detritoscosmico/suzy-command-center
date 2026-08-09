(function () {
  "use strict";
  const core = window.SuzyEthicsCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-ethics-regulation-v1";
  const $ = id => document.getElementById(id);
  const ACTION_LABELS = Object.freeze({
    WITHIN_SCOPE: "Dentro do escopo",
    OUTSIDE_SCOPE: "Fora do escopo",
    PAUSE_AND_VERIFY: "Pausar e verificar"
  });
  const CONFLICT_LABELS = Object.freeze({ YES: "conflito material", NO: "sem conflito nos fatos", UNCLEAR: "conflito indeterminado" });

  let state = loadState();
  let session = null;
  let sessionId = "";
  let currentIndex = 0;
  let locked = false;
  let sessionComplete = false;

  function loadState() {
    try { return core.normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
    catch (error) { console.warn("Histórico ético inválido foi ignorado.", error); return core.normalizeState({}); }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function sourceTitle(sourceId) {
    return core.SOURCES.find(source => source.id === sourceId)?.title || sourceId;
  }

  function currentAttempts() {
    return state.history.filter(attempt => attempt.sessionId === sessionId);
  }

  function fillSourceOptions() {
    $("caseSource").innerHTML = '<option value="">Selecione</option>' + core.SOURCES.map(source => `<option value="${source.id}">${source.title}</option>`).join("");
  }

  function clearForm() {
    $("caseForm").reset();
    $("caseSource").value = "";
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
    sessionId = `ethics-${session.seed}-${Date.now()}`;
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
      action: $("caseAction").value,
      conflict: $("caseConflict").value,
      source: $("caseSource").value,
      rationale: $("caseRationale").value
    };
    if (!answer.action || !answer.conflict || !answer.source || !answer.rationale.trim()) {
      $("caseFeedback").textContent = "Preencha os quatro campos antes de avaliar.";
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
    $("caseExpected").textContent = `Resposta esperada: ${ACTION_LABELS[grade.expectedAction]}; ${CONFLICT_LABELS[grade.expectedConflict]}; fonte: ${sourceTitle(grade.expectedSource)}.`;
    $("caseResult").hidden = false;
    $("caseFeedback").textContent = "Resposta travada. A nota não depende de resultado financeiro.";
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

  fillSourceOptions();
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
