(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyStudentCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TASK_DEFINITIONS = Object.freeze([
    { id: "foundation", label: "Revisar fundamentos", day: "Segunda", minutes: 30, href: "academia.html" },
    { id: "technical", label: "Praticar análise técnica", day: "Terça", minutes: 40, href: "academia-nivel2.html" },
    { id: "replay", label: "Executar sessão de replay", day: "Quarta", minutes: 45, href: "replay.html" },
    { id: "risk", label: "Revisar risco e dimensionamento", day: "Quinta", minutes: 30, href: "risco.html" },
    { id: "journal", label: "Atualizar o diário profissional", day: "Sexta", minutes: 20, href: "diario.html" },
    { id: "review", label: "Fazer revisão semanal", day: "Sábado", minutes: 30, href: "governanca.html" }
  ]);

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function cleanText(value, maximum) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function dateKey(value = new Date()) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const candidate = value.slice(0, 10);
      const parsed = new Date(`${candidate}T12:00:00Z`);
      return Number.isFinite(parsed.getTime()) ? candidate : "";
    }
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const pad = number => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function shiftDate(key, days) {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function weekKey(value = new Date()) {
    const key = dateKey(value);
    if (!key) return "";
    const date = new Date(`${key}T12:00:00Z`);
    const weekday = date.getUTCDay();
    const distanceToMonday = weekday === 0 ? -6 : 1 - weekday;
    return shiftDate(key, distanceToMonday);
  }

  function normalizeProfile(candidate = {}) {
    const goals = ["Formação completa", "Análise técnica", "Execução", "Gestão de risco", "Disciplina"];
    const goal = cleanText(candidate.goal, 40);
    return {
      name: cleanText(candidate.name, 60),
      goal: goals.includes(goal) ? goal : "Formação completa",
      weeklyHours: Math.round(clamp(candidate.weeklyHours ?? 5, 1, 40)),
      startDate: dateKey(candidate.startDate) || ""
    };
  }

  function createTasks(completed = {}) {
    return TASK_DEFINITIONS.map(definition => ({
      ...definition,
      completed: completed[definition.id] === true
    }));
  }

  function normalizeState(candidate = {}, today = new Date()) {
    const currentWeek = weekKey(today);
    const candidateTasks = Array.isArray(candidate.tasks) ? candidate.tasks : [];
    const completed = candidate.weekKey === currentWeek
      ? Object.fromEntries(candidateTasks.map(task => [String(task?.id || ""), task?.completed === true]))
      : {};
    const attendance = Array.isArray(candidate.attendance)
      ? [...new Set(candidate.attendance.map(dateKey).filter(Boolean))].sort().slice(-365)
      : [];
    return {
      version: 1,
      profile: normalizeProfile(candidate.profile),
      attendance,
      weekKey: currentWeek,
      tasks: createTasks(completed),
      updatedAt: cleanText(candidate.updatedAt, 40)
    };
  }

  function markAttendance(candidate, today = new Date()) {
    const state = normalizeState(candidate, today);
    const key = dateKey(today);
    if (key && !state.attendance.includes(key)) state.attendance.push(key);
    state.attendance = state.attendance.sort().slice(-365);
    return state;
  }

  function toggleTask(candidate, taskId, completed, today = new Date()) {
    const state = normalizeState(candidate, today);
    state.tasks = state.tasks.map(task => task.id === taskId ? { ...task, completed: completed === true } : task);
    return state;
  }

  function calculateStreak(attendance = [], today = new Date()) {
    const keys = [...new Set(attendance.map(dateKey).filter(Boolean))].sort();
    if (!keys.length) return 0;
    const reference = dateKey(today);
    const latest = keys[keys.length - 1];
    if (latest !== reference && latest !== shiftDate(reference, -1)) return 0;
    const set = new Set(keys);
    let streak = 0;
    let cursor = latest;
    while (set.has(cursor)) {
      streak += 1;
      cursor = shiftDate(cursor, -1);
    }
    return streak;
  }

  function progress(current, target) {
    return Math.round(clamp((Number(current) || 0) / Math.max(1, target), 0, 1) * 100);
  }

  function moduleItem(id, title, href, current, target, detail, completeOverride) {
    const percent = progress(current, target);
    const complete = typeof completeOverride === "boolean" ? completeOverride : percent === 100;
    return { id, title, href, current: Number(current) || 0, target, percent, complete, detail };
  }

  function academyDetail(academy, target) {
    if (academy.passed === true) return "Avaliação aprovada";
    return (Number(academy.completed) || 0) >= target ? "Avaliação pendente" : "Aulas concluídas";
  }

  function countAuthorizedCalendarEvents(snapshot = {}) {
    if (snapshot?.authorized !== true || snapshot?.mode !== "authorized") return 0;
    return Array.isArray(snapshot.events) ? snapshot.events.length : 0;
  }

  function buildModuleProgress(evidence = {}, additional = {}) {
    const academy1 = evidence.academy1 || {};
    const academy2 = evidence.academy2 || {};
    const journal = evidence.journal || {};
    const psychology = evidence.psychology || {};
    const psychologyCurrent = (Number(psychology.lessons) || 0) + (Number(psychology.assessments) || 0) + Math.min(7, Number(psychology.checkIns) || 0);
    return [
      moduleItem("academy1", "Fundamentos", "academia.html", academy1.passed ? 6 : academy1.completed, 6, academyDetail(academy1, 6), academy1.passed === true),
      moduleItem("academy2", "Análise técnica", "academia-nivel2.html", academy2.passed ? 8 : academy2.completed, 8, academyDetail(academy2, 8), academy2.passed === true),
      moduleItem("replay", "Replay", "replay.html", evidence.replayTrades, 20, "Operações encerradas"),
      moduleItem("simulator", "Custos e execução", "simulador.html", evidence.simulatorTrades, 10, "Operações simuladas"),
      moduleItem("journal", "Diário profissional", "diario.html", journal.total, 20, "Registros documentados"),
      moduleItem("psychology", "Disciplina", "psicologia.html", psychologyCurrent, 13, "Aulas, avaliação e check-ins"),
      moduleItem("risk", "Risco", "risco.html", additional.risk || 0, 3, "Cenários salvos"),
      moduleItem("microstructure", "Microestrutura", "microestrutura.html", additional.microstructure || 0, 3, "Execuções avaliadas"),
      moduleItem("capstone", "Capstone", "capstone.html", additional.capstone || 0, 4, "Casos decididos"),
      moduleItem("governance", "Governança", "governanca.html", additional.governance || 0, 1, "Versões auditáveis"),
      moduleItem("data", "Dados e proveniência", "dados.html", additional.data || 0, 1, "Manifestos registrados"),
      moduleItem("calendar", "Risco de eventos", "calendario.html", additional.calendar || 0, 1, "Eventos importados"),
      moduleItem("ethics", "Ética e regulação", "etica.html", additional.ethics || 0, 1, "Avaliação E3 aprovada"),
      moduleItem("statistics", "Estatística e amostras", "estatistica.html", additional.statistics || 0, 1, "Avaliação E3 aprovada")
    ];
  }

  function deriveAchievements(program = {}, state = {}, modules = []) {
    const completedTasks = (state.tasks || []).filter(task => task.completed).length;
    const definitions = [
      { id: "first-day", title: "Primeiro passo", description: "Registrou o primeiro dia de estudo.", unlocked: (state.attendance || []).length >= 1 },
      { id: "week-plan", title: "Semana organizada", description: "Concluiu todo o plano semanal.", unlocked: completedTasks === TASK_DEFINITIONS.length },
      { id: "foundation", title: "Base comprovada", description: "Concluiu o gate de fundamentos.", unlocked: (program.completedStages || 0) >= 1 },
      { id: "practice", title: "Prática deliberada", description: "Concluiu o gate de prática.", unlocked: (program.completedStages || 0) >= 2 },
      { id: "documented", title: "Processo documentado", description: "Completou o módulo do diário.", unlocked: modules.some(module => module.id === "journal" && module.complete) },
      { id: "passport", title: "Passaporte concluído", description: "Completou todos os gates profissionais.", unlocked: program.qualified === true }
    ];
    return definitions;
  }

  function summarize(program = {}, state = {}, modules = [], today = new Date()) {
    const completedTasks = (state.tasks || []).filter(task => task.completed).length;
    const nextAction = program.qualified === true
      ? { label: "Revisar passaporte concluído", href: "programa.html#gatesTitle" }
      : (program.nextAction || { label: "Começar pelos fundamentos", href: "academia.html" });
    const normalizedNextAction = {
      ...nextAction,
      href: String(nextAction.href || "academia.html").startsWith("#")
        ? `programa.html${nextAction.href}`
        : String(nextAction.href || "academia.html")
    };
    return {
      programPercent: Math.round(clamp(program.percent, 0, 100)),
      completedStages: Number(program.completedStages) || 0,
      totalStages: Number(program.totalStages) || 5,
      completedModules: modules.filter(module => module.complete).length,
      totalModules: modules.length,
      weeklyCompleted: completedTasks,
      weeklyTotal: TASK_DEFINITIONS.length,
      attendanceTotal: (state.attendance || []).length,
      streak: calculateStreak(state.attendance, today),
      nextAction: normalizedNextAction
    };
  }

  return {
    TASK_DEFINITIONS,
    dateKey,
    weekKey,
    normalizeProfile,
    normalizeState,
    markAttendance,
    toggleTask,
    calculateStreak,
    countAuthorizedCalendarEvents,
    buildModuleProgress,
    deriveAchievements,
    summarize
  };
});
