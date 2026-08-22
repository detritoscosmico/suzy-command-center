const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/fixed-income-core.js");

test("calcula preço, duration, convexidade e choque de yield", () => {
  const result = core.bondRiskMetrics({ face:1000, couponRate:10, yieldRate:12, years:5, paymentsPerYear:2, shockBp:100 });
  assert.equal(result.valid, true);
  assert.equal(result.price, 926.4);
  assert.equal(result.macaulayDuration, 4.0113);
  assert.equal(result.modifiedDuration, 3.7842);
  assert.equal(result.convexity, 18.1423);
  assert.equal(result.approximateChangePercent, -3.6935);
  assert.equal(result.exactChangePercent, -3.6951);
});

test("preço cai quando o yield sobe mantendo fluxos fixos", () => {
  const lowYield = core.priceFixedCouponBond({ face:1000, couponRate:10, yieldRate:10, years:5, paymentsPerYear:2 });
  const highYield = core.priceFixedCouponBond({ face:1000, couponRate:10, yieldRate:12, years:5, paymentsPerYear:2 });
  assert.ok(highYield < lowYield);
});

test("rejeita grade temporal incompatível com frequência de cupons", () => {
  const result = core.bondRiskMetrics({ face:1000, couponRate:10, yieldRate:12, years:1.3, paymentsPerYear:2, shockBp:100 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, "NON_INTEGER_PERIOD_GRID");
});

test("rejeita entradas fora dos limites em vez de truncá-las", () => {
  const base = { face:1000, couponRate:10, yieldRate:12, years:5, paymentsPerYear:2, shockBp:100 };
  assert.equal(core.bondRiskMetrics({ ...base, yieldRate:-100 }).reason, "INVALID_YIELD");
  assert.equal(core.bondRiskMetrics({ ...base, yieldRate:1000.01 }).reason, "INVALID_YIELD");
  assert.equal(core.bondRiskMetrics({ ...base, couponRate:1000.01 }).reason, "INVALID_COUPON");
  assert.equal(core.bondRiskMetrics({ ...base, years:100.01 }).reason, "INVALID_YEARS");
  assert.equal(core.bondRiskMetrics({ ...base, shockBp:5000.01 }).reason, "INVALID_SHOCK");
  assert.equal(core.classifyCurve(0, 0, 1000.01).valid, false);
});

test("reprecificação exata usa precisão integral antes de arredondar a exibição", () => {
  const result = core.bondRiskMetrics({ face:1000, couponRate:0, yieldRate:1000, years:10.25, paymentsPerYear:4, shockBp:0 });
  assert.equal(result.valid, true);
  assert.equal(result.exactChangePercent, 0);
});

test("rejeita métricas não finitas causadas por underflow numérico", () => {
  const result = core.bondRiskMetrics({ face:1000, couponRate:0, yieldRate:1000, years:100, paymentsPerYear:12, shockBp:0 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, "NUMERIC_RANGE");
});

test("classifica formas básicas da curva sem tratá-las como previsão", () => {
  assert.equal(core.classifyCurve(10,11,12).shape, "UPWARD");
  assert.equal(core.classifyCurve(12,11,10).shape, "INVERTED");
  assert.equal(core.classifyCurve(10,10.1,10.2).shape, "FLAT");
  assert.equal(core.classifyCurve(10,12,11).shape, "HUMPED_OR_MIXED");
});

test("possui pelo menos doze casos e sessão reproduzível de seis variantes", () => {
  assert.ok(core.CASES.length >= 12);
  assert.deepEqual(core.createSession(42), core.createSession(42));
  assert.equal(core.createSession(42).cases.length, 6);
});

test("fontes cobrem Tesouro, BCB, IBGE e Portal do Investidor/CVM", () => {
  const sources = core.SOURCES.map(source => new URL(source.url));
  assert.ok(sources.some(url => url.hostname === "www.bcb.gov.br"));
  assert.ok(sources.some(url => url.hostname === "www.gov.br" && url.pathname.startsWith("/tesouronacional/")));
  assert.ok(sources.some(url => url.hostname === "tesourodireto.com.br"));
  assert.ok(sources.some(url => url.hostname === "www.ibge.gov.br"));
  assert.ok(sources.some(url => url.hostname === "www.gov.br" && url.pathname.startsWith("/investidor/")));
});

test("gabarito completo recebe 100 pontos", () => {
  const item = core.CASES[0];
  const grade = core.gradeCase(item.id, { interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Justificativa auditável com mais de sessenta caracteres, mecanismo, fonte, risco e limites explicitamente documentados." });
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("negar risco de crédito gera violação dura e limita a nota", () => {
  const item = core.findCase("fixed-income-no-credit-risk");
  const grade = core.gradeCase(item.id, { interpretation:"CONSISTENT_MECHANISM", driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Aceito que renda fixa elimina risco de crédito apesar da deterioração financeira relevante do emissor descrita no caso." });
  assert.equal(grade.hardViolation, "CREDIT_FREE");
  assert.ok(grade.score <= 49);
});

test("tratar curva como previsão certa limita a nota", () => {
  const item = core.findCase("curve-guarantees-selic");
  const grade = core.gradeCase(item.id, { interpretation:"CONSISTENT_MECHANISM", driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Aceito a curva observada como previsão determinística da taxa futura mesmo sem decompor prêmio de prazo e outros fatores." });
  assert.equal(grade.hardViolation, "DETERMINISTIC_CURVE");
  assert.ok(grade.score <= 69);
});

test("estado recalcula aprovação E3 a partir das respostas", () => {
  let state = {};
  const session = core.createSession(77);
  session.cases.forEach((item,index) => {
    state = core.recordAttempt(state, { sessionId:"fixed-income-e3", seed:77, timestamp:new Date(Date.UTC(2026,7,22,15,index)).toISOString(), caseId:item.id, answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"A resposta reconcilia fluxo, taxa, risco, fonte institucional e limites antes de qualquer conclusão financeira ou operacional." } });
  });
  assert.equal(core.evaluateSession(state.history).passed, true);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
});

test("preserva evidência de uma sessão E3 aprovada ao podar histórico", () => {
  const passingSession = core.createSession(77).cases.map((item,index) => ({
    sessionId:"approved-old-session", seed:77, timestamp:new Date(Date.UTC(2026,6,1,10,index)).toISOString(), caseId:item.id,
    answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Resposta antiga aprovada que precisa permanecer auditável mesmo após muitas tentativas posteriores e poda de histórico." }
  }));
  const failing = Array.from({ length: 60 }, (_, index) => {
    const item = core.CASES[index % core.CASES.length];
    return { sessionId:`later-${Math.floor(index/6)}`, seed:100+index, timestamp:new Date(Date.UTC(2026,7,1,10,index)).toISOString(), caseId:item.id, answer:{ interpretation:"", driver:"", action:"", source:"", rationale:"tentativa posterior incompleta" } };
  });
  const state = core.normalizeState({ history:[...passingSession, ...failing] });
  assert.equal(state.history.length, core.MAX_HISTORY);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
  assert.equal(state.history.filter(attempt => attempt.sessionId === "approved-old-session").length, 6);
});

test("preserva a maior média histórica mesmo quando uma aprovação mais recente já está nas últimas sessenta tentativas", () => {
  const bestSession = core.createSession(77).cases.map((item,index) => ({
    sessionId:"best-old-session", seed:77, timestamp:new Date(Date.UTC(2026,5,1,10,index)).toISOString(), caseId:item.id,
    answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Sessão histórica de melhor média com resposta completa, auditável e sem violação dura para preservar a evidência da melhor pontuação." }
  }));
  const failing = Array.from({ length: 54 }, (_, index) => {
    const item = core.CASES[index % core.CASES.length];
    return { sessionId:`middle-${Math.floor(index/6)}`, seed:200+index, timestamp:new Date(Date.UTC(2026,6,1,10,index)).toISOString(), caseId:item.id, answer:{ interpretation:"", driver:"", action:"", source:"", rationale:"tentativa intermediária incompleta" } };
  });
  const recentPassing = core.createSession(88).cases.map((item,index) => ({
    sessionId:"recent-pass-80", seed:88, timestamp:new Date(Date.UTC(2026,7,1,10,index)).toISOString(), caseId:item.id,
    answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:"", source:item.expectedSource, rationale:"Sessão recente aprovada com oitenta pontos que deve coexistir com a evidência histórica da maior média anterior." }
  }));
  assert.equal(core.evaluateSession(recentPassing).average, 80);
  assert.equal(core.evaluateSession(recentPassing).passed, true);
  const state = core.normalizeState({ history:[...bestSession, ...failing, ...recentPassing] });
  assert.equal(state.history.length, core.MAX_HISTORY);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
  assert.equal(state.history.filter(attempt => attempt.sessionId === "best-old-session").length, 6);
  assert.equal(state.history.filter(attempt => attempt.sessionId === "recent-pass-80").length, 6);
});
