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

test("monta progresso dos doze módulos com limites conservadores", () => {
  const modules = core.buildModuleProgress({
    academy1: { completed: 6, passed: true }, academy2: { completed: 2, passed: false },
    replayTrades: 50, simulatorTrades: 4, journal: { total: 20 },
    psychology: { lessons: 5, assessments: 1, checkIns: 7 }
  }, { risk: 3, microstructure: 1, capstone: 4, governance: 1, data: 1, calendar: 0 });
  assert.equal(modules.length, 12);
  assert.equal(modules.find(module => module.id === "replay").percent, 100);
  assert.equal(modules.find(module => module.id === "psychology").complete, true);
  assert.equal(modules.find(module => module.id === "calendar").complete, false);
});

test("resume rotina sem usar lucro ou taxa de acerto", () => {
  const state = core.normalizeState({ attendance: ["2026-08-08", "2026-08-09"], weekKey: "2026-08-03", tasks: [{ id: "foundation", completed: true }] }, "2026-08-09");
  const modules = core.buildModuleProgress({}, {});
  const summary = core.summarize({ percent: 25, completedStages: 1, totalStages: 5, pnl: 9999 }, state, modules, "2026-08-09");
  assert.equal(summary.programPercent, 25);
  assert.equal(summary.streak, 2);
  assert.equal(summary.pnl, undefined);
});
