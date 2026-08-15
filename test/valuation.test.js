const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/valuation-core.js");

test("calcula DCF educacional e reconcilia enterprise value até equity", () => {
  const result = core.summarizeValuationSnapshot({ fcf1:100, fcf2:110, fcf3:120, discountRate:10, terminalGrowth:3, netDebt:200, dilutedShares:100 });
  assert.equal(result.valid, true);
  assert.equal(result.enterpriseValue, 1598.58);
  assert.equal(result.equityValue, 1398.58);
  assert.equal(result.valuePerShare, 13.99);
  assert.equal(result.terminalWeight, 83);
});

test("rejeita crescimento terminal igual ou superior à taxa de desconto", () => {
  assert.equal(core.terminalValueGordon(100, 8, 8), null);
  assert.equal(core.terminalValueGordon(100, 8, 9), null);
  assert.equal(core.summarizeValuationSnapshot({ fcf1:100, fcf2:100, fcf3:100, discountRate:8, terminalGrowth:9, netDebt:0, dilutedShares:10 }).valid, false);
});

test("possui doze casos e sessão reproduzível de seis variantes", () => {
  assert.equal(core.CASES.length, 12);
  assert.deepEqual(core.createSession(42), core.createSession(42));
  assert.equal(core.createSession(42).cases.length, 6);
});

test("gabarito completo recebe 100 pontos", () => {
  const item = core.CASES[0];
  const grade = core.gradeCase(item.id, { interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Justificativa auditável com mais de sessenta caracteres, premissas explícitas e limites documentados." });
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("confundir enterprise value com equity value gera violação dura", () => {
  const item = core.findCase("debt-reconciliation");
  const grade = core.gradeCase(item.id, { interpretation:"REASONABLE_RANGE", driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Vou tratar enterprise value como valor do patrimônio sem reconciliar dívida líquida apesar da estrutura de capital descrita." });
  assert.equal(Boolean(grade.hardViolation), true);
  assert.ok(grade.score <= 49);
});

test("estado recalcula aprovação a partir das respostas", () => {
  let state = {};
  const session = core.createSession(77);
  session.cases.forEach((item, index) => {
    state = core.recordAttempt(state, { sessionId:"valuation-e3", seed:77, timestamp:new Date(Date.UTC(2026,7,15,15,index)).toISOString(), caseId:item.id, answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"A resposta documenta premissas, sensibilidade, reconciliação e limitações antes de qualquer conclusão de valor." } });
  });
  assert.equal(core.evaluateSession(state.history).passed, true);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
});
