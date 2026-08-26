const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/student-core.js");

test("normaliza perfil sem guardar campos estranhos", () => {
  const profile = core.normalizeProfile({ name: "  Danilo   Alves  ", goal: "Execução", weeklyHours: 99, email: "não@guardar.test", startDate: "2026-08-09" });
  assert.deepEqual(profile, { name: "Danilo Alves", goal: "Execução", weeklyHours: 40, startDate: "2026-08-09" });
  assert.equal(profile.email, undefined);
});

test("reinicia tarefas quando começa uma nova semana", () => {
  const previous = { weekKey: "2026-08-03", tasks: [{ id: "foundation", completed: true }] };
  const sameWeek = core.normalizeState(previous, "2026-08-09");
  assert.equal(sameWeek.tasks[0].completed, true);
  const nextWeek = core.normalizeState(previous, "2026-08-10");
  assert.equal(nextWeek.tasks.every(task => !task.completed), true);
  assert.equal(nextWeek.weekKey, "2026-08-10");
});

test("presença diária não duplica e calcula sequência", () => {
  let state = core.normalizeState({ attendance: ["2026-08-07", "2026-08-08"] }, "2026-08-09");
  state = core.markAttendance(state, "2026-08-09");
  state = core.markAttendance(state, "2026-08-09");
  assert.equal(state.attendance.length, 3);
  assert.equal(core.calculateStreak(state.attendance, "2026-08-09"), 3);
  assert.equal(core.calculateStreak(state.attendance, "2026-08-12"), 0);
});

test("monta progresso dos dezenove módulos com limites conservadores", () => {
  const modules = core.buildModuleProgress({
    academy1: { completed: 6, passed: true }, academy2: { completed: 2, passed: false },
    replayTrades: 50, simulatorTrades: 4, journal: { total: 20 }, psychology: { lessons: 5, assessments: 1, checkIns: 7 }
  }, { risk: 3, microstructure: 1, capstone: 4, governance: 1, data: 1, calendar: 0, ethics: 1, statistics: 1, economics: 1, financials: 1, valuation: 1, fixedIncome: 1, derivatives: 1 });
  assert.equal(modules.length, 19);
  assert.equal(modules.find(module => module.id === "replay").percent, 100);
  assert.equal(modules.find(module => module.id === "psychology").complete, true);
  assert.equal(modules.find(module => module.id === "calendar").complete, false);
  for (const id of ["ethics", "statistics", "economics", "financials", "valuation", "fixedIncome", "derivatives"]) assert.equal(modules.find(module => module.id === id).complete, true);
  assert.equal(modules.find(module => module.id === "fixedIncome").href, "renda-fixa.html");
  assert.equal(modules.find(module => module.id === "derivatives").href, "derivativos.html");
});

test("exige aprovação das academias mesmo com todas as aulas concluídas", () => {
  const modules = core.buildModuleProgress({ academy1: { completed: 6, passed: false }, academy2: { completed: 8, passed: false } });
  const academy1 = modules.find(module => module.id === "academy1"), academy2 = modules.find(module => module.id === "academy2");
  assert.equal(academy1.percent, 100); assert.equal(academy1.complete, false); assert.equal(academy1.detail, "Avaliação pendente"); assert.equal(academy2.complete, false);
});

test("aceita somente calendário autorizado como evidência", () => {
  const events = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(core.countAuthorizedCalendarEvents({ mode: "demo", authorized: false, events }), 0);
  assert.equal(core.countAuthorizedCalendarEvents({ mode: "authorized", authorized: false, events }), 0);
  assert.equal(core.countAuthorizedCalendarEvents({ mode: "authorized", authorized: true, events }), 3);
});

test("leva ações do playbook para a página do programa", () => {
  const summary = core.summarize({ nextAction: { label: "Plano operacional auditável", href: "#playbookTitle" } }, core.normalizeState({}, "2026-08-09"), [], "2026-08-09");
  assert.equal(summary.nextAction.href, "programa.html#playbookTitle");
});

test("mantém ação de revisão quando o passaporte está concluído", () => {
  const summary = core.summarize({ qualified: true, nextAction: null }, core.normalizeState({}, "2026-08-09"), [], "2026-08-09");
  assert.deepEqual(summary.nextAction, { label: "Revisar passaporte concluído", href: "programa.html#gatesTitle" });
});

test("resume rotina sem usar lucro ou taxa de acerto", () => {
  const state = core.normalizeState({ attendance: ["2026-08-08", "2026-08-09"], weekKey: "2026-08-03", tasks: [{ id: "foundation", completed: true }] }, "2026-08-09");
  const modules = core.buildModuleProgress({}, {});
  const summary = core.summarize({ percent: 25, completedStages: 1, totalStages: 5, pnl: 9999 }, state, modules, "2026-08-09");
  assert.equal(summary.programPercent, 25); assert.equal(summary.streak, 2); assert.equal(summary.pnl, undefined);
});
