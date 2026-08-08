const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/governance-core.js");

function plan(overrides = {}) {
  return {
    market: "Forex — EUR/USD",
    setup: "Pullback a favor da estrutura",
    context: "Tendência definida e ausência de evento bloqueador",
    trigger: "Fechamento confirma retomada além da máxima de referência",
    invalidation: "Perda do fundo estrutural que sustenta a hipótese",
    riskPerTradePct: 0.5,
    dailyStopR: 2,
    maxTrades: 3,
    reviewRoutine: "Revisar aderência, execução e erros depois da sessão",
    acceptsUncertainty: true,
    ...overrides
  };
}

function meta(overrides = {}) {
  return { reason: "Criação da linha de base auditável para iniciar a governança.", timestamp: "2026-08-01T12:00:00Z", ...overrides };
}

test("valida o mesmo limite conservador do playbook profissional", () => {
  assert.equal(core.validatePlaybook(plan()).valid, true);
  assert.equal(core.validatePlaybook(plan({ riskPerTradePct: 2.5 })).valid, false);
  assert.equal(core.validatePlaybook(plan({ acceptsUncertainty: false })).valid, false);
});

test("fingerprint é estável para conteúdo equivalente", () => {
  assert.equal(core.fingerprintPlan(plan()), core.fingerprintPlan({ ...plan() }));
  assert.notEqual(core.fingerprintPlan(plan()), core.fingerprintPlan(plan({ maxTrades: 2 })));
});

test("primeira revisão cria linha de base com versão e fingerprint", () => {
  const result = core.createRevision(plan(), [], meta());
  assert.equal(result.revision.version, 1);
  assert.match(result.revision.id, /^v1-[0-9a-f]{8}$/);
  assert.equal(result.revision.changes.length, core.PLAN_FIELDS.length);
});

test("motivo de mudança é obrigatório e precisa ser explicativo", () => {
  assert.throws(() => core.createRevision(plan(), [], meta({ reason: "curto" })), /pelo menos 20/);
});

test("não cria versão nova quando o conteúdo não mudou", () => {
  const first = core.createRevision(plan(), [], meta());
  assert.throws(() => core.createRevision(plan(), first.history, meta({ timestamp: "2026-08-02T12:00:00Z" })), /não mudou/);
});

test("segunda revisão registra apenas campos efetivamente alterados", () => {
  const first = core.createRevision(plan(), [], meta());
  const second = core.createRevision(plan({ maxTrades: 2, riskPerTradePct: 0.4 }), first.history, meta({ reason: "Reduzir exposição após revisão formal do processo.", timestamp: "2026-08-02T12:00:00Z" }));
  assert.equal(second.revision.version, 2);
  assert.deepEqual(second.revision.changes.map(item => item.key), ["riskPerTradePct", "maxTrades"]);
});

test("comparação de versões mostra antes e depois sem P/L", () => {
  const first = core.createRevision(plan(), [], meta());
  const second = core.createRevision(plan({ dailyStopR: 1.5 }), first.history, meta({ reason: "Ajustar limite diário conforme revisão disciplinar documentada.", timestamp: "2026-08-02T12:00:00Z" }));
  const comparison = core.compareRevisions(first.revision, second.revision);
  assert.equal(comparison.changes.length, 1);
  assert.equal(comparison.changes[0].key, "dailyStopR");
  assert.equal(JSON.stringify(comparison).includes("profit"), false);
});

test("normalização remove versões duplicadas e inválidas", () => {
  const first = core.createRevision(plan(), [], meta()).revision;
  const history = core.normalizeHistory([first, first, { version: 2, timestamp: "inválida", plan: plan() }]);
  assert.equal(history.length, 1);
});

test("resumo periódico mede aderência, qualidade, erros e contexto", () => {
  const entries = [
    { timestamp: "2026-08-01T10:00:00Z", followedPlan: true, quality: 5, errorType: "Nenhum", market: "Forex", session: "Londres", rMultiple: 9 },
    { timestamp: "2026-08-02T10:00:00Z", followedPlan: false, quality: 3, errorType: "FOMO", market: "Forex", session: "Londres", rMultiple: -9 },
    { timestamp: "2026-07-20T10:00:00Z", followedPlan: true, quality: 1, errorType: "Fora", market: "Cripto", session: "Ásia" }
  ];
  const summary = core.summarizeProcessPeriod(entries, "2026-08-01", "2026-08-31");
  assert.equal(summary.total, 2);
  assert.equal(summary.adherence, 50);
  assert.equal(summary.averageQuality, 4);
  assert.deepEqual(summary.errors, [{ name: "FOMO", total: 1 }]);
  assert.deepEqual(summary.contexts, [{ name: "Forex • Londres", total: 2 }]);
});

test("resultado financeiro não altera resumo de processo", () => {
  const base = { timestamp: "2026-08-01T10:00:00Z", followedPlan: true, quality: 4, errorType: "Nenhum", market: "Forex", session: "Londres" };
  assert.deepEqual(core.summarizeProcessPeriod([{ ...base, rMultiple: 100 }]), core.summarizeProcessPeriod([{ ...base, rMultiple: -100 }]));
});

test("comparação de períodos é descritiva e não causal", () => {
  const result = core.compareProcessPeriods({ total: 10, adherence: 70, averageQuality: 3.5 }, { total: 12, adherence: 85, averageQuality: 4.2 });
  assert.deepEqual({ totalDelta: result.totalDelta, adherenceDelta: result.adherenceDelta, qualityDelta: result.qualityDelta }, { totalDelta: 2, adherenceDelta: 15, qualityDelta: 0.7 });
  assert.match(result.notice, /não provam causalidade/);
});
