(function () {
  "use strict";
  const core = window.SuzyDerivativesCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-derivatives-v1";
  const $ = id => document.getElementById(id);

  const INTERPRETATION_LABELS = Object.freeze({
    CONSISTENT_MECHANISM:"Mecanismo consistente com os dados",
    RISK_OR_PREMISE_UNDERSTATED:"Risco ou premissa relevante foi subestimado",
    INSUFFICIENT_EVIDENCE:"Evidência insuficiente para concluir"
  });

  const DRIVER_LABELS = Object.freeze({
    FUTURES_PAYOFF:"Payoff linear de futuros",
    DAILY_SETTLEMENT:"Ajuste diário",
    MARGIN_LEVERAGE:"Margem e alavancagem",
    BASIS:"Basis / futuro × spot",
    EXPIRY_ROLL:"Vencimento e rolagem",
    DI_RATE_PU:"Taxa DI e PU",
    OPTION_PAYOFF:"Payoff de opções",
    INTRINSIC_TIME:"Valor intrínseco × temporal",
    IMPLIED_VOLATILITY:"Volatilidade implícita",
    DELTA:"Delta",
    GAMMA:"Gamma",
    THETA:"Theta",
    VEGA:"Vega",
    EXERCISE_EXPIRY:"Exercício e expiração",
    SWAP_CASH_FLOWS:"Fluxos de swap",
    MODEL_LIMIT:"Limitações de modelo"
  });

  const ACTION_LABELS = Object.freeze({
    MAP_FUTURES_PAYOFF:"Mapear payoff, multiplicador e direção",
    CHECK_DAILY_SETTLEMENT:"Verificar ajustes diários e caixa",
    STRESS_MARGIN_AND_CASH:"Estressar margem, notional e chamadas de caixa",
    COMPARE_SPOT_FUTURE_BASIS:"Comparar spot, futuro e basis",
    CHECK_EXPIRY_AND_ROLL:"Verificar vencimento e necessidade de rolagem",
    MAP_DI_RATE_TO_PU:"Mapear taxa negociada para PU e prazo",
    DRAW_OPTION_PAYOFF:"Desenhar payoff no vencimento",
    SEPARATE_INTRINSIC_TIME:"Separar valor intrínseco e temporal",
    CHECK_VOLATILITY_INPUT:"Verificar volatilidade e premissas",
    CHECK_DELTA_EXPOSURE:"Verificar exposição delta",
    CHECK_GAMMA_NONLINEARITY:"Verificar mudança do delta via gamma",
    CHECK_THETA_HORIZON:"Verificar horizonte e theta local",
    CHECK_VEGA_VOLATILITY:"Verificar sensibilidade vega",
    CHECK_EXERCISE_STYLE:"Verificar estilo, vencimento e exercício",
    MAP_SWAP_LEGS:"Mapear as duas pontas do swap",
    STRESS_MODEL_ASSUMPTIONS:"Estressar premissas e comparar com mercado"
  });

  const SOURCE_LABELS = Object.freeze(Object.fromEntries(core.SOURCES.map(source => [source.id, source.title])));
  let state = loadState();
  let session = null;
  let sessionId = "";
  let currentIndex = 0;
  let locked = false;
  let sessionComplete = false;

  function loadState(){try{return core.normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"));}catch(error){console.warn("Histórico de derivativos inválido foi ignorado.",error);return core.normalizeState({});}}
  function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function currentAttempts(){return state.history.filter(attempt=>attempt.sessionId===sessionId);}
  function optionMarkup(items,labels){return '<option value="">Selecione</option>'+items.map(item=>`<option value="${item}">${labels[item]}</option>`).join("");}
  function fillOptions(){$("caseInterpretation").innerHTML=optionMarkup(core.INTERPRETATIONS,INTERPRETATION_LABELS);$("caseDriver").innerHTML=optionMarkup(core.DRIVERS,DRIVER_LABELS);$("caseAction").innerHTML=optionMarkup(core.ACTIONS,ACTION_LABELS);$("caseSource").innerHTML='<option value="">Selecione</option>'+core.SOURCES.map(source=>`<option value="${source.id}">${source.title}</option>`).join("");}
  function clearCaseForm(){$("caseForm").reset();["caseInterpretation","caseDriver","caseAction","caseSource"].forEach(id=>{$(id).value="";});$("caseFeedback").textContent="";$("caseResult").hidden=true;$("hardViolation").hidden=true;locked=false;[...$("caseForm").elements].forEach(element=>{element.disabled=false;});}
  function renderCase(){const item=session.cases[currentIndex];clearCaseForm();$("caseProgress").textContent=`CASO ${currentIndex+1} DE ${core.REQUIRED_CASES}`;$("caseLab").dataset.caseId=item.id;$("caseTitle").textContent=item.title;$("caseFacts").innerHTML=item.facts.map(fact=>`<li>${fact}</li>`).join("");$("nextCase").textContent=currentIndex===session.cases.length-1?"VER RESULTADO DA SESSÃO":"PRÓXIMO CASO";renderKpis();}
  function renderKpis(){const evaluation=core.evaluateSession(currentAttempts());$("kpiCases").textContent=`${evaluation.completed}/${evaluation.required}`;$("kpiAverage").textContent=String(evaluation.average);$("kpiViolations").textContent=String(evaluation.hardViolations);$("kpiStatus").textContent=state.passed?"E3 APROVADO":"EM FORMAÇÃO";$("kpiBest").textContent=`melhor média: ${state.bestAverage}`;}
  function renderHistory(){const history=[...state.history].reverse();$("historyBody").innerHTML=history.length?history.map(attempt=>{const item=core.findCase(attempt.caseId);const date=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(attempt.timestamp));return `<tr><td>${date}</td><td>${attempt.seed}</td><td>${item?.title||attempt.caseId}</td><td class="${attempt.passed?"pass":"fail"}">${attempt.score}</td><td>${attempt.hardViolation?"SIM":"NÃO"}</td></tr>`;}).join(""):'<tr><td colspan="5" class="empty">Nenhuma resposta registrada.</td></tr>';}
  function startSession(shouldScroll=true){const seed=Number($("sessionSeed").value)||1;session=core.createSession(seed);sessionId=`derivatives-${session.seed}-${Date.now()}`;currentIndex=0;sessionComplete=false;state=core.normalizeState({...state,lastSeed:session.seed});saveState();$("sessionSeed").value=String(session.seed);$("sessionLabel").textContent=`Sessão ${session.seed}: seis variantes selecionadas de um banco com ${core.CASES.length} casos.`;renderCase();if(shouldScroll)$("caseLab").scrollIntoView({behavior:"smooth",block:"start"});}

  function submitCase(event){event.preventDefault();if(locked)return;const item=session.cases[currentIndex];const answer={interpretation:$("caseInterpretation").value,driver:$("caseDriver").value,action:$("caseAction").value,source:$("caseSource").value,rationale:$("caseRationale").value};if(!answer.interpretation||!answer.driver||!answer.action||!answer.source||!answer.rationale.trim()){$("caseFeedback").textContent="Preencha os cinco campos antes de avaliar.";return;}const grade=core.gradeCase(item.id,answer);state=core.recordAttempt(state,{sessionId,seed:session.seed,caseId:item.id,answer,timestamp:new Date().toISOString()});saveState();locked=true;[...$("caseForm").elements].forEach(element=>{element.disabled=true;});$("caseScore").textContent=String(grade.score);$("caseResultState").textContent=grade.passed?"APROVADO":"REVISAR";$("caseResultState").className=grade.passed?"pass":"fail";$("caseChecks").innerHTML=grade.checks.map(check=>`<article class="check-card ${check.passed?"pass":"fail"}"><strong>${check.passed?`+${check.points}`:"+0"} • ${check.label}</strong><span>${check.passed?"Critério atendido":"Critério não atendido"}</span></article>`).join("");$("hardViolation").hidden=!grade.hardViolation;$("hardViolation").textContent=grade.hardViolation?`VIOLAÇÃO DURA: ${grade.hardViolation}`:"";$("caseExplanation").textContent=grade.explanation;$("caseExpected").textContent=`Resposta esperada: ${INTERPRETATION_LABELS[grade.expectedInterpretation]}; ${DRIVER_LABELS[grade.expectedDriver]}; ${ACTION_LABELS[grade.expectedAction]}; ${SOURCE_LABELS[grade.expectedSource]}.`;$("caseResult").hidden=false;$("caseFeedback").textContent="Resposta travada. A nota mede mecanismo, risco, fonte e limite de modelo; não produz sinal nem recomendação.";$("caseResult").focus();renderKpis();renderHistory();}
  function nextCase(){if(sessionComplete){$("sessionSeed").value=String(session.seed+1);startSession();return;}if(!locked)return;if(currentIndex<session.cases.length-1){currentIndex+=1;renderCase();return;}const evaluation=core.evaluateSession(currentAttempts());$("sessionLabel").textContent=evaluation.passed?`Sessão aprovada: média ${evaluation.average}, sem violação dura.`:`Sessão concluída sem aprovação: média ${evaluation.average}, ${evaluation.hardViolations} violação(ões) dura(s).`;$("nextCase").textContent="INICIAR NOVA SESSÃO";sessionComplete=true;renderKpis();}
  function formatNumber(value,decimals=2,suffix=""){if(value===null||value===undefined||Number.isNaN(Number(value)))return"N/A";return `${Number(value).toFixed(decimals)}${suffix}`;}
  function clearSnapshot(){["futPnl","basisValue","diPu","optionExpiry","optionModelPrice","optionIntrinsic","optionTime","optionDelta","optionGamma","optionTheta","optionVega","swapNet"].forEach(id=>{$(id).textContent="N/A";});}

  function calculateSnapshot(event){
    event.preventDefault();
    const futures=core.futuresPnl({entryPrice:$("futEntry").value,exitPrice:$("futExit").value,multiplier:$("futMultiplier").value,contracts:$("futContracts").value,side:$("futSide").value});
    const basis=core.basisSnapshot({spot:$("basisSpot").value,future:$("basisFuture").value});
    const di=core.diPuSnapshot({annualRate:$("diRate").value,businessDays:$("diDays").value});
    const payoff=core.optionPayoff({spot:$("optionSpot").value,strike:$("optionStrike").value,premium:$("optionPremium").value,type:$("optionType").value,position:$("optionPosition").value,contracts:1,multiplier:1});
    const model=core.blackScholesSnapshot({spot:$("optionSpot").value,strike:$("optionStrike").value,annualRatePercent:$("optionRate").value,volatilityPercent:$("optionVol").value,days:$("optionDays").value,type:$("optionType").value});
    const swap=core.swapSimpleDifferential({notional:$("swapNotional").value,receiveRate:$("swapReceive").value,payRate:$("swapPay").value,years:$("swapYears").value});
    if(!futures.valid||!basis.valid||!di.valid||!payoff.valid||!model.valid||!swap.valid){clearSnapshot();$("derivativesFeedback").textContent="Entradas inválidas ou fora do domínio numérico do laboratório. Nenhum resultado foi calculado.";return;}
    $("futPnl").textContent=formatNumber(futures.pnl,2);
    $("basisValue").textContent=`${formatNumber(basis.basis,2)} (${formatNumber(basis.basisPercent,4,"%")})`;
    $("diPu").textContent=formatNumber(di.pu,2);
    $("optionExpiry").textContent=formatNumber(payoff.netPerUnit,2);
    $("optionModelPrice").textContent=formatNumber(model.price,4);
    $("optionIntrinsic").textContent=formatNumber(model.intrinsic,4);
    $("optionTime").textContent=formatNumber(model.timeValue,4);
    $("optionDelta").textContent=formatNumber(model.delta,6);
    $("optionGamma").textContent=formatNumber(model.gamma,6);
    $("optionTheta").textContent=formatNumber(model.thetaPerDay,6);
    $("optionVega").textContent=formatNumber(model.vegaPerVolPoint,6);
    $("swapNet").textContent=formatNumber(swap.net,2);
    $("derivativesFeedback").textContent="Snapshot educacional calculado. Payoffs e Greeks dependem das premissas; margem, volatilidade e modelo não são sinais de entrada nem garantia de resultado.";
  }

  fillOptions();
  $("derivativesForm").addEventListener("submit",calculateSnapshot);
  $("startSession").addEventListener("click",()=>startSession(true));
  $("caseForm").addEventListener("submit",submitCase);
  $("nextCase").addEventListener("click",nextCase);
  $("clearHistory").addEventListener("click",()=>{if(!window.confirm("Limpar todo o histórico local desta trilha?"))return;state=core.normalizeState({lastSeed:state.lastSeed});saveState();renderHistory();renderKpis();});
  $("sessionSeed").value=String(state.lastSeed||20260822);
  renderHistory();
  startSession(false);
})();