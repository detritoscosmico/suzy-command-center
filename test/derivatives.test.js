const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/derivatives-core.js");

test("calcula payoff linear de futuro por direção, multiplicador e contratos", () => {
  assert.deepEqual(core.futuresPnl({ entryPrice:100000, exitPrice:100500, multiplier:0.2, contracts:2, side:"LONG" }), {
    valid:true, entryPrice:100000, exitPrice:100500, multiplier:0.2, contracts:2, side:"LONG", points:500, pnl:200
  });
  assert.equal(core.futuresPnl({ entryPrice:100000, exitPrice:100500, multiplier:0.2, contracts:2, side:"SHORT" }).pnl, -200);
});

test("calcula basis sem classificar divergência como erro", () => {
  const result = core.basisSnapshot({ spot:100000, future:100500 });
  assert.equal(result.valid, true);
  assert.equal(result.basis, 500);
  assert.equal(result.basisPercent, 0.5);
});

test("mapeia taxa DI para PU simplificado com relação inversa", () => {
  const low = core.diPuSnapshot({ annualRate:10, businessDays:252 });
  const high = core.diPuSnapshot({ annualRate:12, businessDays:252 });
  assert.equal(low.valid, true);
  assert.equal(high.valid, true);
  assert.ok(high.pu < low.pu);
  assert.equal(high.pu, 89285.71);
});

test("calcula payoff de call e put no vencimento", () => {
  const call = core.optionPayoff({ spot:110, strike:100, premium:5, type:"CALL", position:"LONG" });
  assert.equal(call.intrinsic, 10);
  assert.equal(call.netPerUnit, 5);
  const put = core.optionPayoff({ spot:90, strike:100, premium:4, type:"PUT", position:"LONG" });
  assert.equal(put.intrinsic, 10);
  assert.equal(put.netPerUnit, 6);
  const shortCall = core.optionPayoff({ spot:130, strike:100, premium:5, type:"CALL", position:"SHORT" });
  assert.equal(shortCall.netPerUnit, -25);
});

test("snapshot de opção fornece preço e Greeks finitos", () => {
  const result = core.blackScholesSnapshot({ spot:100, strike:100, annualRatePercent:10, volatilityPercent:25, days:30, type:"CALL" });
  assert.equal(result.valid, true);
  assert.equal(result.price, 3.275);
  assert.equal(result.intrinsic, 0);
  assert.equal(result.timeValue, 3.275);
  assert.equal(result.delta, 0.55982);
  assert.ok(result.gamma > 0);
  assert.ok(result.thetaPerDay < 0);
  assert.ok(result.vegaPerVolPoint > 0);
});

test("preserva componente temporal negativo sob taxa negativa no modelo europeu", () => {
  const result = core.blackScholesSnapshot({ spot:100, strike:50, annualRatePercent:-100, volatilityPercent:1, days:365, type:"CALL" });
  assert.equal(result.valid, true);
  assert.equal(result.price, 0);
  assert.equal(result.intrinsic, 50);
  assert.equal(result.timeValue, -50);
});

test("tolera preço negativo apenas por cancelamento numérico e normaliza para zero", () => {
  const result = core.blackScholesSnapshot({ spot:1, strike:10, annualRatePercent:0, volatilityPercent:100, days:30, type:"CALL" });
  assert.equal(result.valid, true);
  assert.equal(result.price, 0);
  assert.equal(result.intrinsic, 0);
  assert.equal(result.timeValue, 0);
});

test("rejeita entradas de modelo fora dos limites", () => {
  assert.equal(core.blackScholesSnapshot({ spot:0, strike:100, annualRatePercent:10, volatilityPercent:25, days:30, type:"CALL" }).valid, false);
  assert.equal(core.blackScholesSnapshot({ spot:100, strike:100, annualRatePercent:10, volatilityPercent:0, days:30, type:"CALL" }).valid, false);
  assert.equal(core.blackScholesSnapshot({ spot:100, strike:100, annualRatePercent:10, volatilityPercent:25, days:0, type:"CALL" }).valid, false);
});

test("calcula diferencial simples de duas pontas de swap", () => {
  const result = core.swapSimpleDifferential({ notional:1000000, receiveRate:13, payRate:12, years:1 });
  assert.equal(result.valid, true);
  assert.equal(result.receiveAmount, 130000);
  assert.equal(result.payAmount, 120000);
  assert.equal(result.net, 10000);
});

test("possui pelo menos doze casos e sessão reproduzível de seis variantes", () => {
  assert.ok(core.CASES.length >= 12);
  assert.deepEqual(core.createSession(42), core.createSession(42));
  assert.equal(core.createSession(42).cases.length, 6);
});

test("fontes são institucionais B3 ou Portal do Investidor", () => {
  const urls = core.SOURCES.map(source => new URL(source.url));
  assert.ok(urls.some(url => url.hostname === "www.b3.com.br"));
  assert.ok(urls.some(url => url.hostname === "www.gov.br" && url.pathname.startsWith("/investidor/")));
  assert.ok(core.SOURCES.length >= 8);
});

test("gabarito completo recebe 100 pontos", () => {
  const item = core.CASES[0];
  const grade = core.gradeCase(item.id, { interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Justificativa auditável com mais de sessenta caracteres, payoff, risco, fonte institucional e limite de modelo explicitados." });
  assert.equal(grade.score, 100);
  assert.equal(grade.passed, true);
  assert.equal(grade.hardViolation, "");
});

test("tratar margem como perda máxima gera violação dura e cap 49", () => {
  const item = core.findCase("margin-is-not-max-loss");
  const grade = core.gradeCase(item.id, { interpretation:"CONSISTENT_MECHANISM", driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Aceito que a margem depositada limita a perda máxima mesmo quando a exposição nocional e os ajustes diários são maiores." });
  assert.equal(grade.hardViolation, "MARGIN_CAPS_LOSS");
  assert.ok(grade.score <= 49);
});

test("tratar delta como probabilidade garantida gera violação dura", () => {
  const item = core.findCase("delta-is-probability");
  const grade = core.gradeCase(item.id, { interpretation:"CONSISTENT_MECHANISM", driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"Aceito delta como probabilidade garantida e fixa de terminar dentro do dinheiro independentemente das premissas e mudanças de mercado." });
  assert.equal(grade.hardViolation, "DELTA_PROBABILITY");
  assert.ok(grade.score <= 69);
});

test("estado alcança E3 com seis casos corretos e preserva aprovação na poda", () => {
  let state = {};
  const session = core.createSession(77);
  session.cases.forEach((item,index) => {
    state = core.recordAttempt(state, { sessionId:"derivatives-e3", seed:77, timestamp:new Date(Date.UTC(2026,7,22,15,index)).toISOString(), caseId:item.id, answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"A resposta mapeia payoff, fluxo de caixa, risco, fonte institucional e limite de modelo antes de qualquer conclusão operacional." } });
  });
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);

  const later = Array.from({ length:60 }, (_, index) => {
    const item = core.CASES[index % core.CASES.length];
    return { sessionId:`later-${Math.floor(index/6)}`, seed:100+index, timestamp:new Date(Date.UTC(2026,8,1,10,index)).toISOString(), caseId:item.id, answer:{ interpretation:"", driver:"", action:"", source:"", rationale:"incompleta" } };
  });
  state = core.normalizeState({ history:[...state.history, ...later] });
  assert.equal(state.history.length, core.MAX_HISTORY);
  assert.equal(state.passed, true);
  assert.equal(state.bestAverage, 100);
  assert.equal(state.history.filter(item => item.sessionId === "derivatives-e3").length, 6);
});
