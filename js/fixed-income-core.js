(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyFixedIncomeCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;

  const INTERPRETATIONS = Object.freeze(["CONSISTENT_MECHANISM", "RISK_OR_PREMISE_UNDERSTATED", "INSUFFICIENT_EVIDENCE"]);
  const DRIVERS = Object.freeze(["PRICE_YIELD", "TERM_STRUCTURE", "DURATION", "CONVEXITY", "CREDIT_SPREAD", "CREDIT_QUALITY", "INFLATION_INDEXATION", "REAL_NOMINAL", "MARK_TO_MARKET", "FLOATING_RATE", "LIQUIDITY", "CASH_FLOW_STRUCTURE"]);
  const ACTIONS = Object.freeze(["REPRICE_CASH_FLOWS", "SEPARATE_CURVE_FROM_FORECAST", "COMPARE_DURATION", "ADD_CONVEXITY", "CHECK_SPREAD_AND_ISSUER", "CHECK_CREDIT_RISK", "SEPARATE_REAL_NOMINAL", "CHECK_INDEXER_PATH", "CHECK_HOLDING_HORIZON", "IDENTIFY_INDEXER", "CHECK_LIQUIDITY", "MAP_CASH_FLOWS"]);

  const SOURCES = Object.freeze([
    { id: "BCB_SELIC", title: "Banco Central do Brasil — Taxa Selic", url: "https://www.bcb.gov.br/controleinflacao/taxaselic" },
    { id: "TREASURY_SECURITIES", title: "Tesouro Nacional — Títulos da Dívida Interna", url: "https://www.gov.br/tesouronacional/pt-br/divida-publica-federal/mercado-interno/titulos-da-divida-interna" },
    { id: "TREASURY_SECONDARY", title: "Tesouro Nacional — Mercado Secundário", url: "https://www.gov.br/tesouronacional/pt-br/divida-publica-federal/mercado-interno/mercado-secundario" },
    { id: "TESOURO_DIRETO", title: "Tesouro Direto — Regras e marcação a mercado", url: "https://tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento" },
    { id: "IBGE_IPCA", title: "IBGE — IPCA", url: "https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html" },
    { id: "CVM_RISK", title: "Portal do Investidor/CVM — Riscos dos investimentos", url: "https://www.gov.br/investidor/pt-br/investir/antes-de-investir/entenda-as-caracteristicas-dos-investimentos/risco-e-a-relacao-risco-x-retorno" },
    { id: "CVM_DEBENTURES", title: "Portal do Investidor/CVM — Debêntures", url: "https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/debentures" }
  ]);

  const CASES = Object.freeze([
    { id:"price-yield-inverse", title:"Preço cai quando a taxa exigida sobe", facts:["Um título prefixado mantém os mesmos fluxos contratuais.","A taxa exigida pelo mercado sobe de 10% para 12% ao ano.","Ao recalcular o valor presente, o preço do título cai."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"PRICE_YIELD", expectedAction:"REPRICE_CASH_FLOWS", expectedSource:"TREASURY_SECONDARY", severity:"NONE", explanation:"Com fluxos fixos, uma taxa de desconto maior reduz o valor presente. A relação preço–yield é central para entender marcação a mercado." },
    { id:"curve-guarantees-selic", title:"Curva inclinada não é profecia", facts:["A taxa curta é 11,5%, a intermediária 12,2% e a longa 12,9%.","Um relatório conclui que essa inclinação garante que a Selic subirá até 12,9%.","O relatório não separa prêmio de prazo, risco, oferta e demanda ou outras expectativas."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"TERM_STRUCTURE", expectedAction:"SEPARATE_CURVE_FROM_FORECAST", expectedSource:"TREASURY_SECONDARY", severity:"DETERMINISTIC_CURVE", explanation:"A estrutura a termo sintetiza preços e expectativas sob diversos prêmios e riscos. Ela não deve ser convertida em previsão determinística de uma taxa futura específica." },
    { id:"duration-long-bond", title:"Duration e sensibilidade a juros", facts:["Dois títulos têm crédito e yield semelhantes.","O primeiro vence em dois anos; o segundo concentra fluxos por dez anos.","O segundo apresenta duration maior e maior sensibilidade de preço a pequenos movimentos de taxa."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"DURATION", expectedAction:"COMPARE_DURATION", expectedSource:"TREASURY_SECONDARY", severity:"NONE", explanation:"Duration resume o prazo econômico dos fluxos e aproxima a sensibilidade do preço a pequenas mudanças de yield." },
    { id:"duration-only-large-shock", title:"Duration não é aproximação exata para choque grande", facts:["Um título tem duration modificada conhecida.","O cenário aplica choque de +300 pontos-base.","O relatório usa apenas a aproximação linear da duration e chama o resultado de preço exato."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"CONVEXITY", expectedAction:"ADD_CONVEXITY", expectedSource:"TREASURY_SECONDARY", severity:"DURATION_EXACT", explanation:"Duration é uma aproximação de primeira ordem. Para movimentos maiores, convexidade ajuda a capturar a curvatura da relação preço–yield." },
    { id:"credit-spread-widens", title:"Spread de crédito se amplia", facts:["Uma debênture continua com o mesmo fluxo prometido.","Os indicadores do emissor pioram e o spread exigido pelo mercado aumenta.","O preço secundário cai mesmo sem mudança no valor nominal contratual."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"CREDIT_SPREAD", expectedAction:"CHECK_SPREAD_AND_ISSUER", expectedSource:"CVM_DEBENTURES", severity:"NONE", explanation:"O preço de dívida corporativa incorpora risco de crédito. Um spread maior eleva a taxa exigida e reduz o valor presente dos fluxos." },
    { id:"fixed-income-no-credit-risk", title:"Renda fixa não elimina risco de crédito", facts:["Uma debênture promete remuneração definida em contrato.","O emissor enfrenta deterioração financeira relevante.","O relatório afirma que, por ser renda fixa, o pagamento é garantido e o risco de crédito é zero."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"CREDIT_QUALITY", expectedAction:"CHECK_CREDIT_RISK", expectedSource:"CVM_RISK", severity:"CREDIT_FREE", explanation:"Renda fixa descreve regras de remuneração e fluxo, não ausência de risco. O emissor pode não cumprir juros ou principal." },
    { id:"ipca-plus-real-rate", title:"Indexação à inflação e taxa real", facts:["Um título é remunerado pela variação do IPCA mais uma taxa real contratada.","O IPCA é o indexador de inflação do fluxo.","O valor nominal realizado depende da inflação observada e das regras do título."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"INFLATION_INDEXATION", expectedAction:"SEPARATE_REAL_NOMINAL", expectedSource:"IBGE_IPCA", severity:"NONE", explanation:"Em um título indexado ao IPCA, é essencial separar componente real e componente inflacionário e respeitar a regra exata do instrumento." },
    { id:"real-rate-is-nominal", title:"Taxa real não é retorno nominal isolado", facts:["Um relatório observa uma taxa real contratada em um título indexado ao IPCA.","Ele apresenta essa taxa real, sozinha, como retorno nominal garantido do período.","A trajetória do IPCA e a marcação a mercado são ignoradas."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"REAL_NOMINAL", expectedAction:"CHECK_INDEXER_PATH", expectedSource:"IBGE_IPCA", severity:"REAL_NOMINAL", explanation:"Taxa real e retorno nominal são conceitos diferentes. O componente de inflação e o horizonte de carregamento precisam ser explicitados." },
    { id:"early-sale-mark-to-market", title:"Resgate antecipado e marcação a mercado", facts:["Um Tesouro Prefixado foi adquirido para um vencimento distante.","Depois da compra, as taxas de mercado subiram.","O investidor considera vender antes do vencimento e o preço de recompra está abaixo do preço de compra."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"MARK_TO_MARKET", expectedAction:"CHECK_HOLDING_HORIZON", expectedSource:"TESOURO_DIRETO", severity:"NONE", explanation:"Antes do vencimento, o preço pode oscilar com as taxas de mercado. Venda antecipada transforma essa marcação em resultado realizado." },
    { id:"fixed-income-balance-never-falls", title:"Renda fixa não significa preço fixo", facts:["Um título prefixado tem taxa contratada no momento da compra.","O mercado passa a exigir taxa maior para o mesmo prazo.","O relatório afirma que o saldo de renda fixa não pode cair antes do vencimento."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"MARK_TO_MARKET", expectedAction:"CHECK_HOLDING_HORIZON", expectedSource:"TESOURO_DIRETO", severity:"NO_MARK_TO_MARKET", explanation:"A regra de remuneração pode ser conhecida, mas o preço de mercado varia. Prazo, fluxo e venda antes do vencimento importam." },
    { id:"lft-floating-rate", title:"Título pós-fixado e indexador", facts:["Uma LFT tem remuneração ligada à Selic over.","Um prefixado longo concentra maior exposição a uma taxa fixa contratada.","O relatório diferencia os instrumentos pelo indexador e pela sensibilidade de preço, sem dizer que algum é livre de risco."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"FLOATING_RATE", expectedAction:"IDENTIFY_INDEXER", expectedSource:"TREASURY_SECURITIES", severity:"NONE", explanation:"Antes de comparar títulos, identifique indexador, fluxos, prazo e forma de remuneração. Pós-fixado não significa ausência total de risco." },
    { id:"thin-secondary-market", title:"Liquidez também afeta a saída", facts:["Uma debênture tem poucos negócios no mercado secundário.","O spread entre ofertas de compra e venda aumenta.","O relatório trata qualquer desconto observado como prova definitiva de piora de crédito."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"LIQUIDITY", expectedAction:"CHECK_LIQUIDITY", expectedSource:"CVM_RISK", severity:"NONE", explanation:"Preço observado pode refletir crédito, liquidez e condições de mercado. Pouca liquidez dificulta separar esses efeitos sem evidência adicional." },
    { id:"coupon-cash-flow-structure", title:"Fluxo de caixa muda duration", facts:["Dois títulos têm o mesmo vencimento e yield.","Um paga cupons antes do vencimento; o outro concentra o principal no final.","O relatório reconhece que a distribuição temporal dos fluxos altera duration e sensibilidade."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"CASH_FLOW_STRUCTURE", expectedAction:"MAP_CASH_FLOWS", expectedSource:"TREASURY_SECURITIES", severity:"NONE", explanation:"Mesmo vencimento não implica mesma duration. Cupons antecipam parte dos fluxos e mudam o prazo econômico do título." }
  ]);

  function cleanText(value, maximum = 1000) { return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum); }
  function boundedNumber(value, minimum, maximum) { const number = Number(value); return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null; }
  function round(value, decimals = 4) { if (!Number.isFinite(value)) return null; const factor = 10 ** decimals; return Math.round((value + Number.EPSILON) * factor) / factor; }

  function validateBondInputs(candidate = {}) {
    const face = boundedNumber(candidate.face, 0.000001, 1e12);
    const couponRate = boundedNumber(candidate.couponRate, 0, 1000);
    const yieldRate = boundedNumber(candidate.yieldRate, -99.999, 1000);
    const years = boundedNumber(candidate.years, 0.000001, 100);
    const paymentsPerYearRaw = Number(candidate.paymentsPerYear);
    const paymentsPerYear = [1, 2, 4, 12].includes(paymentsPerYearRaw) ? paymentsPerYearRaw : null;
    const shockBp = boundedNumber(candidate.shockBp, -5000, 5000);
    if (face === null) return { valid:false, reason:"INVALID_FACE" };
    if (couponRate === null) return { valid:false, reason:"INVALID_COUPON" };
    if (yieldRate === null) return { valid:false, reason:"INVALID_YIELD" };
    if (years === null) return { valid:false, reason:"INVALID_YEARS" };
    if (paymentsPerYear === null) return { valid:false, reason:"INVALID_FREQUENCY" };
    if (shockBp === null) return { valid:false, reason:"INVALID_SHOCK" };
    const periodsRaw = years * paymentsPerYear;
    const periods = Math.round(periodsRaw);
    if (periods < 1 || Math.abs(periodsRaw - periods) > 1e-9) return { valid:false, reason:"NON_INTEGER_PERIOD_GRID" };
    const periodicYield = (yieldRate / 100) / paymentsPerYear;
    if (periodicYield <= -1) return { valid:false, reason:"INVALID_PERIODIC_YIELD" };
    return { valid:true, face, couponRate, yieldRate, years, paymentsPerYear, shockBp, periods, periodicYield };
  }

  function calculatePrice(input) {
    const coupon = input.face * (input.couponRate / 100) / input.paymentsPerYear;
    let price = 0;
    for (let period = 1; period <= input.periods; period += 1) {
      const cashFlow = coupon + (period === input.periods ? input.face : 0);
      price += cashFlow / ((1 + input.periodicYield) ** period);
    }
    return price;
  }

  function rawPriceFixedCouponBond(candidate = {}) {
    const input = validateBondInputs({ ...candidate, shockBp: candidate.shockBp ?? 0 });
    return input.valid ? calculatePrice(input) : null;
  }

  function priceFixedCouponBond(candidate = {}) {
    const price = rawPriceFixedCouponBond(candidate);
    return price === null ? null : round(price, 6);
  }

  function bondRiskMetrics(candidate = {}) {
    const input = validateBondInputs(candidate);
    if (!input.valid) return input;
    const coupon = input.face * (input.couponRate / 100) / input.paymentsPerYear;
    let price = 0, weightedTime = 0, convexityNumerator = 0;
    for (let period = 1; period <= input.periods; period += 1) {
      const cashFlow = coupon + (period === input.periods ? input.face : 0);
      const discount = (1 + input.periodicYield) ** period;
      const presentValue = cashFlow / discount;
      const timeYears = period / input.paymentsPerYear;
      price += presentValue;
      weightedTime += timeYears * presentValue;
      convexityNumerator += (cashFlow * period * (period + 1)) / ((input.paymentsPerYear ** 2) * ((1 + input.periodicYield) ** (period + 2)));
    }
    const macaulayDuration = weightedTime / price;
    const modifiedDuration = macaulayDuration / (1 + input.periodicYield);
    const convexity = convexityNumerator / price;
    const deltaYield = input.shockBp / 10000;
    const approximateChangePercent = (-modifiedDuration * deltaYield + 0.5 * convexity * (deltaYield ** 2)) * 100;
    const shockedYieldRate = input.yieldRate + (input.shockBp / 100);
    if (shockedYieldRate < -99.999 || shockedYieldRate > 1000) return { valid:false, reason:"INVALID_SHOCKED_YIELD" };
    const shockedPriceRaw = rawPriceFixedCouponBond({ face:input.face, couponRate:input.couponRate, yieldRate:shockedYieldRate, years:input.years, paymentsPerYear:input.paymentsPerYear });
    const exactChangePercent = shockedPriceRaw === null ? null : ((shockedPriceRaw / price) - 1) * 100;
    return { valid:true, face:input.face, couponRate:input.couponRate, yieldRate:input.yieldRate, years:input.years, paymentsPerYear:input.paymentsPerYear, shockBp:input.shockBp, price:round(price,2), macaulayDuration:round(macaulayDuration,4), modifiedDuration:round(modifiedDuration,4), convexity:round(convexity,4), approximateChangePercent:round(approximateChangePercent,4), shockedYieldRate:round(shockedYieldRate,4), shockedPrice:shockedPriceRaw===null?null:round(shockedPriceRaw,2), exactChangePercent:exactChangePercent===null?null:round(exactChangePercent,4) };
  }

  function classifyCurve(shortYield, mediumYield, longYield) {
    const short = boundedNumber(shortYield, -100, 1000), medium = boundedNumber(mediumYield, -100, 1000), long = boundedNumber(longYield, -100, 1000);
    if ([short, medium, long].some(value => value === null)) return { valid:false, reason:"INVALID_CURVE" };
    const range = Math.max(short, medium, long) - Math.min(short, medium, long);
    const longShortSpread = long - short;
    let shape = "HUMPED_OR_MIXED";
    if (range <= 0.25) shape = "FLAT";
    else if (short < medium && medium < long) shape = "UPWARD";
    else if (short > medium && medium > long) shape = "INVERTED";
    return { valid:true, shortYield:short, mediumYield:medium, longYield:long, longShortSpread:round(longShortSpread,2), shape };
  }

  function normalizeSeed(value) { const number = Number(value); return Number.isFinite(number) ? Math.abs(Math.trunc(number)) || 1 : 1; }
  function randomFactory(seed) { let state = normalizeSeed(seed) >>> 0; return function random(){ state += 0x6d2b79f5; let value=state; value=Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; }; }
  function createSession(seed=1,count=REQUIRED_CASES){ const normalizedSeed=normalizeSeed(seed); const random=randomFactory(normalizedSeed); const cases=[...CASES]; for(let index=cases.length-1;index>0;index-=1){const swapIndex=Math.floor(random()*(index+1));[cases[index],cases[swapIndex]]=[cases[swapIndex],cases[index]];} const size=Math.min(CASES.length,Math.max(1,Math.trunc(Number(count)||REQUIRED_CASES))); return {seed:normalizedSeed,cases:cases.slice(0,size)}; }
  function findCase(caseId){ return CASES.find(item=>item.id===caseId)||null; }
  function normalizeAnswer(candidate={}){ const interpretation=cleanText(candidate.interpretation,50),driver=cleanText(candidate.driver,60),action=cleanText(candidate.action,60),source=cleanText(candidate.source,60); return { interpretation:INTERPRETATIONS.includes(interpretation)?interpretation:"", driver:DRIVERS.includes(driver)?driver:"", action:ACTIONS.includes(action)?action:"", source:SOURCES.some(item=>item.id===source)?source:"", rationale:cleanText(candidate.rationale,1200) }; }
  function hardViolationFor(item,answer){ const acceptedInvalid=answer.interpretation==="CONSISTENT_MECHANISM" && item.expectedInterpretation!=="CONSISTENT_MECHANISM"; if(!acceptedInvalid)return{code:"",cap:100}; if(["CREDIT_FREE","REAL_NOMINAL","NO_MARK_TO_MARKET"].includes(item.severity))return{code:item.severity,cap:49}; if(["DETERMINISTIC_CURVE","DURATION_EXACT"].includes(item.severity))return{code:item.severity,cap:69}; return{code:"",cap:100}; }
  function gradeCase(caseId,candidateAnswer={}){ const item=findCase(caseId); if(!item)throw new Error("Caso de renda fixa desconhecido."); const answer=normalizeAnswer(candidateAnswer); const checks=[{id:"interpretation",label:"Leitura do mecanismo/limite",points:30,passed:answer.interpretation===item.expectedInterpretation},{id:"driver",label:"Fator dominante",points:25,passed:answer.driver===item.expectedDriver},{id:"action",label:"Próxima verificação",points:20,passed:answer.action===item.expectedAction},{id:"source",label:"Fonte primária/institucional",points:15,passed:answer.source===item.expectedSource},{id:"rationale",label:"Justificativa auditável",points:10,passed:answer.rationale.length>=60}]; let score=checks.reduce((total,check)=>total+(check.passed?check.points:0),0); const violation=hardViolationFor(item,answer); score=Math.min(score,violation.cap); return {caseId:item.id,score,passed:score>=PASS_SCORE&&!violation.code,hardViolation:violation.code,checks,explanation:item.explanation,expectedInterpretation:item.expectedInterpretation,expectedDriver:item.expectedDriver,expectedAction:item.expectedAction,expectedSource:item.expectedSource,answer}; }
  function normalizeAttempt(candidate={}){ const item=findCase(candidate.caseId); if(!item)return null; const grade=gradeCase(item.id,candidate.answer||{}); return {sessionId:cleanText(candidate.sessionId,120),seed:normalizeSeed(candidate.seed),caseId:item.id,timestamp:cleanText(candidate.timestamp,80)||new Date().toISOString(),answer:grade.answer,score:grade.score,passed:grade.passed,hardViolation:grade.hardViolation}; }
  function evaluateSession(attempts=[]){ const unique=[]; const seen=new Set(); for(const candidate of Array.isArray(attempts)?attempts:[]){const normalized=normalizeAttempt(candidate);if(!normalized||seen.has(normalized.caseId))continue;seen.add(normalized.caseId);unique.push(normalized);if(unique.length>=REQUIRED_CASES)break;} const completed=unique.length; const average=completed?round(unique.reduce((sum,attempt)=>sum+attempt.score,0)/completed,1):0; const hardViolations=unique.filter(attempt=>Boolean(attempt.hardViolation)).length; return {completed,required:REQUIRED_CASES,average,hardViolations,passed:completed>=REQUIRED_CASES&&average>=PASS_SCORE&&hardViolations===0}; }

  function groupSessions(history) {
    const sessions = new Map();
    history.forEach((attempt, index) => {
      if (!attempt.sessionId) return;
      if (!sessions.has(attempt.sessionId)) sessions.set(attempt.sessionId, []);
      sessions.get(attempt.sessionId).push({ attempt, index });
    });
    return sessions;
  }

  function selectSessionEvidence(entries) {
    const selected = [];
    const seenCases = new Set();
    for (const entry of entries) {
      if (seenCases.has(entry.attempt.caseId)) continue;
      seenCases.add(entry.attempt.caseId);
      selected.push(entry);
      if (selected.length === REQUIRED_CASES) break;
    }
    return selected;
  }

  function pruneHistory(history) {
    if (history.length <= MAX_HISTORY) return history;
    const sessions = [...groupSessions(history).values()];
    let bestSession = null;
    let latestPassingSession = null;

    for (const entries of sessions) {
      const evidence = selectSessionEvidence(entries);
      const evaluation = evaluateSession(evidence.map(entry => entry.attempt));
      if (evaluation.completed >= REQUIRED_CASES && (!bestSession || evaluation.average > bestSession.evaluation.average)) {
        bestSession = { evidence, evaluation };
      }
      if (evaluation.passed) latestPassingSession = { evidence, evaluation };
    }

    const preserveIndexes = new Set();
    for (const candidate of [bestSession, latestPassingSession]) {
      for (const entry of candidate?.evidence || []) preserveIndexes.add(entry.index);
    }

    const remainingSlots = MAX_HISTORY - preserveIndexes.size;
    const recentIndexes = [];
    for (let index = history.length - 1; index >= 0 && recentIndexes.length < remainingSlots; index -= 1) {
      if (!preserveIndexes.has(index)) recentIndexes.push(index);
    }
    const keepIndexes = [...preserveIndexes, ...recentIndexes].sort((a,b)=>a-b);
    return keepIndexes.map(index => history[index]);
  }

  function normalizeState(candidate={}){
    const normalizedHistory = Array.isArray(candidate.history) ? candidate.history.map(normalizeAttempt).filter(Boolean) : [];
    const history = pruneHistory(normalizedHistory);
    const sessions = groupSessions(history);
    let bestAverage=0,passed=false;
    for(const entries of sessions.values()){
      const evaluation=evaluateSession(entries.map(entry=>entry.attempt));
      if(evaluation.completed>=REQUIRED_CASES)bestAverage=Math.max(bestAverage,evaluation.average);
      if(evaluation.passed)passed=true;
    }
    return {version:1,lastSeed:normalizeSeed(candidate.lastSeed||20260822),history,bestAverage:round(bestAverage,1),passed};
  }

  function recordAttempt(stateCandidate={},attemptCandidate={}){ const state=normalizeState(stateCandidate); const attempt=normalizeAttempt(attemptCandidate); if(!attempt)return state; return normalizeState({...state,lastSeed:attempt.seed,history:[...state.history,attempt]}); }

  return Object.freeze({ PASS_SCORE,REQUIRED_CASES,MAX_HISTORY,INTERPRETATIONS,DRIVERS,ACTIONS,SOURCES,CASES,priceFixedCouponBond,bondRiskMetrics,classifyCurve,createSession,findCase,gradeCase,evaluateSession,normalizeState,recordAttempt });
});