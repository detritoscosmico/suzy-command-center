(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyEconomicsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;

  const INTERPRETATIONS = Object.freeze(["TIGHTENING_BIAS", "EASING_BIAS", "CONDITIONAL"]);
  const DRIVERS = Object.freeze([
    "INFLATION_SURPRISE",
    "PRICING_SURPRISE",
    "INFLATION_COMPOSITION",
    "ACTIVITY_LABOR",
    "GROWTH_SLOWDOWN",
    "FISCAL_TERM_PREMIUM",
    "EXTERNAL_FX",
    "SUPPLY_SHOCK",
    "REAL_RATE",
    "DATA_REVISION",
    "CURVE_EXPECTATIONS"
  ]);
  const ACTIONS = Object.freeze([
    "CHECK_EXPECTATIONS",
    "CHECK_PRICING",
    "CHECK_COMPOSITION",
    "CHECK_LAGS",
    "CHECK_INFLATION_PERSISTENCE",
    "CHECK_FISCAL",
    "CHECK_EXTERNAL",
    "CHECK_SECOND_ROUND",
    "CHECK_REAL_RATE",
    "CHECK_REVISIONS",
    "CHECK_CURVE"
  ]);

  const SOURCES = Object.freeze([
    { id: "BCB_COPOM", title: "BCB — Copom e política monetária", url: "https://www.bcb.gov.br/controleinflacao/copom" },
    { id: "BCB_TARGET", title: "BCB — metas para a inflação", url: "https://www.bcb.gov.br/controleinflacao/metainflacao" },
    { id: "BCB_FOCUS", title: "BCB — Relatório Focus", url: "https://www.bcb.gov.br/publicacoes/focus" },
    { id: "IBGE_IPCA", title: "IBGE — inflação e IPCA", url: "https://www.ibge.gov.br/explica/inflacao.php" },
    { id: "IBGE_PIB", title: "IBGE — Produto Interno Bruto", url: "https://www.ibge.gov.br/explica/pib.php" },
    { id: "IBGE_LABOR", title: "IBGE — desemprego e mercado de trabalho", url: "https://www.ibge.gov.br/explica/desemprego.php" },
    { id: "TESOURO", title: "Tesouro Transparente — política fiscal e dívida", url: "https://www.tesourotransparente.gov.br/" },
    { id: "FED_POLICY", title: "Federal Reserve — monetary policy", url: "https://www.federalreserve.gov/monetarypolicy.htm" }
  ]);

  const CASES = Object.freeze([
    {
      id: "inflation-above-consensus",
      title: "Inflação acima do consenso com expectativas pressionadas",
      facts: ["O IPCA veio acima do consenso.", "Expectativas de inflação para horizontes relevantes subiram nas últimas leituras.", "A atividade segue próxima do cenário-base."],
      expectedInterpretation: "TIGHTENING_BIAS", expectedDriver: "INFLATION_SURPRISE", expectedAction: "CHECK_EXPECTATIONS", expectedSource: "BCB_TARGET", severity: "OPPOSITE_SIGN",
      explanation: "Surpresa inflacionária e piora de expectativas aumentam a pressão por uma postura relativamente mais restritiva, sem determinar sozinhas a próxima decisão nem o movimento de um ativo."
    },
    {
      id: "fully-priced-rate-hike",
      title: "Alta de juros totalmente precificada",
      facts: ["O banco central elevou a taxa em 0,25 p.p.", "A mesma alta já estava integralmente precificada na curva antes da decisão.", "O comunicado trouxe linguagem muito próxima da esperada."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "PRICING_SURPRISE", expectedAction: "CHECK_PRICING", expectedSource: "BCB_COPOM", severity: "NO_DETERMINISTIC_CALL",
      explanation: "Nível e surpresa são coisas diferentes. Uma decisão restritiva no nível pode gerar pouca reação se já estiver precificada; é preciso comparar decisão, comunicação e curva com o consenso anterior."
    },
    {
      id: "headline-down-services-sticky",
      title: "Inflação cheia cai, serviços continuam resistentes",
      facts: ["A inflação cheia desacelerou por energia e alimentos.", "Serviços e medidas subjacentes permaneceram pressionados.", "As expectativas pouco mudaram."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "INFLATION_COMPOSITION", expectedAction: "CHECK_COMPOSITION", expectedSource: "IBGE_IPCA", severity: "NO_DETERMINISTIC_CALL",
      explanation: "A composição importa. Uma queda concentrada em itens voláteis não equivale automaticamente a desinflação persistente; serviços, núcleos, difusão e expectativas precisam ser examinados."
    },
    {
      id: "strong-growth-tight-labor",
      title: "Atividade forte e mercado de trabalho apertado",
      facts: ["O PIB surpreendeu para cima com expansão relativamente disseminada.", "O desemprego está baixo e salários reais aceleram.", "A inflação segue acima do objetivo."],
      expectedInterpretation: "TIGHTENING_BIAS", expectedDriver: "ACTIVITY_LABOR", expectedAction: "CHECK_LAGS", expectedSource: "IBGE_PIB", severity: "OPPOSITE_SIGN",
      explanation: "Atividade e trabalho fortes podem manter demanda e inflação de serviços resistentes. O efeito monetário tem defasagens, então a leitura correta exige avaliar o que já foi contratado pela política anterior."
    },
    {
      id: "weak-growth-rising-unemployment",
      title: "Crescimento fraco com desemprego em alta",
      facts: ["A atividade ficou abaixo do consenso por mais de uma leitura.", "O desemprego subiu e a criação de vagas perdeu força.", "As expectativas de inflação estão estáveis ou em queda."],
      expectedInterpretation: "EASING_BIAS", expectedDriver: "GROWTH_SLOWDOWN", expectedAction: "CHECK_INFLATION_PERSISTENCE", expectedSource: "IBGE_LABOR", severity: "OPPOSITE_SIGN",
      explanation: "Fraqueza de atividade e trabalho, com expectativas comportadas, reduz pressão de demanda e pode abrir espaço para postura relativamente menos restritiva; persistência inflacionária ainda precisa ser verificada."
    },
    {
      id: "fiscal-term-premium",
      title: "Risco fiscal pressiona a ponta longa",
      facts: ["A taxa básica não mudou.", "A percepção de trajetória fiscal piorou e os juros longos subiram.", "As condições de crédito ficaram mais apertadas."],
      expectedInterpretation: "TIGHTENING_BIAS", expectedDriver: "FISCAL_TERM_PREMIUM", expectedAction: "CHECK_FISCAL", expectedSource: "TESOURO", severity: "OPPOSITE_SIGN",
      explanation: "Condições financeiras podem apertar mesmo sem mudança da taxa básica. Prêmio de prazo, risco fiscal e custo de financiamento precisam ser separados da decisão corrente do banco central."
    },
    {
      id: "fx-depreciation-external-shock",
      title: "Depreciação cambial por choque externo",
      facts: ["A moeda doméstica depreciou rapidamente durante aversão global a risco.", "A atividade doméstica está fraca.", "Há risco de repasse cambial, mas magnitude e persistência são incertas."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "EXTERNAL_FX", expectedAction: "CHECK_EXTERNAL", expectedSource: "BCB_TARGET", severity: "NO_DETERMINISTIC_CALL",
      explanation: "Choques cambiais podem pressionar preços e, ao mesmo tempo, refletir condições externas adversas. É necessário avaliar repasse, expectativas, diferencial de juros e duração do choque antes de inferir a resposta de política."
    },
    {
      id: "oil-supply-shock",
      title: "Petróleo sobe por choque de oferta",
      facts: ["O preço do petróleo subiu fortemente por restrição de oferta.", "O país analisado é importador líquido de energia.", "O choque eleva custos enquanto reduz renda disponível de famílias e empresas."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "SUPPLY_SHOCK", expectedAction: "CHECK_SECOND_ROUND", expectedSource: "FED_POLICY", severity: "NO_DETERMINISTIC_CALL",
      explanation: "Choques de oferta podem elevar inflação e enfraquecer atividade simultaneamente. A resposta depende de efeitos de segunda ordem, expectativas e persistência, não apenas do primeiro impacto sobre preços."
    },
    {
      id: "nominal-cut-real-tightening",
      title: "Taxa nominal cai, taxa real ex ante sobe",
      facts: ["A taxa nominal caiu 1,0 p.p.", "No mesmo intervalo, a inflação esperada caiu 2,0 p.p.", "Outras condições permaneceram aproximadamente constantes."],
      expectedInterpretation: "TIGHTENING_BIAS", expectedDriver: "REAL_RATE", expectedAction: "CHECK_REAL_RATE", expectedSource: "BCB_COPOM", severity: "OPPOSITE_SIGN",
      explanation: "Pela aproximação simples taxa real ≈ taxa nominal menos inflação esperada, a taxa real ex ante sobe 1 p.p. neste exemplo. Um corte nominal não significa necessariamente afrouxamento em termos reais."
    },
    {
      id: "labor-data-revisions",
      title: "Dado forte com revisões relevantes",
      facts: ["O dado corrente de emprego veio forte.", "As duas leituras anteriores foram revisadas significativamente para baixo.", "Outros indicadores de atividade estão mistos."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "DATA_REVISION", expectedAction: "CHECK_REVISIONS", expectedSource: "IBGE_LABOR", severity: "NO_DETERMINISTIC_CALL",
      explanation: "Uma divulgação isolada pode ser enganosa quando revisões alteram o nível e a tendência. A análise deve incorporar série revisada, metodologia e confirmação cruzada."
    },
    {
      id: "negative-inflation-surprise",
      title: "Inflação abaixo do consenso com expectativas em queda",
      facts: ["A inflação veio abaixo do consenso em componentes disseminados.", "Expectativas para horizontes relevantes recuaram.", "A atividade está próxima da tendência estimada."],
      expectedInterpretation: "EASING_BIAS", expectedDriver: "INFLATION_SURPRISE", expectedAction: "CHECK_EXPECTATIONS", expectedSource: "BCB_FOCUS", severity: "OPPOSITE_SIGN",
      explanation: "Surpresa desinflacionária disseminada e expectativas menores reduzem pressão por restrição adicional. Isso é um viés macro relativo, não previsão automática de corte ou direção de mercado."
    },
    {
      id: "inverted-yield-curve",
      title: "Curva invertida tratada como cronômetro",
      facts: ["A curva de juros está invertida.", "Um relatório afirma que isso garante recessão imediata e queda de ações no mês seguinte.", "Não há análise de prêmio de prazo, expectativas ou contexto de política."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "CURVE_EXPECTATIONS", expectedAction: "CHECK_CURVE", expectedSource: "FED_POLICY", severity: "NO_DETERMINISTIC_CALL",
      explanation: "A curva contém informação sobre expectativas e prêmio de prazo, mas não é um cronômetro determinístico. Horizonte, composição da curva e contexto importam antes de qualquer conclusão."
    }
  ]);

  function cleanText(value, maximum = 1000) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function finiteNumber(value, minimum = -1000000, maximum = 1000000) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function summarizeMacroSnapshot(candidate = {}) {
    const nominalRate = finiteNumber(candidate.nominalRate, -100, 100);
    const expectedInflation = finiteNumber(candidate.expectedInflation, -100, 100);
    const actualInflation = finiteNumber(candidate.actualInflation, -100, 100);
    const consensusInflation = finiteNumber(candidate.consensusInflation, -100, 100);
    const actualGrowth = finiteNumber(candidate.actualGrowth, -100, 100);
    const consensusGrowth = finiteNumber(candidate.consensusGrowth, -100, 100);
    const realRateApprox = Number((nominalRate - expectedInflation).toFixed(2));
    const inflationSurprise = Number((actualInflation - consensusInflation).toFixed(2));
    const growthSurprise = Number((actualGrowth - consensusGrowth).toFixed(2));
    let signal = "MIXED";
    if (inflationSurprise >= 0.1 && growthSurprise >= -0.1) signal = "HOTTER";
    else if (inflationSurprise <= -0.1 && growthSurprise <= 0.1) signal = "COOLER";
    return { nominalRate, expectedInflation, actualInflation, consensusInflation, actualGrowth, consensusGrowth, realRateApprox, inflationSurprise, growthSurprise, signal };
  }

  function normalizeSeed(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.abs(Math.trunc(number)) || 1 : 1;
  }

  function randomFactory(seed) {
    let state = normalizeSeed(seed) >>> 0;
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function createSession(seed = 1, count = REQUIRED_CASES) {
    const normalizedSeed = normalizeSeed(seed);
    const random = randomFactory(normalizedSeed);
    const cases = [...CASES];
    for (let index = cases.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [cases[index], cases[target]] = [cases[target], cases[index]];
    }
    const size = Math.min(CASES.length, Math.max(1, Math.trunc(Number(count) || REQUIRED_CASES)));
    return { seed: normalizedSeed, cases: cases.slice(0, size) };
  }

  function findCase(caseId) {
    return CASES.find(item => item.id === caseId) || null;
  }

  function normalizeAnswer(candidate = {}) {
    const interpretation = cleanText(candidate.interpretation, 40);
    const driver = cleanText(candidate.driver, 50);
    const action = cleanText(candidate.action, 50);
    const source = cleanText(candidate.source, 40);
    return {
      interpretation: INTERPRETATIONS.includes(interpretation) ? interpretation : "",
      driver: DRIVERS.includes(driver) ? driver : "",
      action: ACTIONS.includes(action) ? action : "",
      source: SOURCES.some(item => item.id === source) ? source : "",
      rationale: cleanText(candidate.rationale, 1200)
    };
  }

  function gradeCase(caseId, candidateAnswer = {}) {
    const item = findCase(caseId);
    if (!item) throw new Error("Caso macroeconômico desconhecido.");
    const answer = normalizeAnswer(candidateAnswer);
    const checks = [
      { id: "interpretation", label: "Leitura macro", points: 35, passed: answer.interpretation === item.expectedInterpretation },
      { id: "driver", label: "Motor dominante", points: 25, passed: answer.driver === item.expectedDriver },
      { id: "action", label: "Próxima verificação", points: 20, passed: answer.action === item.expectedAction },
      { id: "source", label: "Fonte primária", points: 10, passed: answer.source === item.expectedSource },
      { id: "rationale", label: "Justificativa auditável", points: 10, passed: answer.rationale.length >= 60 }
    ];
    let score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
    let hardViolation = "";
    const opposite = (item.expectedInterpretation === "TIGHTENING_BIAS" && answer.interpretation === "EASING_BIAS") ||
      (item.expectedInterpretation === "EASING_BIAS" && answer.interpretation === "TIGHTENING_BIAS");
    if (item.severity === "OPPOSITE_SIGN" && opposite) {
      hardViolation = "A resposta inverteu o sinal macro central descrito pelo caso.";
      score = Math.min(score, 49);
    } else if (item.severity === "NO_DETERMINISTIC_CALL" && answer.interpretation !== "CONDITIONAL") {
      hardViolation = "A resposta transformou um cenário condicional em chamada macro determinística.";
      score = Math.min(score, 69);
    }
    return {
      caseId: item.id,
      answer,
      checks,
      score,
      passed: score >= PASS_SCORE && !hardViolation,
      hardViolation,
      expectedInterpretation: item.expectedInterpretation,
      expectedDriver: item.expectedDriver,
      expectedAction: item.expectedAction,
      expectedSource: item.expectedSource,
      explanation: item.explanation
    };
  }

  function normalizeTimestamp(value) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }

  function normalizeAttempt(candidate = {}) {
    const item = findCase(cleanText(candidate.caseId, 80));
    const timestamp = normalizeTimestamp(candidate.timestamp);
    const sessionId = cleanText(candidate.sessionId, 100);
    if (!item || !timestamp || !sessionId) return null;
    const grade = gradeCase(item.id, candidate.answer);
    return {
      id: cleanText(candidate.id, 120) || `${sessionId}-${item.id}`,
      sessionId,
      seed: normalizeSeed(candidate.seed),
      timestamp,
      caseId: item.id,
      answer: grade.answer,
      score: grade.score,
      passed: grade.passed,
      hardViolation: grade.hardViolation
    };
  }

  function evaluateNormalizedSession(attempts = []) {
    const unique = new Map();
    attempts.forEach(attempt => unique.set(attempt.caseId, attempt));
    const results = [...unique.values()];
    const completed = results.length;
    const average = completed ? Number((results.reduce((sum, item) => sum + item.score, 0) / completed).toFixed(1)) : 0;
    const hardViolations = results.filter(item => item.hardViolation).length;
    return { completed, required: REQUIRED_CASES, average, hardViolations, passed: completed >= REQUIRED_CASES && average >= PASS_SCORE && hardViolations === 0 };
  }

  function summarizeNormalizedSessions(history = []) {
    const groups = new Map();
    history.forEach(attempt => {
      if (!groups.has(attempt.sessionId)) groups.set(attempt.sessionId, []);
      groups.get(attempt.sessionId).push(attempt);
    });
    return [...groups.entries()].map(([sessionId, attempts]) => ({
      sessionId,
      lastTimestamp: attempts.reduce((latest, attempt) => attempt.timestamp > latest ? attempt.timestamp : latest, ""),
      ...evaluateNormalizedSession(attempts)
    }));
  }

  function normalizeHistory(history = []) {
    if (!Array.isArray(history)) return [];
    const bySessionCase = new Map();
    history.map(normalizeAttempt).filter(Boolean).forEach(attempt => bySessionCase.set(`${attempt.sessionId}:${attempt.caseId}`, attempt));
    const normalized = [...bySessionCase.values()].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
    if (normalized.length <= MAX_HISTORY) return normalized;

    const completedSessions = summarizeNormalizedSessions(normalized).filter(session => session.completed >= REQUIRED_CASES);
    const bestSession = completedSessions.reduce((best, session) => {
      if (!best || session.average > best.average) return session;
      if (session.average === best.average && session.lastTimestamp > best.lastTimestamp) return session;
      return best;
    }, null);
    const latestPassingSession = completedSessions.filter(session => session.passed)
      .reduce((latest, session) => !latest || session.lastTimestamp > latest.lastTimestamp ? session : latest, null);
    const preservedSessionIds = new Set([bestSession?.sessionId, latestPassingSession?.sessionId].filter(Boolean));
    const preserved = normalized.filter(attempt => preservedSessionIds.has(attempt.sessionId));
    const recent = normalized.filter(attempt => !preservedSessionIds.has(attempt.sessionId)).slice(-(MAX_HISTORY - preserved.length));
    return [...preserved, ...recent].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }

  function evaluateSession(attempts = []) {
    return evaluateNormalizedSession(normalizeHistory(attempts));
  }

  function summarizeSessions(history = []) {
    return summarizeNormalizedSessions(normalizeHistory(history)).map(({ lastTimestamp, ...session }) => session);
  }

  function normalizeState(candidate = {}) {
    const history = normalizeHistory(candidate.history);
    const sessions = summarizeSessions(history);
    return {
      version: 1,
      history,
      lastSeed: normalizeSeed(candidate.lastSeed),
      passed: sessions.some(session => session.passed),
      bestAverage: sessions.reduce((best, session) => Math.max(best, session.completed >= REQUIRED_CASES ? session.average : 0), 0)
    };
  }

  function recordAttempt(candidateState = {}, meta = {}) {
    const state = normalizeState(candidateState);
    const attempt = normalizeAttempt({
      id: meta.id,
      sessionId: meta.sessionId,
      seed: meta.seed,
      timestamp: meta.timestamp || new Date().toISOString(),
      caseId: meta.caseId,
      answer: meta.answer
    });
    if (!attempt) throw new Error("Tentativa macroeconômica inválida.");
    return normalizeState({ ...state, lastSeed: attempt.seed, history: [...state.history, attempt] });
  }

  return {
    PASS_SCORE,
    REQUIRED_CASES,
    MAX_HISTORY,
    INTERPRETATIONS,
    DRIVERS,
    ACTIONS,
    SOURCES,
    CASES,
    summarizeMacroSnapshot,
    createSession,
    findCase,
    normalizeAnswer,
    gradeCase,
    normalizeAttempt,
    normalizeHistory,
    evaluateSession,
    summarizeSessions,
    normalizeState,
    recordAttempt
  };
});
