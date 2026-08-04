const test = require("node:test");
const assert = require("node:assert/strict");
const {
  scoreDimension,
  riskBand,
  evaluateAssessment,
  buildActionPlan,
  evaluateReadiness,
  upsertDailyCheckIn,
  calculateStreak,
  normalizeState
} = require("../js/psychology-core.js");

const questions = [
  { id: "i1", dimension: "impulse" },
  { id: "i2", dimension: "impulse" },
  { id: "p1", dimension: "planAdherence", reverse: true },
  { id: "p2", dimension: "planAdherence", reverse: true },
  { id: "r1", dimension: "riskAcceptance", reverse: true },
  { id: "r2", dimension: "riskAcceptance", reverse: true }
];

test("calcula risco direto e reverso na escala de zero a cem", () => {
  assert.equal(scoreDimension([1, 1, 1]), 0);
  assert.equal(scoreDimension([5, 5, 5]), 100);
  assert.equal(scoreDimension([5, 5, 5], true), 0);
  assert.equal(scoreDimension([1, 1, 1], true), 100);
});

test("classifica as quatro faixas de risco comportamental", () => {
  assert.equal(riskBand(20).key, "low");
  assert.equal(riskBand(40).key, "moderate");
  assert.equal(riskBand(70).key, "high");
  assert.equal(riskBand(90).key, "very-high");
});

test("avalia dimensões diretas e protetivas com plano prioritário", () => {
  const result = evaluateAssessment({
    i1: 5,
    i2: 4,
    p1: 2,
    p2: 1,
    r1: 5,
    r2: 5
  }, questions);

  assert.equal(result.scores.impulse, 87.5);
  assert.equal(result.scores.planAdherence, 87.5);
  assert.equal(result.scores.riskAcceptance, 0);
  assert.equal(result.overall, 58.3);
  assert.equal(result.band.key, "high");
  assert.equal(result.actions.length, 3);
  assert.equal(result.actions[0].score, 87.5);
});

test("exige resposta para todas as afirmações", () => {
  assert.throws(
    () => evaluateAssessment({ i1: 3 }, questions),
    /Responda todas/
  );
});

test("ordena plano de ação pelas dimensões de maior risco", () => {
  const actions = buildActionPlan({
    impulse: 30,
    lossReaction: 90,
    patience: 60,
    riskAcceptance: 20
  });

  assert.deepEqual(actions.map(item => item.dimension), ["lossReaction", "patience", "impulse"]);
});

test("classifica prontidão adequada, reduzida, pausa e encerramento", () => {
  const ready = evaluateReadiness({
    sleepQuality: 5,
    emotionalActivation: 1,
    recoveryUrge: 1,
    planClarity: 5,
    acceptsStop: true,
    recentRuleBreak: false,
    date: "2026-08-04"
  });
  assert.equal(ready.score, 0);
  assert.equal(ready.status.key, "ready");

  const reduced = evaluateReadiness({
    sleepQuality: 3,
    emotionalActivation: 3,
    recoveryUrge: 3,
    planClarity: 3,
    acceptsStop: true,
    recentRuleBreak: false
  });
  assert.equal(reduced.status.key, "reduced");

  const pause = evaluateReadiness({
    sleepQuality: 2,
    emotionalActivation: 4,
    recoveryUrge: 4,
    planClarity: 2,
    acceptsStop: false,
    recentRuleBreak: false
  });
  assert.equal(pause.status.key, "pause");

  const stop = evaluateReadiness({
    sleepQuality: 1,
    emotionalActivation: 5,
    recoveryUrge: 5,
    planClarity: 1,
    acceptsStop: false,
    recentRuleBreak: true
  });
  assert.equal(stop.score, 100);
  assert.equal(stop.status.key, "stop");
});

test("substitui check-in do mesmo dia e limita o histórico", () => {
  const first = { id: "a", date: "2026-08-04", createdAt: "2026-08-04T10:00:00.000Z" };
  const replacement = { id: "b", date: "2026-08-04", createdAt: "2026-08-04T12:00:00.000Z" };
  const result = upsertDailyCheckIn([first], replacement);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "b");
});

test("calcula sequência de check-ins consecutivos até a data de referência", () => {
  const checkIns = [
    { date: "2026-08-04" },
    { date: "2026-08-03" },
    { date: "2026-08-02" },
    { date: "2026-07-30" }
  ];

  assert.equal(calculateStreak(checkIns, new Date("2026-08-04T12:00:00")), 3);
});

test("normaliza estado removendo progresso duplicado e dados inválidos", () => {
  const state = normalizeState({
    lessonProgress: ["lesson-1", "lesson-1", "", null],
    assessments: [{ id: "bad", createdAt: "inválida" }],
    checkIns: [{ id: "bad", createdAt: "inválida" }]
  });

  assert.deepEqual(state.lessonProgress, ["lesson-1"]);
  assert.deepEqual(state.assessments, []);
  assert.deepEqual(state.checkIns, []);
});