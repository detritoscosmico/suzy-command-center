const test = require("node:test");
const assert = require("node:assert/strict");
const {
  uniqueLessonIds,
  calculateProgress,
  gradeAssessment,
  canUnlockLesson,
  normalizeAcademyState
} = require("../js/academy-core.js");

const lessons = ["mentalidade", "mercados", "graficos", "risco", "plano", "validacao"];

test("remove aulas duplicadas e desconhecidas", () => {
  assert.deepEqual(
    uniqueLessonIds(["mentalidade", "mentalidade", "invalida", "mercados"], lessons),
    ["mentalidade", "mercados"]
  );
});

test("calcula o progresso do curso", () => {
  assert.deepEqual(calculateProgress(["a", "b", "b"], 6), {
    completed: 2,
    total: 6,
    percent: 33
  });
});

test("avalia a prova com nota mínima de setenta por cento", () => {
  const key = { q1: 1, q2: 2, q3: 0, q4: 3 };
  const approved = gradeAssessment({ q1: 1, q2: 2, q3: 0, q4: 3 }, key, 70);
  const rejected = gradeAssessment({ q1: 1, q2: 0, q3: 2, q4: 3 }, key, 70);

  assert.equal(approved.score, 100);
  assert.equal(approved.passed, true);
  assert.equal(rejected.score, 50);
  assert.equal(rejected.passed, false);
});

test("libera aulas em sequência", () => {
  assert.equal(canUnlockLesson(0, [], lessons), true);
  assert.equal(canUnlockLesson(1, [], lessons), false);
  assert.equal(canUnlockLesson(1, ["mentalidade"], lessons), true);
  assert.equal(canUnlockLesson(3, ["mentalidade", "mercados"], lessons), false);
});

test("normaliza o progresso salvo no navegador", () => {
  const state = normalizeAcademyState({
    completed: ["mentalidade", "invalida"],
    activeLesson: "mercados",
    bestScore: 130,
    attempts: 2.8,
    passed: 1
  }, lessons);

  assert.deepEqual(state.completed, ["mentalidade"]);
  assert.equal(state.activeLesson, "mercados");
  assert.equal(state.bestScore, 100);
  assert.equal(state.attempts, 2);
  assert.equal(state.passed, true);
});
