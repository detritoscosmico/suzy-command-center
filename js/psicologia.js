(() => {
  "use strict";

  const Core = window.SuzyPsychologyCore;
  const STORAGE_KEY = "suzy_psychology_v1";

  const LESSONS = [
    {
      id: "process-identity",
      title: "Identidade de processo",
      text: "Separe autoestima de resultado. A execução correta é cumprir regras observáveis, inclusive quando o desfecho é negativo."
    },
    {
      id: "emotional-activation",
      title: "Ativação emocional",
      text: "Reconheça pressa, tensão, euforia e irritação como sinais de redução da qualidade decisória, não como comandos de ação."
    },
    {
      id: "loss-reaction",
      title: "Reação a perdas",
      text: "Entenda a vontade de recuperar como um risco operacional. A resposta treinada é pausa, registro e retorno ao protocolo."
    },
    {
      id: "precommitment",
      title: "Pré-compromisso",
      text: "Defina antes da sessão os cenários permitidos, limites, critérios de invalidação e condição objetiva de encerramento."
    },
    {
      id: "deliberate-review",
      title: "Revisão deliberada",
      text: "Revise decisões evitadas, regras quebradas, emoções e contexto. Resultados isolados não validam comportamento."
    }
  ];

  const QUESTIONS = [
    { id: "impulse-1", dimension: "impulse", text: "Tomo decisões antes de concluir meu checklist." },
    { id: "impulse-2", dimension: "impulse", text: "Sinto urgência para agir quando o preço se move rapidamente." },
    { id: "impulse-3", dimension: "impulse", text: "Aumento a frequência de decisões quando estou entediado." },
    { id: "loss-1", dimension: "lossReaction", text: "Depois de uma perda, quero agir novamente o mais rápido possível." },
    { id: "loss-2", dimension: "lossReaction", text: "Mudo o tamanho do risco para tentar recuperar um resultado negativo." },
    { id: "loss-3", dimension: "lossReaction", text: "Uma sequência ruim altera meu plano original." },
    { id: "plan-1", dimension: "planAdherence", reverse: true, text: "Consigo explicar por escrito o contexto, o gatilho e a invalidação antes de decidir." },
    { id: "plan-2", dimension: "planAdherence", reverse: true, text: "Respeito o limite de perda mesmo quando acredito que a próxima tentativa pode funcionar." },
    { id: "plan-3", dimension: "planAdherence", reverse: true, text: "Registro também as decisões que evitei por falta de critério." },
    { id: "emotion-1", dimension: "emotionalRegulation", reverse: true, text: "Percebo tensão, euforia ou irritação antes que elas alterem meu comportamento." },
    { id: "emotion-2", dimension: "emotionalRegulation", reverse: true, text: "Consigo fazer uma pausa sem sentir que estou perdendo uma oportunidade obrigatória." },
    { id: "emotion-3", dimension: "emotionalRegulation", reverse: true, text: "Retomo o treinamento somente quando minha ativação emocional diminui." },
    { id: "patience-1", dimension: "patience", reverse: true, text: "Aceito passar uma sessão inteira sem registrar uma operação quando o cenário não aparece." },
    { id: "patience-2", dimension: "patience", reverse: true, text: "Espero confirmação mesmo quando o movimento inicial parece convincente." },
    { id: "patience-3", dimension: "patience", reverse: true, text: "Consigo observar um movimento sem transformá-lo automaticamente em oportunidade." },
    { id: "risk-1", dimension: "riskAcceptance", reverse: true, text: "Aceito previamente o valor definido como risco sem depender do resultado." },
    { id: "risk-2", dimension: "riskAcceptance", reverse: true, text: "Mantenho o mesmo limite após ganhos e perdas recentes." },
    { id: "risk-3", dimension: "riskAcceptance", reverse: true, text: "Encerro a sessão quando o limite é atingido, sem negociar comigo mesmo." }
  ];

  const RATING_LABELS = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Quase sempre"];

  const elements = {
    lessonGrid: document.querySelector("#lessonGrid"),
    lessonProgress: document.querySelector("#lessonProgress"),
    heroLessons: document.querySelector("#heroLessons"),
    heroStreak: document.querySelector("#heroStreak"),
    heroRisk: document.querySelector("#heroRisk"),
    kpiCheckIns: document.querySelector("#kpiCheckIns"),
    kpiAssessments: document.querySelector("#kpiAssessments"),
    kpiReadiness: document.querySelector("#kpiReadiness"),
    kpiReadinessScore: document.querySelector("#kpiReadinessScore"),
    kpiPriority: document.querySelector("#kpiPriority"),
    readinessForm: document.querySelector("#readinessForm"),
    readinessFeedback: document.querySelector("#readinessFeedback"),
    readinessResult: document.querySelector("#readinessResult"),
    assessmentForm: document.querySelector("#assessmentForm"),
    questionList: document.querySelector("#questionList"),
    assessmentFeedback: document.querySelector("#assessmentFeedback"),
    assessmentResult: document.querySelector("#assessmentResult"),
    overallScore: document.querySelector("#overallScore"),
    riskBand: document.querySelector("#riskBand"),
    dimensionBars: document.querySelector("#dimensionBars"),
    actionPlan: document.querySelector("#actionPlan"),
    historyBody: document.querySelector("#historyBody"),
    exportPsychology: document.querySelector("#exportPsychology"),
    resetPsychology: document.querySelector("#resetPsychology")
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return Core.normalizeState(raw ? JSON.parse(raw) : Core.DEFAULT_STATE);
    } catch (error) {
      console.warn("Não foi possível carregar a trilha comportamental.", error);
      return Core.cloneState(Core.DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent("suzy:psychology-updated", { detail: Core.cloneState(state) }));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderLessons() {
    elements.lessonGrid.innerHTML = LESSONS.map((lesson, index) => {
      const done = state.lessonProgress.includes(lesson.id);
      return `
        <article class="lesson-card${done ? " done" : ""}">
          <span class="lesson-number">AULA ${index + 1}</span>
          <h3>${escapeHtml(lesson.title)}</h3>
          <p>${escapeHtml(lesson.text)}</p>
          <button type="button" data-lesson-id="${lesson.id}" aria-pressed="${done}">
            ${done ? "CONCLUÍDA — REABRIR" : "MARCAR COMO CONCLUÍDA"}
          </button>
        </article>`;
    }).join("");

    elements.lessonGrid.querySelectorAll("[data-lesson-id]").forEach(button => {
      button.addEventListener("click", () => toggleLesson(button.dataset.lessonId));
    });
  }

  function toggleLesson(lessonId) {
    const current = new Set(state.lessonProgress);
    if (current.has(lessonId)) current.delete(lessonId);
    else current.add(lessonId);
    state.lessonProgress = [...current];
    saveState();
    renderAll();
  }

  function renderQuestions() {
    elements.questionList.innerHTML = QUESTIONS.map((question, index) => `
      <fieldset class="question-card">
        <legend>${index + 1}. ${escapeHtml(question.text)}</legend>
        <div class="rating-options">
          ${RATING_LABELS.map((label, ratingIndex) => {
            const value = ratingIndex + 1;
            return `<label><input type="radio" name="${question.id}" value="${value}" required /> <span>${value} — ${label}</span></label>`;
          }).join("")}
        </div>
      </fieldset>`).join("");
  }

  function handleReadinessSubmit(event) {
    event.preventDefault();
    elements.readinessFeedback.textContent = "";

    if (!elements.readinessForm.reportValidity()) return;

    const checkIn = Core.evaluateReadiness({
      sleepQuality: document.querySelector("#sleepQuality").value,
      emotionalActivation: document.querySelector("#emotionalActivation").value,
      recoveryUrge: document.querySelector("#recoveryUrge").value,
      planClarity: document.querySelector("#planClarity").value,
      acceptsStop: document.querySelector("#acceptsStop").checked,
      recentRuleBreak: document.querySelector("#recentRuleBreak").checked
    });

    state.checkIns = Core.upsertDailyCheckIn(state.checkIns, checkIn);
    saveState();
    renderReadinessResult(checkIn);
    elements.readinessFeedback.textContent = "Check-in diário salvo neste navegador.";
    renderSummary();
    renderHistory();
  }

  function renderReadinessResult(checkIn) {
    if (!checkIn) {
      elements.readinessResult.hidden = true;
      return;
    }

    elements.readinessResult.hidden = false;
    elements.readinessResult.className = `result-panel ${checkIn.status.key}`;
    elements.readinessResult.innerHTML = `
      <strong>${escapeHtml(checkIn.status.label)} — ${checkIn.score.toFixed(1)} pontos</strong>
      <span>${escapeHtml(checkIn.status.guidance)}</span>`;
  }

  function handleAssessmentSubmit(event) {
    event.preventDefault();
    elements.assessmentFeedback.textContent = "";

    if (!elements.assessmentForm.reportValidity()) return;

    const data = new FormData(elements.assessmentForm);
    const answers = Object.fromEntries(QUESTIONS.map(question => [question.id, data.get(question.id)]));

    try {
      const assessment = Core.evaluateAssessment(answers, QUESTIONS);
      state.assessments = [assessment, ...state.assessments].slice(0, 24);
      saveState();
      renderAssessment(assessment);
      elements.assessmentFeedback.textContent = "Mapa comportamental atualizado e salvo localmente.";
      renderSummary();
    } catch (error) {
      elements.assessmentFeedback.textContent = error.message;
    }
  }

  function renderAssessment(assessment) {
    if (!assessment) {
      elements.assessmentResult.hidden = true;
      return;
    }

    elements.assessmentResult.hidden = false;
    elements.overallScore.textContent = assessment.overall.toFixed(0);
    elements.overallScore.setAttribute("aria-label", `Pontuação geral ${assessment.overall.toFixed(1)} de 100`);
    elements.riskBand.textContent = `${assessment.band.label}. A pontuação representa autorrelato educacional, não diagnóstico.`;

    elements.dimensionBars.innerHTML = Object.entries(assessment.scores).map(([dimension, score]) => {
      const definition = Core.DIMENSIONS[dimension];
      return `
        <div class="dimension-row">
          <span>${escapeHtml(definition.label)}</span>
          <div class="dimension-track" role="meter" aria-label="${escapeHtml(definition.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}">
            <div class="dimension-fill" style="width:${score}%"></div>
          </div>
          <span class="dimension-value">${score.toFixed(0)}</span>
        </div>`;
    }).join("");

    elements.actionPlan.innerHTML = assessment.actions.map(item => `
      <li><strong>${escapeHtml(item.label)} (${item.score.toFixed(0)}):</strong> ${escapeHtml(item.action)}</li>`).join("");

    elements.assessmentResult.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderSummary() {
    const completed = state.lessonProgress.filter(id => LESSONS.some(lesson => lesson.id === id)).length;
    const latestAssessment = state.assessments[0] || null;
    const today = Core.normalizeDateKey(new Date());
    const todayCheckIn = state.checkIns.find(item => item.date === today) || null;
    const streak = Core.calculateStreak(state.checkIns);

    elements.heroLessons.textContent = `${completed} / ${LESSONS.length}`;
    elements.heroStreak.textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;
    elements.heroRisk.textContent = latestAssessment ? latestAssessment.band.label.replace("Risco comportamental ", "") : "Sem avaliação";
    elements.kpiCheckIns.textContent = String(state.checkIns.length);
    elements.kpiAssessments.textContent = String(state.assessments.length);
    elements.kpiReadiness.textContent = todayCheckIn ? todayCheckIn.status.label : "Não avaliada";
    elements.kpiReadinessScore.textContent = todayCheckIn ? `${todayCheckIn.score.toFixed(1)} de 100` : "—";
    elements.kpiPriority.textContent = latestAssessment?.actions?.[0]?.label || "Sem dados";
    elements.lessonProgress.style.width = `${(completed / LESSONS.length) * 100}%`;
    elements.lessonProgress.parentElement.setAttribute("aria-valuenow", String(completed));
    elements.lessonProgress.parentElement.setAttribute("aria-valuemin", "0");
    elements.lessonProgress.parentElement.setAttribute("aria-valuemax", String(LESSONS.length));
    elements.lessonProgress.parentElement.setAttribute("role", "progressbar");

    renderReadinessResult(todayCheckIn);
  }

  function formatDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function renderHistory() {
    if (!state.checkIns.length) {
      elements.historyBody.innerHTML = '<tr><td colspan="4" class="empty-row">Nenhum check-in registrado.</td></tr>';
      return;
    }

    elements.historyBody.innerHTML = state.checkIns.slice(0, 14).map(checkIn => `
      <tr>
        <td>${formatDate(checkIn.date)}</td>
        <td>${checkIn.score.toFixed(1)} / 100</td>
        <td>${escapeHtml(checkIn.status.label)}</td>
        <td>${escapeHtml(checkIn.status.guidance)}</td>
      </tr>`).join("");
  }

  function exportState() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ...Core.cloneState(state)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `suzy-psicologia-${Core.normalizeDateKey(new Date())}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetState() {
    const confirmed = window.confirm("Apagar aulas concluídas, avaliações e check-ins comportamentais deste navegador?");
    if (!confirmed) return;
    state = Core.cloneState(Core.DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
    elements.assessmentForm.reset();
    elements.readinessForm.reset();
    elements.assessmentFeedback.textContent = "Dados comportamentais locais apagados.";
    elements.readinessFeedback.textContent = "";
    renderAll();
  }

  function renderAll() {
    renderLessons();
    renderSummary();
    renderHistory();
    renderAssessment(state.assessments[0] || null);
  }

  elements.readinessForm.addEventListener("submit", handleReadinessSubmit);
  elements.assessmentForm.addEventListener("submit", handleAssessmentSubmit);
  elements.exportPsychology.addEventListener("click", exportState);
  elements.resetPsychology.addEventListener("click", resetState);

  renderQuestions();
  renderAll();
})();