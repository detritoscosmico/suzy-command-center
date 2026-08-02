const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateProgress,
  canUnlockLesson,
  calculateEma,
  classifyTechnicalContext,
  calculateRiskReward,
  evaluateSetupChecklist,
  gradeAssessment,
  scorePractice,
  normalizeLevel2State,
  canOpenAssessment
} = require("../js/academy2-core.js");

function trendCandles(direction = "UP", count = 24) {
  const candles = [];
  let price = 100;
  const drift = direction === "UP" ? 1 : direction === "DOWN" ? -1 : 0;

  for (let index = 0; index < count; index += 1) {
    const open = price;
    const wave = direction === "SIDEWAYS" ? Math.sin(index) * 0.3 : 0;
    const close = open + drift + wave;
    candles.push({ open, close, high: Math.max(open, close) + 0.4, low: Math.min(open, close) - 0.4 });
    price = close;
  }

  return candles;
}

test("calcula progresso e desbloqueio sequencial", () => {
  const ids = ["a", "b", "c"];
  assert.deepEqual(calculateProgress(["a", "b"], 3), { completed: 2, total: 3, percent: 67 });
  assert.equal(canUnlockLesson(0, [], ids), true);
  assert.equal(canUnlockLesson(1, [], ids), false);
  assert.equal(canUnlockLesson(1, ["a"], ids), true);
});

test("calcula EMA sem alterar o tamanho da série", () => {
  const values = [1, 2, 3, 4, 5];
  const ema = calculateEma(values, 3);
  assert.equal(ema.length, values.length);
  assert.equal(ema[0], 1);
  assert.ok(ema.at(-1) > ema[0]);
});

test("classifica tendências artificiais de alta e baixa", () => {
  const up = classifyTechnicalContext(trendCandles("UP"));
  const down = classifyTechnicalContext(trendCandles("DOWN"));
  assert.equal(up.trend, "UP");
  assert.equal(down.trend, "DOWN");
  assert.ok(up.score >= 60);
  assert.ok(down.score >= 60);
});

test("recusa análise com amostra insuficiente", () => {
  const result = classifyTechnicalContext(trendCandles("UP", 8));
  assert.equal(result.trend, "INSUFFICIENT");
  assert.equal(result.score, 0);
});

test("calcula relação risco-retorno para compra e venda", () => {
  const long = calculateRiskReward({ entry: 100, stop: 98, target: 104, direction: "LONG" });
  const short = calculateRiskReward({ entry: 100, stop: 102, target: 96, direction: "SHORT" });
  assert.deepEqual(long, { valid: true, risk: 2, reward: 4, ratio: 2, reason: "" });
  assert.deepEqual(short, { valid: true, risk: 2, reward: 4, ratio: 2, reason: "" });
});

test("rejeita stop e alvo incompatíveis com a direção", () => {
  const invalid = calculateRiskReward({ entry: 100, stop: 101, target: 104, direction: "LONG" });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.ratio, 0);
});

test("aprova checklist completo e bloqueia risco contextual", () => {
  const complete = { context: true, zone: true, trigger: true, invalidation: true, risk: true };
  const approved = evaluateSetupChecklist(complete);
  const blocked = evaluateSetupChecklist({ ...complete, newsRisk: true });
  assert.equal(approved.approved, true);
  assert.equal(approved.score, 100);
  assert.equal(blocked.approved, false);
  assert.deepEqual(blocked.blockers, ["newsRisk"]);
});

test("corrige avaliação com nota mínima de 75 por cento", () => {
  const key = { q1: 0, q2: 1, q3: 2, q4: 3 };
  const pass = gradeAssessment({ q1: 0, q2: 1, q3: 2, q4: 0 }, key, 75);
  const fail = gradeAssessment({ q1: 0 }, key, 75);
  assert.equal(pass.score, 75);
  assert.equal(pass.passed, true);
  assert.equal(fail.score, 25);
  assert.equal(fail.passed, false);
});

test("avalia resposta do laboratório de contexto", () => {
  assert.deepEqual(scorePractice("up", "UP"), { correct: true, answer: "UP", expected: "UP" });
  assert.equal(scorePractice("DOWN", "SIDEWAYS").correct, false);
});

test("normaliza estado e remove aulas inexistentes", () => {
  const state = normalizeLevel2State({
    completed: ["a", "a", "invalida"],
    activeLesson: "invalida",
    bestScore: 120,
    attempts: -2,
    practiceAttempts: 7.8,
    practiceCorrect: 4.9
  }, ["a", "b"]);

  assert.deepEqual(state.completed, ["a"]);
  assert.equal(state.activeLesson, "a");
  assert.equal(state.bestScore, 100);
  assert.equal(state.attempts, 0);
  assert.equal(state.practiceAttempts, 7);
  assert.equal(state.practiceCorrect, 4);
});

test("libera avaliação somente após aulas e prática mínima", () => {
  const state = { completed: ["a", "b"], practiceAttempts: 5 };
  assert.equal(canOpenAssessment(state, 2, 5), true);
  assert.equal(canOpenAssessment({ ...state, practiceAttempts: 4 }, 2, 5), false);
  assert.equal(canOpenAssessment({ completed: ["a"], practiceAttempts: 5 }, 2, 5), false);
});
