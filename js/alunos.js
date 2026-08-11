(function () {
  "use strict";
  const STUDENT_KEY = "suzy-student-area-v1";
  const PROGRAM_KEY = "suzy-professional-program-v1";
  const KEYS = Object.freeze({ academy1: "suzy-academia-nivel1-v1", academy2: "suzy-academia-nivel2-v1", replay: "suzy-replay-lab-v2", replayLegacy: "suzy-replay-lab-v1", simulator: "suzy-order-simulator-v1", journal: "suzy-professional-journal-v1", psychology: "suzy_psychology_v1", risk: "suzy-risk-lab-v1", microstructure: "suzy-microstructure-lab-v1", capstone: "suzy-capstone-v1", governance: "suzy-governance-v1", data: "suzy-data-provenance-v1", calendar: "suzy.calendar.educational.v1", ethics: "suzy-ethics-regulation-v1", statistics: "suzy-statistics-probability-v1", economics: "suzy-economics-macro-v1", financials: "suzy-financial-statements-v1" });
  const $ = id => document.getElementById(id);
  let state = loadState();

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`Não foi possível ler ${key}.`, error);
      return fallback;
    }
  }

  function countArray(value) {
    return Array.isArray(value) ? value.length : 0;
  }

  function loadState() {
    return SuzyStudentCore.normalizeState(readJson(STUDENT_KEY, {}));
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STUDENT_KEY, JSON.stringify(state));
  }

  function collectEvidence() {
    const academy1 = readJson(KEYS.academy1, {});
    const academy2 = readJson(KEYS.academy2, {});
    const replay = readJson(KEYS.replay, null) || readJson(KEYS.replayLegacy, {});
    const simulator = readJson(KEYS.simulator, {});
    const journalEntries = (Array.isArray(readJson(KEYS.journal, [])) ? readJson(KEYS.journal, []) : []).map(SuzyJournalCore.normalizeJournalEntry).filter(Boolean);
    const journal = SuzyJournalCore.summarizeJournal(journalEntries);
    const psychology = SuzyPsychologyCore.normalizeState(readJson(KEYS.psychology, {}));
    return {
      academy1: { completed: countArray(academy1.completed), total: 6, passed: academy1.passed === true, bestScore: Number(academy1.bestScore) || 0 },
      academy2: { completed: countArray(academy2.completed), total: 8, passed: academy2.passed === true, bestScore: Number(academy2.bestScore) || 0 },
      replayTrades: SuzyReplayCore.summarizeReplay(Array.isArray(replay?.trades) ? replay.trades : []).total,
      simulatorTrades: SuzySimulatorCore.summarizeTrades(Array.isArray(simulator?.trades) ? simulator.trades : []).total,
      journal: { total: journal.total, adherence: journal.adherence, averageQuality: journal.averageQuality },
      psychology: { lessons: psychology.lessonProgress.length, assessments: psychology.assessments.length, checkIns: psychology.checkIns.length }
    };
  }

  function collectAdditional() {
    const governance = readJson(KEYS.governance, {});
    const data = readJson(KEYS.data, {});
    const calendar = readJson(KEYS.calendar, {});
    const ethics = SuzyEthicsCore.normalizeState(readJson(KEYS.ethics, {}));
    const statistics = SuzyStatisticsCore.normalizeState(readJson(KEYS.statistics, {}));
    const economics = SuzyEconomicsCore.normalizeState(readJson(KEYS.economics, {}));
    const financials = SuzyFinancialsCore.normalizeState(readJson(KEYS.financials, {}));
    return {
      risk: countArray(readJson(KEYS.risk, [])), microstructure: countArray(readJson(KEYS.microstructure, [])), capstone: countArray(readJson(KEYS.capstone, [])),
      governance: countArray(governance?.history), data: countArray(data?.manifests), calendar: SuzyStudentCore.countAuthorizedCalendarEvents(calendar),
      ethics: ethics.passed ? 1 : 0, statistics: statistics.passed ? 1 : 0, economics: economics.passed ? 1 : 0, financials: financials.passed ? 1 : 0
    };
  }

  function programResult(evidence) {
    const saved = readJson(PROGRAM_KEY, {});
    return SuzyProfessionalCore.evaluateProgram(evidence, saved?.plan || saved);
  }

  function renderModules(modules) {
    $("studentModules").innerHTML = modules.map(module => `<a class="module-card ${module.complete ? "complete" : ""}" href="${module.href}"><div><strong>${module.title}</strong><small>${module.detail}</small></div><span>${module.complete ? "CONCLUÍDO" : `${module.current}/${module.target}`}</span><div class="module-track" role="progressbar" aria-label="Progresso de ${module.title}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${module.percent}"><i style="width:${module.percent}%"></i></div></a>`).join("");
  }

  function renderTasks() {
    $("weeklyTasks").innerHTML = state.tasks.map(task => `<div class="weekly-task ${task.completed ? "done" : ""}"><input id="week-${task.id}" type="checkbox" data-task="${task.id}" aria-label="Concluir ${task.label}" ${task.completed ? "checked" : ""} /><label for="week-${task.id}"><strong>${task.label}</strong><small>${task.day} • ${task.minutes} minutos</small></label><a href="${task.href}">ABRIR</a></div>`).join("");
    document.querySelectorAll("[data-task]").forEach(input => input.addEventListener("change", () => {
      state = SuzyStudentCore.toggleTask(state, input.dataset.task, input.checked);
      saveState();
      render();
    }));
  }

  function renderAchievements(achievements) {
    $("achievementGrid").innerHTML = achievements.map(item => `<article class="achievement ${item.unlocked ? "unlocked" : ""}"><span aria-hidden="true">${item.unlocked ? "◆" : "◇"}</span><strong>${item.title}</strong><p>${item.description}</p></article>`).join("");
  }

  function renderAttendance() {
    const recent = [...state.attendance].reverse().slice(0, 30);
    $("attendanceHistory").innerHTML = recent.length ? recent.map(key => `<span>${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`))}</span>`).join("") : "<span>Nenhum dia registrado.</span>";
  }

  function render() {
    state = SuzyStudentCore.normalizeState(state);
    const evidence = collectEvidence();
    const program = programResult(evidence);
    const modules = SuzyStudentCore.buildModuleProgress(evidence, collectAdditional());
    const summary = SuzyStudentCore.summarize(program, state, modules);
    const achievements = SuzyStudentCore.deriveAchievements(program, state, modules);
    const name = state.profile.name;
    $("studentGreeting").textContent = name ? `Bom estudo, ${name}.` : "Sua evolução começa com processo.";
    $("studentStatus").textContent = name ? `${state.profile.goal} • ${state.profile.weeklyHours} horas planejadas por semana.` : "Configure seu perfil e siga a próxima evidência do programa.";
    $("heroProgramPercent").textContent = `${summary.programPercent}%`;
    $("heroProgramBar").style.width = `${summary.programPercent}%`;
    $("heroProgramBar").parentElement.setAttribute("aria-valuenow", String(summary.programPercent));
    $("heroProgramDetail").textContent = `${summary.completedStages} de ${summary.totalStages} gates concluídos`;
    $("nextStudentAction").href = summary.nextAction.href;
    $("nextStudentAction").textContent = summary.nextAction.label.toUpperCase();
    $("kpiModules").textContent = `${summary.completedModules}/${summary.totalModules}`;
    $("kpiWeek").textContent = `${summary.weeklyCompleted}/${summary.weeklyTotal}`;
    $("kpiStreak").textContent = `${summary.streak} ${summary.streak === 1 ? "dia" : "dias"}`;
    $("kpiAttendance").textContent = String(summary.attendanceTotal);
    $("weekLabel").textContent = `Semana de ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${state.weekKey}T12:00:00Z`))}`;
    $("markAttendance").disabled = state.attendance.includes(SuzyStudentCore.dateKey());
    $("studentName").value = state.profile.name;
    $("studentGoal").value = state.profile.goal;
    $("studentWeeklyHours").value = state.profile.weeklyHours;
    renderModules(modules); renderTasks(); renderAchievements(achievements); renderAttendance();
    return { evidence, program, modules, summary, achievements };
  }

  $("studentProfileForm").addEventListener("submit", event => {
    event.preventDefault();
    state.profile = SuzyStudentCore.normalizeProfile({ name: $("studentName").value, goal: $("studentGoal").value, weeklyHours: $("studentWeeklyHours").value, startDate: state.profile.startDate || SuzyStudentCore.dateKey() });
    saveState(); render();
    $("profileFeedback").textContent = "Perfil salvo somente neste navegador.";
    $("profileFeedback").className = "feedback wide success";
  });

  $("markAttendance").addEventListener("click", () => {
    state = SuzyStudentCore.markAttendance(state); saveState(); render();
    $("attendanceFeedback").textContent = "Estudo de hoje registrado. Consistência vale mais que pressa.";
    $("attendanceFeedback").className = "feedback success";
  });

  $("refreshStudentData").addEventListener("click", () => {
    render();
    $("attendanceFeedback").textContent = "Evidências locais atualizadas.";
    $("attendanceFeedback").className = "feedback success";
  });

  $("exportStudentReport").addEventListener("click", () => {
    const result = render();
    const report = { version: 1, exportedAt: new Date().toISOString(), notice: "Relatório educacional local. Não comprova certificação, habilitação profissional ou resultado financeiro.", profile: state.profile, summary: result.summary, attendance: state.attendance, weeklyTasks: state.tasks, modules: result.modules, achievements: result.achievements.filter(item => item.unlocked).map(item => item.id) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `suzy-area-aluno-${SuzyStudentCore.dateKey()}.json`; link.click(); URL.revokeObjectURL(url);
  });

  window.addEventListener("storage", () => { state = loadState(); render(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") render(); });
  render();
})();