(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyDerivativesCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;

  const INTERPRETATIONS = Object.freeze([
    "CONSISTENT_MECHANISM",
    "RISK_OR_PREMISE_UNDERSTATED",
    "INSUFFICIENT_EVIDENCE"
  ]);

  const DRIVERS = Object.freeze([
    "FUTURES_PAYOFF",
    "DAILY_SETTLEMENT",
    "MARGIN_LEVERAGE",
    "BASIS",
    "EXPIRY_ROLL",
    "DI_RATE_PU",
    "OPTION_PAYOFF",
    "INTRINSIC_TIME",
    "IMPLIED_VOLATILITY",
    "DELTA",
    "GAMMA",
    "THETA",
    "VEGA",
    "EXERCISE_EXPIRY",
    "SWAP_CASH_FLOWS",
    "MODEL_LIMIT"
  ]);

  const ACTIONS = Object.freeze([
    "MAP_FUTURES_PAYOFF",
    "CHECK_DAILY_SETTLEMENT",
    "STRESS_MARGIN_AND_CASH",
    "COMPARE_SPOT_FUTURE_BASIS",
    "CHECK_EXPIRY_AND_ROLL",
    "MAP_DI_RATE_TO_PU",
    "DRAW_OPTION_PAYOFF",
    "SEPARATE_INTRINSIC_TIME",
    "CHECK_VOLATILITY_INPUT",
    "CHECK_DELTA_EXPOSURE",
    "CHECK_GAMMA_NONLINEARITY",
    "CHECK_THETA_HORIZON",
    "CHECK_VEGA_VOLATILITY",
    "CHECK_EXERCISE_STYLE",
    "MAP_SWAP_LEGS",
    "STRESS_MODEL_ASSUMPTIONS"
  ]);

  const SOURCES = Object.freeze([
    { id:"B3_DI", title:"B3 — Futuro de DI: especificações técnicas", url:"https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/juros/s_di_train_prog/05-especificacoes-tecnicas.htm" },
    { id:"B3_IBOV_FUTURE", title:"B3 — Futuro de Ibovespa", url:"https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/mercado-de-acoes/futuro-de-ibovespa.htm" },
    { id:"B3_USD_FUTURE", title:"B3 — Futuro de Dólar Comercial", url:"https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/moedas/futuro-de-taxa-de-cambio-de-reais-por-dolar-comercial.htm" },
    { id:"B3_STOCK_OPTIONS", title:"B3 — Opções sobre Ações", url:"https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/opcoes-sobre-acoes.htm" },
    { id:"B3_DI_OPTIONS", title:"B3 — Opções sobre Futuro de DI", url:"https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/juros/opcoes-sobre-futuro-de-di.htm" },
    { id:"B3_SWAP", title:"B3 — Swap", url:"https://www.b3.com.br/pt_br/produtos-e-servicos/registro/derivativos-de-balcao/swap.htm" },
    { id:"CVM_DERIVATIVES", title:"Portal do Investidor/CVM — Derivativos", url:"https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/derivativos" },
    { id:"CVM_FUTURES", title:"Portal do Investidor/CVM — Mercado Futuro", url:"https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/derivativos/mercado-futuro" },
    { id:"CVM_OPTIONS", title:"Portal do Investidor/CVM — Mercado de Opções", url:"https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/derivativos/mercado-de-opcoes" },
    { id:"CVM_RISKS", title:"Portal do Investidor/CVM — Riscos em Derivativos", url:"https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/derivativos/riscos" }
  ]);

  const CASES = Object.freeze([
    { id:"future-daily-settlement", title:"Futuro gera ajuste diário", facts:["Uma posição comprada em contrato futuro permanece aberta por mais de um pregão.","O preço de ajuste do contrato muda no fechamento.","O relatório trata todo o fluxo financeiro apenas como algo que ocorrerá no vencimento."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"DAILY_SETTLEMENT", expectedAction:"CHECK_DAILY_SETTLEMENT", expectedSource:"CVM_FUTURES", severity:"DAILY_SETTLEMENT_IGNORED", explanation:"Contratos futuros padronizados utilizam ajuste diário. Ganhos e perdas do dia afetam o fluxo de caixa antes do vencimento." },
    { id:"margin-is-not-max-loss", title:"Margem não é perda máxima", facts:["Uma posição futura exige margem de garantia inferior ao valor nocional.","O mercado se move fortemente contra a posição.","O relatório afirma que a perda máxima está limitada ao valor depositado como margem."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"MARGIN_LEVERAGE", expectedAction:"STRESS_MARGIN_AND_CASH", expectedSource:"CVM_RISKS", severity:"MARGIN_CAPS_LOSS", explanation:"Margem é garantia e mecanismo de risco, não teto automático de perda. A exposição nocional e ajustes precisam ser estressados." },
    { id:"basis-spot-future", title:"Futuro e à vista podem divergir", facts:["O índice à vista está em 130.000 pontos.","O contrato futuro equivalente negocia a 131.200 pontos.","O relatório chama a diferença de erro de preço sem avaliar carregamento, juros, dividendos, vencimento ou liquidez."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"BASIS", expectedAction:"COMPARE_SPOT_FUTURE_BASIS", expectedSource:"B3_IBOV_FUTURE", severity:"NONE", explanation:"Basis é a diferença entre preço futuro e spot. Ela pode refletir carregamento, expectativas, prazo e microestrutura; não é erro por definição." },
    { id:"expiry-roll", title:"Vencimento muda a exposição", facts:["Uma posição em futuro está próxima do vencimento.","O operador deseja manter exposição econômica por período maior.","O relatório ignora a necessidade de encerrar ou rolar a posição e assume continuidade automática do mesmo contrato."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"EXPIRY_ROLL", expectedAction:"CHECK_EXPIRY_AND_ROLL", expectedSource:"B3_USD_FUTURE", severity:"NONE", explanation:"Contratos futuros têm vencimentos definidos. Manter exposição além do vencimento exige decisão explícita de encerramento ou rolagem." },
    { id:"di-rate-pu-inverse", title:"DI: taxa e PU se movem em sentidos opostos", facts:["Um contrato DI1 é cotado em taxa anualizada.","Mantidos prazo e convenção, a taxa negociada sobe.","O relatório afirma que o preço unitário teórico também deve subir na mesma direção."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"DI_RATE_PU", expectedAction:"MAP_DI_RATE_TO_PU", expectedSource:"B3_DI", severity:"DI_RATE_PU_SAME_DIRECTION", explanation:"No enquadramento simplificado de PU do DI, uma taxa maior implica menor valor presente/PU para o mesmo prazo. A convenção exata do contrato deve ser respeitada." },
    { id:"index-future-linear", title:"Futuro de índice tem payoff linear", facts:["Uma posição comprada em futuro de índice é marcada entre dois preços do contrato.","O multiplicador e a quantidade de contratos são conhecidos.","A variação financeira é linear em relação à diferença de pontos, antes de custos e demais ajustes."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"FUTURES_PAYOFF", expectedAction:"MAP_FUTURES_PAYOFF", expectedSource:"B3_IBOV_FUTURE", severity:"NONE", explanation:"O payoff de um futuro é linear em relação à variação do preço do contrato, multiplicador, quantidade e direção da posição." },
    { id:"dollar-future-not-spot", title:"Futuro de dólar não é dólar à vista", facts:["O DOL referencia BRL por USD e possui vencimento e especificação próprios.","A cotação futura diverge da cotação à vista no mesmo instante.","O relatório usa uma como substituta perfeita da outra sem considerar prazo, basis ou convenções."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"BASIS", expectedAction:"COMPARE_SPOT_FUTURE_BASIS", expectedSource:"B3_USD_FUTURE", severity:"NONE", explanation:"Spot e futuro são instrumentos distintos. A relação entre eles depende de prazo, carregamento e condições de mercado." },
    { id:"long-call-right", title:"Call comprada: direito, não obrigação", facts:["Um titular compra uma call e paga prêmio.","No vencimento, o preço do ativo fica abaixo do strike.","O relatório afirma que o titular é obrigado a comprar o ativo pelo strike e perde também toda a diferença adversa."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"OPTION_PAYOFF", expectedAction:"DRAW_OPTION_PAYOFF", expectedSource:"CVM_OPTIONS", severity:"OPTION_RIGHT_IGNORED", explanation:"O titular de uma opção possui um direito. Para uma call longa fora do dinheiro no vencimento, o exercício econômico não é obrigatório; o prêmio pago permanece relevante." },
    { id:"short-call-loss-capped", title:"Call vendida não tem perda limitada ao prêmio", facts:["Um lançador vende uma call descoberta e recebe prêmio.","O ativo sobe muito acima do strike.","O relatório afirma que o pior resultado possível do lançador é devolver o prêmio recebido."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"OPTION_PAYOFF", expectedAction:"DRAW_OPTION_PAYOFF", expectedSource:"CVM_OPTIONS", severity:"SHORT_CALL_CAPPED", explanation:"O prêmio recebido não limita automaticamente a perda de uma call vendida descoberta. O payoff precisa ser mapeado para preços adversos do ativo." },
    { id:"intrinsic-time-value", title:"Prêmio não é só valor intrínseco", facts:["Uma call está levemente dentro do dinheiro e ainda possui tempo até o vencimento.","O prêmio observado é maior que o valor intrínseco.","O relatório conclui que a diferença é necessariamente erro de mercado."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"INTRINSIC_TIME", expectedAction:"SEPARATE_INTRINSIC_TIME", expectedSource:"B3_STOCK_OPTIONS", severity:"NONE", explanation:"Antes do vencimento, o prêmio pode incorporar valor temporal e expectativas de volatilidade, além do valor intrínseco." },
    { id:"volatility-direction", title:"Volatilidade não define direção", facts:["A volatilidade implícita de uma opção aumenta.","Nenhuma informação nova sobre direção do ativo é apresentada.","O relatório afirma que volatilidade mais alta garante alta do ativo subjacente."], expectedInterpretation:"INSUFFICIENT_EVIDENCE", expectedDriver:"IMPLIED_VOLATILITY", expectedAction:"CHECK_VOLATILITY_INPUT", expectedSource:"CVM_DERIVATIVES", severity:"VOLATILITY_GUARANTEES_DIRECTION", explanation:"Volatilidade descreve dispersão/incerteza, não direção garantida. Uma mudança de volatilidade precisa ser separada de uma previsão direcional." },
    { id:"delta-is-probability", title:"Delta não é probabilidade garantida", facts:["Uma call possui delta de aproximadamente 0,60 em determinado instante e modelo.","O mercado e os demais parâmetros podem mudar.","O relatório afirma que existe exatamente 60% de chance garantida de a opção terminar dentro do dinheiro."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"DELTA", expectedAction:"CHECK_DELTA_EXPOSURE", expectedSource:"CVM_OPTIONS", severity:"DELTA_PROBABILITY", explanation:"Delta mede sensibilidade local do valor da opção ao subjacente dentro de um modelo/estado. Não deve ser apresentado como probabilidade garantida sem premissas adicionais." },
    { id:"gamma-nonlinear", title:"Gamma altera o delta", facts:["Uma opção está próxima do strike e do vencimento.","O preço do ativo se move de forma relevante.","O relatório usa o delta inicial como sensibilidade constante para todo o movimento."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"GAMMA", expectedAction:"CHECK_GAMMA_NONLINEARITY", expectedSource:"CVM_OPTIONS", severity:"NONE", explanation:"Gamma mede a mudança do delta com o subjacente. Exposição de opções é não linear e uma sensibilidade local não permanece necessariamente constante." },
    { id:"theta-not-linear", title:"Theta é sensibilidade local", facts:["Uma opção possui theta negativo no snapshot atual.","O relatório projeta esse mesmo valor diário linearmente até o vencimento.","Volatilidade, preço, juros e distância do strike são tratados como imutáveis."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"THETA", expectedAction:"CHECK_THETA_HORIZON", expectedSource:"CVM_OPTIONS", severity:"MODEL_EXACT", explanation:"Theta é uma sensibilidade local dependente do estado e do modelo. Não é uma regra linear exata para todo o horizonte." },
    { id:"vega-volatility", title:"Vega mede sensibilidade à volatilidade", facts:["Duas opções diferem em prazo e moneyness.","Uma mudança de volatilidade implícita altera seus valores em magnitudes diferentes.","O relatório verifica vega antes de comparar o impacto da mudança de volatilidade."], expectedInterpretation:"CONSISTENT_MECHANISM", expectedDriver:"VEGA", expectedAction:"CHECK_VEGA_VOLATILITY", expectedSource:"CVM_OPTIONS", severity:"NONE", explanation:"Vega resume sensibilidade local do valor da opção à volatilidade no modelo. Prazo, strike e demais parâmetros importam." },
    { id:"exercise-style-expiry", title:"Exercício depende da especificação", facts:["Uma opção possui vencimento e estilo definidos pela especificação do produto.","Outro produto pode ter regras diferentes de exercício manual, automático, americano ou europeu.","O relatório assume uma única regra de exercício para todas as opções negociadas na B3."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"EXERCISE_EXPIRY", expectedAction:"CHECK_EXERCISE_STYLE", expectedSource:"B3_STOCK_OPTIONS", severity:"NONE", explanation:"Estilo, vencimento e procedimento de exercício dependem da especificação de cada contrato. A regra do produto precisa ser verificada." },
    { id:"swap-two-legs", title:"Swap troca resultados de duas pontas", facts:["Um swap compara o desempenho de dois indexadores sobre uma base contratual.","Uma ponta é comprada e outra vendida.","O relatório analisa somente a ponta recebida e ignora a obrigação econômica da ponta paga."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"SWAP_CASH_FLOWS", expectedAction:"MAP_SWAP_LEGS", expectedSource:"B3_SWAP", severity:"NONE", explanation:"O resultado de um swap depende da diferença entre duas pontas. Notional, indexadores, período, garantia e forma de liquidação precisam ser mapeados." },
    { id:"model-is-market-truth", title:"Modelo não é verdade de mercado", facts:["Um modelo simplificado produz preço e Greeks para uma opção europeia.","O cálculo assume parâmetros contínuos e não incorpora todas as fricções do produto real.","O relatório chama a saída do modelo de preço correto garantido e substitui a cotação/contrato observados."], expectedInterpretation:"RISK_OR_PREMISE_UNDERSTATED", expectedDriver:"MODEL_LIMIT", expectedAction:"STRESS_MODEL_ASSUMPTIONS", expectedSource:"CVM_DERIVATIVES", severity:"MODEL_EXACT", explanation:"Modelos são aproximações condicionadas a premissas. Cotação, liquidez, convenções, exercício, volatilidade e riscos reais podem divergir da simplificação." }
  ]);

  function cleanText(value, maximum = 1200) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function boundedNumber(value, minimum, maximum) {
    const number = Number(value);
    return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
  }

  function round(value, decimals = 4) {
    if (!Number.isFinite(value)) return null;
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function normalPdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  function normalCdf(x) {
    const sign = x < 0 ? -1 : 1;
    const z = Math.abs(x) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * z);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return 0.5 * (1 + sign * erf);
  }

  function futuresPnl(candidate = {}) {
    const entryPrice = boundedNumber(candidate.entryPrice, -1e9, 1e9);
    const exitPrice = boundedNumber(candidate.exitPrice, -1e9, 1e9);
    const multiplier = boundedNumber(candidate.multiplier, 0.000001, 1e9);
    const contracts = boundedNumber(candidate.contracts, 1, 1000000);
    const side = candidate.side === "SHORT" ? "SHORT" : candidate.side === "LONG" ? "LONG" : null;
    if (entryPrice === null || exitPrice === null || multiplier === null || contracts === null || side === null || !Number.isInteger(contracts)) return { valid:false, reason:"INVALID_FUTURES_INPUT" };
    const direction = side === "LONG" ? 1 : -1;
    const points = (exitPrice - entryPrice) * direction;
    const pnl = points * multiplier * contracts;
    if (![points, pnl].every(Number.isFinite)) return { valid:false, reason:"NUMERIC_RANGE" };
    return { valid:true, entryPrice, exitPrice, multiplier, contracts, side, points:round(points, 6), pnl:round(pnl, 2) };
  }

  function dailySettlement(candidate = {}) {
    return futuresPnl({ entryPrice:candidate.previousSettlement, exitPrice:candidate.currentSettlement, multiplier:candidate.multiplier, contracts:candidate.contracts, side:candidate.side });
  }

  function basisSnapshot(candidate = {}) {
    const spot = boundedNumber(candidate.spot, 0.000001, 1e12);
    const future = boundedNumber(candidate.future, 0.000001, 1e12);
    if (spot === null || future === null) return { valid:false, reason:"INVALID_BASIS_INPUT" };
    const basis = future - spot;
    const basisPercent = (basis / spot) * 100;
    if (![basis, basisPercent].every(Number.isFinite)) return { valid:false, reason:"NUMERIC_RANGE" };
    return { valid:true, spot, future, basis:round(basis, 6), basisPercent:round(basisPercent, 4) };
  }

  function diPuSnapshot(candidate = {}) {
    const annualRate = boundedNumber(candidate.annualRate, -99.999, 1000);
    const businessDays = boundedNumber(candidate.businessDays, 1, 5000);
    const face = boundedNumber(candidate.face ?? 100000, 0.000001, 1e12);
    if (annualRate === null) return { valid:false, reason:"INVALID_DI_RATE" };
    if (businessDays === null || !Number.isInteger(businessDays)) return { valid:false, reason:"INVALID_BUSINESS_DAYS" };
    if (face === null) return { valid:false, reason:"INVALID_FACE" };
    const base = 1 + annualRate / 100;
    if (base <= 0) return { valid:false, reason:"INVALID_DI_RATE" };
    const pu = face / (base ** (businessDays / 252));
    if (!Number.isFinite(pu) || pu <= 0) return { valid:false, reason:"NUMERIC_RANGE" };
    return { valid:true, annualRate, businessDays, face, pu:round(pu, 2) };
  }

  function optionPayoff(candidate = {}) {
    const spot = boundedNumber(candidate.spot, 0, 1e12);
    const strike = boundedNumber(candidate.strike, 0.000001, 1e12);
    const premium = boundedNumber(candidate.premium, 0, 1e12);
    const contracts = boundedNumber(candidate.contracts ?? 1, 1, 1000000);
    const multiplier = boundedNumber(candidate.multiplier ?? 1, 0.000001, 1e9);
    const type = ["CALL", "PUT"].includes(candidate.type) ? candidate.type : null;
    const position = ["LONG", "SHORT"].includes(candidate.position) ? candidate.position : null;
    if (spot === null || strike === null || premium === null || contracts === null || multiplier === null || type === null || position === null || !Number.isInteger(contracts)) return { valid:false, reason:"INVALID_OPTION_INPUT" };
    const intrinsic = type === "CALL" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
    const longNetPerUnit = intrinsic - premium;
    const direction = position === "LONG" ? 1 : -1;
    const netPerUnit = longNetPerUnit * direction;
    const total = netPerUnit * contracts * multiplier;
    if (![intrinsic, netPerUnit, total].every(Number.isFinite)) return { valid:false, reason:"NUMERIC_RANGE" };
    return { valid:true, type, position, spot, strike, premium, intrinsic:round(intrinsic, 6), netPerUnit:round(netPerUnit, 6), total:round(total, 2) };
  }

  function blackScholesSnapshot(candidate = {}) {
    const spot = boundedNumber(candidate.spot, 0.000001, 1e12);
    const strike = boundedNumber(candidate.strike, 0.000001, 1e12);
    const annualRatePercent = boundedNumber(candidate.annualRatePercent, -100, 100);
    const volatilityPercent = boundedNumber(candidate.volatilityPercent, 0.01, 500);
    const days = boundedNumber(candidate.days, 1, 3650);
    const type = ["CALL", "PUT"].includes(candidate.type) ? candidate.type : null;
    if (spot === null || strike === null || annualRatePercent === null || volatilityPercent === null || days === null || type === null) return { valid:false, reason:"INVALID_MODEL_INPUT" };
    const t = days / 365;
    const r = annualRatePercent / 100;
    const sigma = volatilityPercent / 100;
    const sqrtT = Math.sqrt(t);
    const denom = sigma * sqrtT;
    if (!Number.isFinite(denom) || denom <= 0) return { valid:false, reason:"NUMERIC_RANGE" };
    const d1 = (Math.log(spot / strike) + (r + 0.5 * sigma * sigma) * t) / denom;
    const d2 = d1 - denom;
    const discount = Math.exp(-r * t);
    const callPrice = spot * normalCdf(d1) - strike * discount * normalCdf(d2);
    const putPrice = strike * discount * normalCdf(-d2) - spot * normalCdf(-d1);
    const price = type === "CALL" ? callPrice : putPrice;
    const delta = type === "CALL" ? normalCdf(d1) : normalCdf(d1) - 1;
    const gamma = normalPdf(d1) / (spot * sigma * sqrtT);
    const callThetaAnnual = -(spot * normalPdf(d1) * sigma) / (2 * sqrtT) - r * strike * discount * normalCdf(d2);
    const putThetaAnnual = -(spot * normalPdf(d1) * sigma) / (2 * sqrtT) + r * strike * discount * normalCdf(-d2);
    const thetaPerDay = (type === "CALL" ? callThetaAnnual : putThetaAnnual) / 365;
    const vegaPerVolPoint = (spot * normalPdf(d1) * sqrtT) / 100;
    const intrinsic = type === "CALL" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
    const timeValue = price - intrinsic;
    const values = [price, delta, gamma, thetaPerDay, vegaPerVolPoint, intrinsic, timeValue, d1, d2];
    if (!values.every(Number.isFinite) || price < 0) return { valid:false, reason:"NUMERIC_RANGE" };
    return {
      valid:true, type, spot, strike, annualRatePercent, volatilityPercent, days,
      price:round(price, 4), intrinsic:round(intrinsic, 4), timeValue:round(Math.max(0, timeValue), 4),
      delta:round(delta, 6), gamma:round(gamma, 6), thetaPerDay:round(thetaPerDay, 6), vegaPerVolPoint:round(vegaPerVolPoint, 6), d1:round(d1, 6), d2:round(d2, 6)
    };
  }

  function swapSimpleDifferential(candidate = {}) {
    const notional = boundedNumber(candidate.notional, 0.000001, 1e15);
    const receiveRate = boundedNumber(candidate.receiveRate, -100, 1000);
    const payRate = boundedNumber(candidate.payRate, -100, 1000);
    const years = boundedNumber(candidate.years, 0.000001, 100);
    if (notional === null || receiveRate === null || payRate === null || years === null) return { valid:false, reason:"INVALID_SWAP_INPUT" };
    const receiveAmount = notional * (receiveRate / 100) * years;
    const payAmount = notional * (payRate / 100) * years;
    const net = receiveAmount - payAmount;
    if (![receiveAmount, payAmount, net].every(Number.isFinite)) return { valid:false, reason:"NUMERIC_RANGE" };
    return { valid:true, notional, receiveRate, payRate, years, receiveAmount:round(receiveAmount, 2), payAmount:round(payAmount, 2), net:round(net, 2) };
  }

  function seededRandom(seed) {
    let state = (Number(seed) || 1) >>> 0;
    return function () {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createSession(seed = 1) {
    const normalizedSeed = Math.trunc(Number(seed) || 1);
    const random = seededRandom(normalizedSeed);
    const cases = CASES.map(item => item);
    for (let i = cases.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [cases[i], cases[j]] = [cases[j], cases[i]];
    }
    return { seed:normalizedSeed, cases:cases.slice(0, REQUIRED_CASES).map(item => ({ ...item, facts:[...item.facts] })) };
  }

  function findCase(caseId) {
    return CASES.find(item => item.id === caseId) || null;
  }

  function gradeCase(caseId, answer = {}) {
    const item = findCase(caseId);
    if (!item) return { score:0, passed:false, hardViolation:"UNKNOWN_CASE", checks:[], explanation:"Caso inválido." };
    const normalized = {
      interpretation:cleanText(answer.interpretation, 80),
      driver:cleanText(answer.driver, 80),
      action:cleanText(answer.action, 80),
      source:cleanText(answer.source, 80),
      rationale:cleanText(answer.rationale, 1200)
    };
    const checks = [
      { label:"Mecanismo / limite", points:30, passed:normalized.interpretation === item.expectedInterpretation },
      { label:"Fator dominante", points:25, passed:normalized.driver === item.expectedDriver },
      { label:"Próxima verificação", points:20, passed:normalized.action === item.expectedAction },
      { label:"Fonte institucional", points:15, passed:normalized.source === item.expectedSource },
      { label:"Justificativa auditável", points:10, passed:normalized.rationale.length >= 60 }
    ];
    let score = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
    let hardViolation = "";
    if (item.severity !== "NONE" && normalized.interpretation === "CONSISTENT_MECHANISM" && item.expectedInterpretation !== "CONSISTENT_MECHANISM") hardViolation = item.severity;
    const severeCap = new Set(["MARGIN_CAPS_LOSS", "SHORT_CALL_CAPPED"]);
    const modelCap = new Set(["VOLATILITY_GUARANTEES_DIRECTION", "DELTA_PROBABILITY", "MODEL_EXACT", "DI_RATE_PU_SAME_DIRECTION", "DAILY_SETTLEMENT_IGNORED", "OPTION_RIGHT_IGNORED"]);
    if (hardViolation && severeCap.has(hardViolation)) score = Math.min(score, 49);
    else if (hardViolation && modelCap.has(hardViolation)) score = Math.min(score, 69);
    return {
      score, passed:score >= PASS_SCORE && !hardViolation, hardViolation, checks, explanation:item.explanation,
      expectedInterpretation:item.expectedInterpretation, expectedDriver:item.expectedDriver, expectedAction:item.expectedAction, expectedSource:item.expectedSource
    };
  }

  function normalizeAttempt(candidate = {}) {
    const item = findCase(cleanText(candidate.caseId, 100));
    if (!item) return null;
    const answer = {
      interpretation:cleanText(candidate.answer?.interpretation, 80),
      driver:cleanText(candidate.answer?.driver, 80),
      action:cleanText(candidate.answer?.action, 80),
      source:cleanText(candidate.answer?.source, 80),
      rationale:cleanText(candidate.answer?.rationale, 1200)
    };
    const grade = gradeCase(item.id, answer);
    const timestampDate = new Date(candidate.timestamp || 0);
    const timestamp = Number.isFinite(timestampDate.getTime()) ? timestampDate.toISOString() : new Date(0).toISOString();
    return {
      sessionId:cleanText(candidate.sessionId, 120) || "unknown-session",
      seed:Math.trunc(Number(candidate.seed) || 1), timestamp, caseId:item.id, answer,
      score:grade.score, passed:grade.passed, hardViolation:grade.hardViolation
    };
  }

  function evaluateSession(attempts = []) {
    const normalized = attempts.map(normalizeAttempt).filter(Boolean);
    const unique = [];
    const seen = new Set();
    normalized.forEach(attempt => {
      if (!seen.has(attempt.caseId)) { seen.add(attempt.caseId); unique.push(attempt); }
    });
    const selected = unique.slice(0, REQUIRED_CASES);
    const completed = selected.length;
    const average = completed ? round(selected.reduce((sum, item) => sum + item.score, 0) / completed, 2) : 0;
    const hardViolations = selected.filter(item => Boolean(item.hardViolation)).length;
    return { completed, required:REQUIRED_CASES, average, hardViolations, passed:completed === REQUIRED_CASES && average >= PASS_SCORE && hardViolations === 0 };
  }

  function groupedSessions(history) {
    const groups = new Map();
    history.forEach(attempt => {
      if (!groups.has(attempt.sessionId)) groups.set(attempt.sessionId, []);
      groups.get(attempt.sessionId).push(attempt);
    });
    return [...groups.entries()].map(([sessionId, attempts]) => ({ sessionId, attempts, evaluation:evaluateSession(attempts), lastTimestamp:attempts[attempts.length - 1]?.timestamp || "" }));
  }

  function normalizeState(candidate = {}) {
    const all = (Array.isArray(candidate.history) ? candidate.history : []).map(normalizeAttempt).filter(Boolean).sort((a,b) => a.timestamp.localeCompare(b.timestamp));
    const sessions = groupedSessions(all).filter(session => session.evaluation.completed === REQUIRED_CASES);
    const best = sessions.reduce((winner, session) => !winner || session.evaluation.average > winner.evaluation.average || (session.evaluation.average === winner.evaluation.average && session.lastTimestamp > winner.lastTimestamp) ? session : winner, null);
    const passing = sessions.filter(session => session.evaluation.passed).sort((a,b) => b.lastTimestamp.localeCompare(a.lastTimestamp))[0] || null;
    const essentialSessionIds = new Set([best?.sessionId, passing?.sessionId].filter(Boolean));
    const essential = all.filter(attempt => essentialSessionIds.has(attempt.sessionId));
    const recentNonEssential = all.filter(attempt => !essentialSessionIds.has(attempt.sessionId)).slice(-(Math.max(0, MAX_HISTORY - essential.length)));
    const history = [...essential, ...recentNonEssential].sort((a,b) => a.timestamp.localeCompare(b.timestamp)).slice(-MAX_HISTORY);
    const retainedSessions = groupedSessions(history).filter(session => session.evaluation.completed === REQUIRED_CASES);
    const bestAverage = retainedSessions.reduce((max, session) => Math.max(max, session.evaluation.average), 0);
    const passed = retainedSessions.some(session => session.evaluation.passed);
    return { version:1, lastSeed:Math.trunc(Number(candidate.lastSeed) || 1), history, passed, bestAverage };
  }

  function recordAttempt(candidateState, attempt) {
    const state = normalizeState(candidateState);
    return normalizeState({ ...state, history:[...state.history, attempt] });
  }

  return {
    PASS_SCORE, REQUIRED_CASES, MAX_HISTORY, INTERPRETATIONS, DRIVERS, ACTIONS, SOURCES, CASES,
    futuresPnl, dailySettlement, basisSnapshot, diPuSnapshot, optionPayoff, blackScholesSnapshot, swapSimpleDifferential,
    createSession, findCase, gradeCase, evaluateSession, normalizeState, recordAttempt
  };
});
