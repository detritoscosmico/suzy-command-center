(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyValuationCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;

  const INTERPRETATIONS = Object.freeze(["REASONABLE_RANGE", "OVERSTATED_ASSUMPTIONS", "INSUFFICIENT_EVIDENCE"]);
  const DRIVERS = Object.freeze([
    "DISCOUNT_RATE", "TERMINAL_GROWTH", "MARGIN_ASSUMPTION", "CAPITAL_STRUCTURE",
    "CYCLICAL_EARNINGS", "COMPARABILITY", "NONRECURRING_ITEM", "NEGATIVE_FCF",
    "TERMINAL_VALUE_WEIGHT", "UNIT_MISMATCH", "DILUTION", "SCENARIO_SENSITIVITY"
  ]);
  const ACTIONS = Object.freeze([
    "RUN_SENSITIVITY", "RECALCULATE_WACC", "NORMALIZE_MARGIN", "RECONCILE_NET_DEBT",
    "NORMALIZE_CYCLE", "REBUILD_PEER_SET", "REMOVE_NONRECURRING", "CHECK_FCF_PATH",
    "EXTEND_EXPLICIT_PERIOD", "RECONCILE_EV_EQUITY", "CHECK_DILUTED_SHARES", "USE_SCENARIO_RANGE"
  ]);
  const SOURCES = Object.freeze([
    { id: "CVM_FILINGS", title: "CVM — informações periódicas de companhias", url: "https://www.gov.br/cvm/pt-br/assuntos/regulados/consultas-por-participante/companhias" },
    { id: "CPC_FINANCIALS", title: "CPC — pronunciamentos contábeis", url: "https://www.cpc.org.br/CPC/Documentos-Emitidos/Pronunciamentos" },
    { id: "IFRS_FINANCIALS", title: "IFRS Foundation — issued standards", url: "https://www.ifrs.org/issued-standards/list-of-standards/" },
    { id: "BCB_SELIC", title: "Banco Central do Brasil — Taxa Selic", url: "https://www.bcb.gov.br/controleinflacao/taxaselic" }
  ]);

  const CASES = Object.freeze([
    { id:"low-discount-rate", title:"Taxa de desconto comprimida", facts:["O DCF usa taxa de desconto de 5% para um negócio cíclico e alavancado.","O cenário não documenta prêmio de risco nem custo da dívida.","Pequena elevação da taxa reduz materialmente o valor presente."], expectedInterpretation:"OVERSTATED_ASSUMPTIONS", expectedDriver:"DISCOUNT_RATE", expectedAction:"RECALCULATE_WACC", expectedSource:"BCB_SELIC", severity:"OVERCONFIDENT", explanation:"A taxa de desconto precisa refletir risco e estrutura de capital. Sem premissas documentadas, uma taxa excessivamente baixa pode inflar o valor presente." },
    { id:"terminal-growth-high", title:"Crescimento terminal agressivo", facts:["O modelo assume crescimento perpétuo de 9%.","A taxa de desconto é 10%.","O valor terminal representa a maior parte do enterprise value."], expectedInterpretation:"OVERSTATED_ASSUMPTIONS", expectedDriver:"TERMINAL_GROWTH", expectedAction:"RUN_SENSITIVITY", expectedSource:"BCB_SELIC", severity:"OVERCONFIDENT", explanation:"Quando crescimento terminal se aproxima da taxa de desconto, o valor fica extremamente sensível. O correto é testar faixas economicamente defensáveis." },
    { id:"margin-recovery", title:"Margem projetada acima do histórico", facts:["A margem operacional histórica variou entre 8% e 11%.","O caso-base assume 18% em três anos.","Não há evidência de mudança estrutural suficiente no caso apresentado."], expectedInterpretation:"OVERSTATED_ASSUMPTIONS", expectedDriver:"MARGIN_ASSUMPTION", expectedAction:"NORMALIZE_MARGIN", expectedSource:"CVM_FILINGS", severity:"OVERCONFIDENT", explanation:"Expansão de margem precisa ser ligada a evidência operacional. Sem isso, normalizar margens e testar sensibilidade é mais defensável." },
    { id:"debt-reconciliation", title:"Enterprise value sem reconciliação da dívida", facts:["O DCF estima enterprise value.","A conclusão é apresentada diretamente como valor do patrimônio.","A companhia possui dívida líquida relevante."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"CAPITAL_STRUCTURE", expectedAction:"RECONCILE_NET_DEBT", expectedSource:"CVM_FILINGS", severity:"EV_EQUITY_CONFUSION", explanation:"Enterprise value e equity value não são intercambiáveis. Dívida líquida e outros ajustes precisam ser reconciliados antes de chegar ao valor do patrimônio." },
    { id:"cyclical-peak", title:"Múltiplo barato no pico do ciclo", facts:["A companhia negocia a 5x lucro corrente.","Margens e preços de venda estão próximos de máximas históricas.","O setor é fortemente cíclico."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"CYCLICAL_EARNINGS", expectedAction:"NORMALIZE_CYCLE", expectedSource:"CVM_FILINGS", severity:"NO_DETERMINISTIC", explanation:"Múltiplo baixo em pico cíclico pode refletir lucro temporariamente elevado. É necessário normalizar ciclo e margens antes de concluir." },
    { id:"peer-mismatch", title:"Comparáveis com modelos econômicos distintos", facts:["A empresa é comparada com três pares de margens, crescimento e alavancagem muito diferentes.","O múltiplo mediano é aplicado sem ajustes.","Não há justificativa para o conjunto de comparáveis."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"COMPARABILITY", expectedAction:"REBUILD_PEER_SET", expectedSource:"CVM_FILINGS", severity:"NO_DETERMINISTIC", explanation:"Valuation relativo depende de comparabilidade econômica. O conjunto de pares deve ser reconstruído ou ajustado antes de interpretar o múltiplo." },
    { id:"one-off-ebitda", title:"EBITDA inflado por item não recorrente", facts:["O EBITDA usado no múltiplo inclui ganho extraordinário.","O ganho não aparece na operação recorrente.","O múltiplo EV/EBITDA parece baixo após o evento."], expectedInterpretation:"OVERSTATED_ASSUMPTIONS", expectedDriver:"NONRECURRING_ITEM", expectedAction:"REMOVE_NONRECURRING", expectedSource:"CPC_FINANCIALS", severity:"OVERCONFIDENT", explanation:"Itens não recorrentes precisam ser normalizados para evitar um denominador artificialmente elevado e um múltiplo artificialmente baixo." },
    { id:"negative-fcf-expansion", title:"FCF negativo durante expansão", facts:["O FCF é negativo por dois anos devido a capex de expansão.","A capacidade instalada deve aumentar.","O caso não mostra retorno incremental nem trajetória posterior de caixa."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"NEGATIVE_FCF", expectedAction:"CHECK_FCF_PATH", expectedSource:"CPC_FINANCIALS", severity:"NO_DETERMINISTIC", explanation:"FCF negativo por expansão não implica destruição de valor automaticamente. É preciso avaliar retorno, maturação e trajetória de caixa." },
    { id:"terminal-heavy", title:"Valor terminal domina o DCF", facts:["O valor terminal representa 88% do enterprise value.","O período explícito tem apenas três anos.","As premissas de longo prazo são incertas."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"TERMINAL_VALUE_WEIGHT", expectedAction:"EXTEND_EXPLICIT_PERIOD", expectedSource:"IFRS_FINANCIALS", severity:"NO_DETERMINISTIC", explanation:"Quanto maior o peso do valor terminal, maior a dependência de hipóteses de longo prazo. Alongar o período explícito e testar sensibilidades reduz a falsa precisão." },
    { id:"ev-equity-multiple", title:"EV/EBITDA comparado com preço por ação", facts:["O analista calcula EV/EBITDA dos pares.","Depois aplica diretamente o resultado ao preço por ação sem reconciliar dívida, caixa e ações.","A estrutura de capital é relevante."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"UNIT_MISMATCH", expectedAction:"RECONCILE_EV_EQUITY", expectedSource:"CVM_FILINGS", severity:"EV_EQUITY_CONFUSION", explanation:"Múltiplos de enterprise value precisam ser convertidos até equity value antes de chegar a valor por ação." },
    { id:"dilution", title:"Diluição ignorada", facts:["A empresa possui opções e instrumentos potencialmente dilutivos relevantes.","O modelo usa apenas ações básicas.","O valor total do patrimônio é dividido por uma base subestimada de ações."], expectedInterpretation:"OVERSTATED_ASSUMPTIONS", expectedDriver:"DILUTION", expectedAction:"CHECK_DILUTED_SHARES", expectedSource:"CVM_FILINGS", severity:"OVERCONFIDENT", explanation:"Ignorar diluição pode elevar artificialmente o valor por ação. A base de ações precisa ser reconciliada e documentada." },
    { id:"scenario-range", title:"Cenários convergem em faixa estreita", facts:["Três cenários independentes usam premissas conservadora, base e otimista.","As diferenças são documentadas e a sensibilidade permanece moderada.","O resultado é comunicado como faixa, não como preço futuro garantido."], expectedInterpretation:"REASONABLE_RANGE", expectedDriver:"SCENARIO_SENSITIVITY", expectedAction:"USE_SCENARIO_RANGE", expectedSource:"CVM_FILINGS", severity:"NONE", explanation:"Uma faixa com premissas explícitas e sensibilidade controlada é mais defensável do que um único número apresentado com falsa precisão." }
  ]);

  function cleanText(value, maximum = 1000) { return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum); }
  function finiteNumber(value, minimum = -1e15, maximum = 1e15) { const n = Number(value); return Number.isFinite(n) ? Math.min(maximum, Math.max(minimum, n)) : 0; }
  function normalizeRate(value) { return finiteNumber(value, -99.99, 1000) / 100; }
  function safeDivide(n, d) { return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null; }

  function presentValue(amount, ratePercent, periods) {
    const amountN = finiteNumber(amount);
    const rate = normalizeRate(ratePercent);
    const n = Math.max(0, Math.trunc(finiteNumber(periods, 0, 100)));
    const denominator = Math.pow(1 + rate, n);
    return denominator > 0 ? Number((amountN / denominator).toFixed(2)) : null;
  }

  function terminalValueGordon(fcf, discountRatePercent, growthRatePercent) {
    const cashFlow = finiteNumber(fcf);
    const discount = normalizeRate(discountRatePercent);
    const growth = normalizeRate(growthRatePercent);
    if (discount <= growth || discount <= -1 || growth <= -1) return null;
    return Number(((cashFlow * (1 + growth)) / (discount - growth)).toFixed(2));
  }

  function summarizeValuationSnapshot(candidate = {}) {
    const fcf1 = finiteNumber(candidate.fcf1);
    const fcf2 = finiteNumber(candidate.fcf2);
    const fcf3 = finiteNumber(candidate.fcf3);
    const discountRate = finiteNumber(candidate.discountRate, 0.01, 1000);
    const terminalGrowth = finiteNumber(candidate.terminalGrowth, -99, 999);
    const netDebt = finiteNumber(candidate.netDebt);
    const dilutedShares = finiteNumber(candidate.dilutedShares, 0.000001, 1e12);
    const pv1 = presentValue(fcf1, discountRate, 1);
    const pv2 = presentValue(fcf2, discountRate, 2);
    const pv3 = presentValue(fcf3, discountRate, 3);
    const terminal = terminalValueGordon(fcf3, discountRate, terminalGrowth);
    if (terminal === null) return { valid:false, reason:"DISCOUNT_NOT_ABOVE_GROWTH", fcf1, fcf2, fcf3, discountRate, terminalGrowth, netDebt, dilutedShares };
    const pvTerminal = presentValue(terminal, discountRate, 3);
    const enterpriseValue = Number((pv1 + pv2 + pv3 + pvTerminal).toFixed(2));
    const equityValue = Number((enterpriseValue - netDebt).toFixed(2));
    const valuePerShare = Number((equityValue / dilutedShares).toFixed(2));
    const terminalWeight = safeDivide(pvTerminal, enterpriseValue);
    return { valid:true, fcf1, fcf2, fcf3, discountRate, terminalGrowth, netDebt, dilutedShares, pv1, pv2, pv3, terminalValue:terminal, pvTerminal, enterpriseValue, equityValue, valuePerShare, terminalWeight: terminalWeight === null ? null : Number((terminalWeight * 100).toFixed(1)) };
  }

  function normalizeSeed(value) { const n = Number(value); return Number.isFinite(n) ? Math.abs(Math.trunc(n)) || 1 : 1; }
  function randomFactory(seed) { let state = normalizeSeed(seed) >>> 0; return function random() { state += 0x6d2b79f5; let v = state; v = Math.imul(v ^ v >>> 15, v | 1); v ^= v + Math.imul(v ^ v >>> 7, v | 61); return ((v ^ v >>> 14) >>> 0) / 4294967296; }; }
  function createSession(seed = 1, count = REQUIRED_CASES) { const normalizedSeed = normalizeSeed(seed); const random = randomFactory(normalizedSeed); const cases=[...CASES]; for (let i=cases.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[cases[i],cases[j]]=[cases[j],cases[i]];} const size=Math.min(CASES.length,Math.max(1,Math.trunc(Number(count)||REQUIRED_CASES))); return {seed:normalizedSeed,cases:cases.slice(0,size)}; }
  function findCase(caseId) { return CASES.find(item => item.id === caseId) || null; }
  function normalizeAnswer(candidate = {}) { const interpretation=cleanText(candidate.interpretation,40); const driver=cleanText(candidate.driver,50); const action=cleanText(candidate.action,50); const source=cleanText(candidate.source,40); return { interpretation:INTERPRETATIONS.includes(interpretation)?interpretation:"", driver:DRIVERS.includes(driver)?driver:"", action:ACTIONS.includes(action)?action:"", source:SOURCES.some(item=>item.id===source)?source:"", rationale:cleanText(candidate.rationale,1200) }; }
  function gradeCase(caseId, candidateAnswer = {}) {
    const item=findCase(caseId); if(!item) throw new Error("Caso de valuation desconhecido."); const answer=normalizeAnswer(candidateAnswer);
    const checks=[
      {id:"interpretation",label:"Leitura da faixa de valor",points:30,passed:answer.interpretation===item.expectedInterpretation},
      {id:"driver",label:"Premissa dominante",points:25,passed:answer.driver===item.expectedDriver},
      {id:"action",label:"Próxima verificação",points:20,passed:answer.action===item.expectedAction},
      {id:"source",label:"Fonte primária",points:15,passed:answer.source===item.expectedSource},
      {id:"rationale",label:"Justificativa auditável",points:10,passed:answer.rationale.length>=60}
    ];
    let score=checks.reduce((t,c)=>t+(c.passed?c.points:0),0); let hardViolation="";
    if(item.severity==="EV_EQUITY_CONFUSION" && answer.interpretation!=="INSUFFICIENT_EVIDENCE"){hardViolation="A resposta tratou enterprise value e equity value como equivalentes sem reconciliação.";score=Math.min(score,49);}
    else if(item.severity==="OVERCONFIDENT" && answer.interpretation==="REASONABLE_RANGE"){hardViolation="A resposta aceitou uma premissa materialmente agressiva como faixa razoável sem ajuste ou sensibilidade.";score=Math.min(score,49);}
    else if(item.severity==="NO_DETERMINISTIC" && answer.interpretation!=="INSUFFICIENT_EVIDENCE"){hardViolation="A resposta transformou evidência insuficiente em conclusão determinística.";score=Math.min(score,69);}
    return {caseId:item.id,answer,checks,score,passed:score>=PASS_SCORE&&!hardViolation,hardViolation,expectedInterpretation:item.expectedInterpretation,expectedDriver:item.expectedDriver,expectedAction:item.expectedAction,expectedSource:item.expectedSource,explanation:item.explanation};
  }
  function normalizeTimestamp(value){const parsed=new Date(value);return Number.isFinite(parsed.getTime())?parsed.toISOString():null;}
  function normalizeAttempt(candidate={}){const item=findCase(cleanText(candidate.caseId,80));const timestamp=normalizeTimestamp(candidate.timestamp);const sessionId=cleanText(candidate.sessionId,100);if(!item||!timestamp||!sessionId)return null;const grade=gradeCase(item.id,candidate.answer);return {id:cleanText(candidate.id,120)||`${sessionId}-${item.id}`,sessionId,seed:normalizeSeed(candidate.seed),timestamp,caseId:item.id,answer:grade.answer,score:grade.score,passed:grade.passed,hardViolation:grade.hardViolation};}
  function evaluateNormalizedSession(attempts=[]){const unique=new Map();attempts.forEach(a=>unique.set(a.caseId,a));const results=[...unique.values()];const completed=results.length;const average=completed?Number((results.reduce((s,i)=>s+i.score,0)/completed).toFixed(1)):0;const hardViolations=results.filter(i=>i.hardViolation).length;return {completed,required:REQUIRED_CASES,average,hardViolations,passed:completed>=REQUIRED_CASES&&average>=PASS_SCORE&&hardViolations===0};}
  function summarizeNormalizedSessions(history=[]){const groups=new Map();history.forEach(a=>{if(!groups.has(a.sessionId))groups.set(a.sessionId,[]);groups.get(a.sessionId).push(a);});return [...groups.entries()].map(([sessionId,attempts])=>({sessionId,lastTimestamp:attempts.reduce((latest,a)=>a.timestamp>latest?a.timestamp:latest,""),...evaluateNormalizedSession(attempts)}));}
  function normalizeHistory(history=[]){if(!Array.isArray(history))return[];const map=new Map();history.map(normalizeAttempt).filter(Boolean).forEach(a=>map.set(`${a.sessionId}:${a.caseId}`,a));const normalized=[...map.values()].sort((a,b)=>a.timestamp.localeCompare(b.timestamp));if(normalized.length<=MAX_HISTORY)return normalized;const completed=summarizeNormalizedSessions(normalized).filter(s=>s.completed>=REQUIRED_CASES);const best=completed.reduce((b,s)=>!b||s.average>b.average||(s.average===b.average&&s.lastTimestamp>b.lastTimestamp)?s:b,null);const latest=completed.filter(s=>s.passed).reduce((l,s)=>!l||s.lastTimestamp>l.lastTimestamp?s:l,null);const preserve=new Set([best?.sessionId,latest?.sessionId].filter(Boolean));const fixed=normalized.filter(a=>preserve.has(a.sessionId));const recent=normalized.filter(a=>!preserve.has(a.sessionId)).slice(-(MAX_HISTORY-fixed.length));return [...fixed,...recent].sort((a,b)=>a.timestamp.localeCompare(b.timestamp));}
  function evaluateSession(attempts=[]){return evaluateNormalizedSession(normalizeHistory(attempts));}
  function summarizeSessions(history=[]){return summarizeNormalizedSessions(normalizeHistory(history)).map(({lastTimestamp,...session})=>session);}
  function normalizeState(candidate={}){const history=normalizeHistory(candidate.history);const sessions=summarizeSessions(history);return {version:1,history,lastSeed:normalizeSeed(candidate.lastSeed),passed:sessions.some(s=>s.passed),bestAverage:sessions.reduce((best,s)=>Math.max(best,s.completed>=REQUIRED_CASES?s.average:0),0)};}
  function recordAttempt(candidateState={},meta={}){const state=normalizeState(candidateState);const attempt=normalizeAttempt({id:meta.id,sessionId:meta.sessionId,seed:meta.seed,timestamp:meta.timestamp||new Date().toISOString(),caseId:meta.caseId,answer:meta.answer});if(!attempt)throw new Error("Tentativa de valuation inválida.");return normalizeState({...state,lastSeed:attempt.seed,history:[...state.history,attempt]});}

  return { PASS_SCORE, REQUIRED_CASES, MAX_HISTORY, INTERPRETATIONS, DRIVERS, ACTIONS, SOURCES, CASES, presentValue, terminalValueGordon, summarizeValuationSnapshot, createSession, findCase, normalizeAnswer, gradeCase, normalizeAttempt, normalizeHistory, evaluateSession, summarizeSessions, normalizeState, recordAttempt };
});
