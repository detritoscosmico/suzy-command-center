(function () {
  "use strict";
  const core = window.SuzyFixedIncomeCore;
  if (!core) return;

  const STORAGE_KEY = "suzy-fixed-income-v1";
  const $ = id => document.getElementById(id);

  const INTERPRETATION_LABELS = Object.freeze({
    CONSISTENT_MECHANISM: "Mecanismo consistente com os dados",
    RISK_OR_PREMISE_UNDERSTATED: "Risco ou premissa relevante foi subestimado",
    INSUFFICIENT_EVIDENCE: "Evidência insuficiente para concluir"
  });

  const DRIVER_LABELS = Object.freeze({
    PRICE_YIELD: "Relação preço × yield",
    TERM_STRUCTURE: "Estrutura a termo / curva de juros",
    DURATION: "Duration",
    CONVEXITY: "Convexidade",
    CREDIT_SPREAD: "Spread de crédito",
    CREDIT_QUALITY: "Qualidade de crédito do emissor",
    INFLATION_INDEXATION: "Indexação à inflação",
    REAL_NOMINAL: "Separação real × nominal",
    MARK_TO_MARKET: "Marcação a mercado",
    FLOATING_RATE: "Indexador pós-fixado",
    LIQUIDITY: "Liquidez de mercado",
    CASH_FLOW_STRUCTURE: "Estrutura temporal dos fluxos"
  });

  const ACTION_LABELS = Object.freeze({
    REPRICE_CASH_FLOWS: "Reprecificar fluxos pela nova taxa",
    SEPARATE_CURVE_FROM_FORECAST: "Separar curva de previsão determinística",
    COMPARE_DURATION: "Comparar duration e prazo econômico",
    ADD_CONVEXITY: "Adicionar convexidade / preço exato",
    CHECK_SPREAD_AND_ISSUER: "Verificar spread e emissor",
    CHECK_CREDIT_RISK: "Avaliar risco de crédito",
    SEPARATE_REAL_NOMINAL: "Separar retorno real e nominal",
    CHECK_INDEXER_PATH: "Verificar trajetória e regra do indexador",
    CHECK_HOLDING_HORIZON: "Verificar horizonte e marcação a mercado",
    IDENTIFY_INDEXER: "Identificar indexador e fluxo",
    CHECK_LIQUIDITY: "Verificar liquidez e spread de negociação",
    MAP_CASH_FLOWS: "Mapear cupons, principal e datas"
  });

  const SOURCE_LABELS = Object.freeze(Object.fromEntries(core.SOURCES.map(source => [source.id, source.title])));
  const CURVE_LABELS = Object.freeze({UPWARD:"INCLINADA POSITIVA",INVERTED:"INVERTIDA",FLAT:"PLANA",HUMPED_OR_MIXED:"MISTA / COM CORCOVA"});

  let state = loadState();
  let session = null;
  let sessionId = "";
  let currentIndex = 0;
  let locked = false;
  let sessionComplete = false;

  function loadState(){try{return core.normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"));}catch(error){console.warn("Histórico de renda fixa inválido foi ignorado.",error);return core.normalizeState({});}}
  function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function currentAttempts(){return state.history.filter(attempt=>attempt.sessionId===sessionId);}
  function optionMarkup(items,labels){return '<option value="">Selecione</option>'+items.map(item=>`<option value="${item}">${labels[item]}</option>`).join("");}
  function fillOptions(){$("caseInterpretation").innerHTML=optionMarkup(core.INTERPRETATIONS,INTERPRETATION_LABELS);$("caseDriver").innerHTML=optionMarkup(core.DRIVERS,DRIVER_LABELS);$("caseAction").innerHTML=optionMarkup(core.ACTIONS,ACTION_LABELS);$("caseSource").innerHTML='<option value="">Selecione</option>'+core.SOURCES.map(source=>`<option value="${source.id}">${source.title}</option>`).join("");}
  function clearCaseForm(){$("caseForm").reset();["caseInterpretation","caseDriver","caseAction","caseSource"].forEach(id=>{$(id).value="";});$("caseFeedback").textContent="";$("caseResult").hidden=true;$("hardViolation").hidden=true;locked=false;[...$("caseForm").elements].forEach(element=>{element.disabled=false;});}
  function renderCase(){const item=session.cases[currentIndex];clearCaseForm();$("caseProgress").textContent=`CASO ${currentIndex+1} DE ${core.REQUIRED_CASES}`;$("caseLab").dataset.caseId=item.id;$("caseTitle").textContent=item.title;$("caseFacts").innerHTML=item.facts.map(fact=>`<li>${fact}</li>`).join("");$("nextCase").textContent=currentIndex===session.cases.length-1?"VER RESULTADO DA SESSÃO":"PRÓXIMO CASO";renderKpis();}
  function renderKpis(){const evaluation=core.evaluateSession(currentAttempts());$("kpiCases").textContent=`${evaluation.completed}/${evaluation.required}`;$("kpiAverage").textContent=String(evaluation.average);$("kpiViolations").textContent=String(evaluation.hardViolations);$("kpiStatus").textContent=state.passed?"E3 APROVADO":"EM FORMAÇÃO";$("kpiBest").textContent=`melhor média: ${state.bestAverage}`;}
  function renderHistory(){const history=[...state.history].reverse();$("historyBody").innerHTML=history.length?history.map(attempt=>{const item=core.findCase(attempt.caseId);const date=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(attempt.timestamp));return `<tr><td>${date}</td><td>${attempt.seed}</td><td>${item?.title||attempt.caseId}</td><td class="${attempt.passed?"pass":"fail"}">${attempt.score}</td><td>${attempt.hardViolation?"SIM":"NÃO"}</td></tr>`;}).join(""):'<tr><td colspan="5" class="empty">Nenhuma resposta registrada.</td></tr>';}
  function startSession(shouldScroll=true){const seed=Number($("sessionSeed").value)||1;session=core.createSession(seed);sessionId=`fixed-income-${session.seed}-${Date.now()}`;currentIndex=0;sessionComplete=false;state=core.normalizeState({...state,lastSeed:session.seed});saveState();$("sessionSeed").value=String(session.seed);$("sessionLabel").textContent=`Sessão ${session.seed}: seis variantes selecionadas de um banco com ${core.CASES.length} casos.`;renderCase();if(shouldScroll)$("caseLab").scrollIntoView({behavior:"smooth",block:"start"});}

  function submitCase(event){event.preventDefault();if(locked)return;const item=session.cases[currentIndex];const answer={interpretation:$("caseInterpretation").value,driver:$("caseDriver").value,action:$("caseAction").value,source:$("caseSource").value,rationale:$("caseRationale").value};if(!answer.interpretation||!answer.driver||!answer.action||!answer.source||!answer.rationale.trim()){$("caseFeedback").textContent="Preencha os cinco campos antes de avaliar.";return;}const grade=core.gradeCase(item.id,answer);state=core.recordAttempt(state,{sessionId,seed:session.seed,caseId:item.id,answer,timestamp:new Date().toISOString()});saveState();locked=true;[...$("caseForm").elements].forEach(element=>{element.disabled=true;});$("caseScore").textContent=String(grade.score);$("caseResultState").textContent=grade.passed?"APROVADO":"REVISAR";$("caseResultState").className=grade.passed?"pass":"fail";$("caseChecks").innerHTML=grade.checks.map(check=>`<article class="check-card ${check.passed?"pass":"fail"}"><strong>${check.passed?`+${check.points}`:"+0"} • ${check.label}</strong><span>${check.passed?"Critério atendido":"Critério não atendido"}</span></article>`).join("");$("hardViolation").hidden=!grade.hardViolation;$("hardViolation").textContent=grade.hardViolation?`VIOLAÇÃO DURA: ${grade.hardViolation}`:"";$("caseExplanation").textContent=grade.explanation;$("caseExpected").textContent=`Resposta esperada: ${INTERPRETATION_LABELS[grade.expectedInterpretation]}; ${DRIVER_LABELS[grade.expectedDriver]}; ${ACTION_LABELS[grade.expectedAction]}; ${SOURCE_LABELS[grade.expectedSource]}.`;$("caseResult").hidden=false;$("caseFeedback").textContent="Resposta travada. A nota mede mecanismo, risco, fonte e limite de inferência; não recomenda título nem prevê retorno.";renderKpis();renderHistory();}
  function nextCase(){if(sessionComplete){$("sessionSeed").value=String(session.seed+1);startSession();return;}if(!locked)return;if(currentIndex<session.cases.length-1){currentIndex+=1;renderCase();return;}const evaluation=core.evaluateSession(currentAttempts());$("sessionLabel").textContent=evaluation.passed?`Sessão aprovada: média ${evaluation.average}, sem violação dura.`:`Sessão concluída sem aprovação: média ${evaluation.average}, ${evaluation.hardViolations} violação(ões) dura(s).`;$("nextCase").textContent="INICIAR NOVA SESSÃO";sessionComplete=true;renderKpis();}
  function formatNumber(value,decimals=2,suffix=""){if(value===null||value===undefined||Number.isNaN(Number(value)))return"N/A";return `${Number(value).toFixed(decimals)}${suffix}`;}

  function calculateSnapshot(event){event.preventDefault();const metrics=core.bondRiskMetrics({face:$("fiFace").value,couponRate:$("fiCoupon").value,yieldRate:$("fiYield").value,years:$("fiYears").value,paymentsPerYear:Number($("fiFrequency").value),shockBp:$("fiShock").value});const curve=core.classifyCurve($("curveShort").value,$("curveMedium").value,$("curveLong").value);if(!metrics.valid||!curve.valid){["fiPrice","fiMacaulay","fiModified","fiConvexity","fiApprox","fiExact","fiCurveShape","fiCurveSpread"].forEach(id=>{$(id).textContent="N/A";});$("fiFeedback").textContent="Entradas inválidas. Use valor de face e prazo positivos, frequência compatível com o prazo e taxas numéricas.";return;}$("fiPrice").textContent=formatNumber(metrics.price,2);$("fiMacaulay").textContent=formatNumber(metrics.macaulayDuration,4);$("fiModified").textContent=formatNumber(metrics.modifiedDuration,4);$("fiConvexity").textContent=formatNumber(metrics.convexity,4);$("fiApprox").textContent=formatNumber(metrics.approximateChangePercent,4,"%");$("fiExact").textContent=formatNumber(metrics.exactChangePercent,4,"%");$("fiCurveShape").textContent=CURVE_LABELS[curve.shape]||curve.shape;$("fiCurveSpread").textContent=formatNumber(curve.longShortSpread,2," p.p.");$("fiFeedback").textContent="Snapshot educacional calculado. Duration/convexidade aproximam sensibilidade e a curva descreve preços atuais; nenhuma saída é indicação de compra, venda ou previsão de taxa futura.";}

  fillOptions();
  $("fixedIncomeForm").addEventListener("submit",calculateSnapshot);
  $("startSession").addEventListener("click",()=>startSession(true));
  $("caseForm").addEventListener("submit",submitCase);
  $("nextCase").addEventListener("click",nextCase);
  $("clearHistory").addEventListener("click",()=>{if(!window.confirm("Limpar todo o histórico local desta trilha?"))return;state=core.normalizeState({lastSeed:state.lastSeed});saveState();renderHistory();renderKpis();});
  $("sessionSeed").value=String(state.lastSeed||20260822);
  renderHistory();
  startSession(false);
})();
