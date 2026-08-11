(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyFinancialsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;

  const INTERPRETATIONS = Object.freeze(["QUALITY_STRENGTHENED", "QUALITY_WEAKENED", "CONDITIONAL"]);
  const DRIVERS = Object.freeze([
    "MARGIN_MIX",
    "WORKING_CAPITAL",
    "PAYABLES_STRETCH",
    "ACQUISITION_FUNDING",
    "IMPAIRMENT_NONCASH",
    "CAPITALIZATION_POLICY",
    "ONE_OFF_GAIN",
    "INVENTORY_QUALITY",
    "LEVERAGED_BUYBACK",
    "RESTATEMENT",
    "GROWTH_CAPEX",
    "FX_TRANSLATION"
  ]);
  const ACTIONS = Object.freeze([
    "CHECK_SEGMENTS",
    "CHECK_CFO_RECONCILIATION",
    "CHECK_WORKING_CAPITAL",
    "CHECK_DEBT_MATURITY",
    "CHECK_NOTES",
    "CHECK_CAPITALIZATION",
    "CHECK_RECURRING",
    "CHECK_INVENTORY",
    "CHECK_CAPITAL_ALLOCATION",
    "CHECK_RESTATED",
    "CHECK_CAPEX_NATURE",
    "CHECK_FX_EFFECT"
  ]);

  const SOURCES = Object.freeze([
    { id: "CVM_COMPANIES", title: "CVM — informações periódicas de companhias", url: "https://www.gov.br/cvm/pt-br/assuntos/regulados/consultas-por-participante/companhias" },
    { id: "CPC_PRONOUNCEMENTS", title: "CPC — pronunciamentos contábeis", url: "https://www.cpc.org.br/CPC/Documentos-Emitidos/Pronunciamentos" },
    { id: "CPC03", title: "CPC 03 — Demonstração dos Fluxos de Caixa", url: "https://www.cpc.org.br/CPC/Documentos-Emitidos/Pronunciamentos" },
    { id: "CPC26", title: "CPC 26 — Apresentação das Demonstrações Contábeis", url: "https://www.cpc.org.br/CPC/Documentos-Emitidos/Pronunciamentos" },
    { id: "IFRS_IAS7", title: "IFRS Foundation — IAS 7 Statement of Cash Flows", url: "https://www.ifrs.org/issued-standards/list-of-standards/ias-7-statement-of-cash-flows.html/" },
    { id: "IFRS18", title: "IFRS Foundation — IFRS 18 Presentation and Disclosure", url: "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-18-presentation-and-disclosure-in-financial-statements/" }
  ]);

  const CASES = Object.freeze([
    {
      id: "revenue-up-margin-up",
      title: "Receita cresce com expansão de margem operacional",
      facts: ["A receita cresceu 12% no período.", "O lucro operacional avançou 28% e a margem subiu de 14% para 16%.", "A melhora aparece nos principais segmentos e não há item não recorrente material identificado no resumo apresentado."],
      expectedInterpretation: "QUALITY_STRENGTHENED", expectedDriver: "MARGIN_MIX", expectedAction: "CHECK_SEGMENTS", expectedSource: "CVM_COMPANIES", severity: "OPPOSITE_QUALITY",
      explanation: "Crescimento acompanhado de expansão de margem e sem item não recorrente material identificado fortalece a consistência observada. A conclusão ainda deve ser confirmada por segmentos, preço, volume, custos e recorrência."
    },
    {
      id: "profit-and-cfo-rise",
      title: "Lucro e caixa operacional avançam de forma alinhada",
      facts: ["O lucro líquido aumentou 18%.", "O fluxo de caixa operacional cresceu 22% no mesmo período.", "Contas a receber e estoques evoluíram em linha com a receita, sem distorção relevante de capital de giro identificada no resumo apresentado."],
      expectedInterpretation: "QUALITY_STRENGTHENED", expectedDriver: "WORKING_CAPITAL", expectedAction: "CHECK_CFO_RECONCILIATION", expectedSource: "CPC03", severity: "OPPOSITE_QUALITY",
      explanation: "Lucro e caixa operacional avançando de forma coerente, sem distorção relevante de capital de giro identificada, reforçam a qualidade observada. A reconciliação do caixa e os componentes recorrentes ainda precisam ser verificados."
    },
    {
      id: "cfo-boosted-by-payables",
      title: "Caixa operacional melhora por alongamento de fornecedores",
      facts: ["O caixa operacional cresceu fortemente.", "O principal fator foi aumento expressivo de contas a pagar.", "Receita e lucro operacional ficaram praticamente estáveis."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "PAYABLES_STRETCH", expectedAction: "CHECK_WORKING_CAPITAL", expectedSource: "CPC03", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "Aumento de fornecedores pode elevar temporariamente o caixa operacional sem representar melhora estrutural. É preciso avaliar prazo, recorrência, condições comerciais e reversão futura do capital de giro."
    },
    {
      id: "acquisition-debt-jump",
      title: "Dívida aumenta para financiar aquisição",
      facts: ["A dívida bruta dobrou após uma aquisição relevante.", "A operação incorporou ativos e geração de caixa adicionais.", "Ainda não há histórico suficiente para avaliar sinergias e integração."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "ACQUISITION_FUNDING", expectedAction: "CHECK_DEBT_MATURITY", expectedSource: "CVM_COMPANIES", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "Mais dívida não é, isoladamente, prova de deterioração ou criação de valor. É necessário comparar geração de caixa adquirida, vencimentos, custo da dívida, covenants, integração e retorno efetivo."
    },
    {
      id: "impairment-noncash",
      title: "Impairment reduz lucro sem saída corrente de caixa",
      facts: ["A companhia reconheceu perda relevante por impairment.", "O ajuste reduziu o lucro contábil do período.", "A despesa não representa desembolso de caixa no reconhecimento."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "IMPAIRMENT_NONCASH", expectedAction: "CHECK_NOTES", expectedSource: "CPC_PRONOUNCEMENTS", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "O impairment é não caixa no momento do reconhecimento, mas pode revelar deterioração das expectativas econômicas de ativos. A nota explicativa, premissas e unidades geradoras de caixa são essenciais."
    },
    {
      id: "capitalized-development-costs",
      title: "Capitalização eleva lucro corrente",
      facts: ["Parte relevante dos gastos de desenvolvimento passou a ser capitalizada.", "O lucro corrente ficou maior do que seria com reconhecimento integral como despesa.", "O fluxo de caixa total não melhora apenas por essa classificação contábil."],
      expectedInterpretation: "QUALITY_WEAKENED", expectedDriver: "CAPITALIZATION_POLICY", expectedAction: "CHECK_CAPITALIZATION", expectedSource: "CPC_PRONOUNCEMENTS", severity: "OPPOSITE_QUALITY",
      explanation: "Capitalizar custos pode deslocar reconhecimento de despesa para períodos futuros. A análise deve verificar critérios, consistência da política, amortização e sensibilidade do lucro à classificação."
    },
    {
      id: "asset-sale-one-off",
      title: "Venda de ativo impulsiona lucro líquido",
      facts: ["O lucro líquido cresceu 40%.", "Grande parte da variação veio de ganho na venda de um ativo não recorrente.", "O lucro operacional recorrente ficou estável."],
      expectedInterpretation: "QUALITY_WEAKENED", expectedDriver: "ONE_OFF_GAIN", expectedAction: "CHECK_RECURRING", expectedSource: "CPC26", severity: "OPPOSITE_QUALITY",
      explanation: "Ganho não recorrente pode elevar o lucro sem indicar melhora da operação principal. A comparação deve separar recorrência, natureza do item e efeito sobre métricas operacionais."
    },
    {
      id: "inventory-current-ratio",
      title: "Liquidez corrente alta concentrada em estoque",
      facts: ["O índice de liquidez corrente é elevado.", "Grande parte do ativo circulante está em estoques.", "Há aumento de itens de baixa rotação e descontos comerciais."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "INVENTORY_QUALITY", expectedAction: "CHECK_INVENTORY", expectedSource: "CPC_PRONOUNCEMENTS", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "Liquidez corrente não mede a convertibilidade de cada ativo. Estoque lento ou sujeito a redução ao valor realizável pode tornar o índice menos informativo sem análise de composição e giro."
    },
    {
      id: "leveraged-buyback",
      title: "Recompra de ações financiada por dívida",
      facts: ["A companhia recomprou ações em volume relevante.", "A recompra foi parcialmente financiada por nova dívida.", "O lucro por ação aumentou, enquanto a alavancagem também subiu."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "LEVERAGED_BUYBACK", expectedAction: "CHECK_CAPITAL_ALLOCATION", expectedSource: "CVM_COMPANIES", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "A recompra pode alterar métricas por ação mecanicamente e mudar o risco financeiro. É preciso separar redução do denominador, custo de capital, preço pago e sustentabilidade da estrutura de capital."
    },
    {
      id: "restated-comparatives",
      title: "Comparativos foram reapresentados",
      facts: ["A empresa reapresentou números do exercício anterior.", "A série histórica usada em uma análise antiga não coincide com os comparativos atuais.", "As notas explicam mudança de política ou correção de erro."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "RESTATEMENT", expectedAction: "CHECK_RESTATED", expectedSource: "CPC26", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "Comparações devem usar bases consistentes. Quando há reapresentação, a série revisada e a nota de reconciliação precisam substituir números antigos antes de calcular tendências."
    },
    {
      id: "growth-capex-negative-fcf",
      title: "Fluxo de caixa livre negativo por expansão",
      facts: ["O caixa operacional é positivo e crescente.", "O capex aumentou fortemente com construção de nova capacidade.", "O fluxo de caixa livre aproximado ficou negativo no período."],
      expectedInterpretation: "CONDITIONAL", expectedDriver: "GROWTH_CAPEX", expectedAction: "CHECK_CAPEX_NATURE", expectedSource: "IFRS_IAS7", severity: "NO_DETERMINISTIC_CONCLUSION",
      explanation: "FCF negativo pode refletir expansão, manutenção insuficiente ou destruição de caixa. É necessário separar natureza do investimento, retorno esperado, cronograma e necessidade recorrente de capital."
    },
    {
      id: "fx-translation-cash",
      title: "Variação cambial altera saldos sem equivaler a caixa operacional",
      facts: ["A companhia possui operações relevantes no exterior.", "A conversão cambial alterou saldos reportados e patrimônio.", "A análise atribui toda a variação ao desempenho operacional do período."],
      expectedInterpretation: "QUALITY_WEAKENED", expectedDriver: "FX_TRANSLATION", expectedAction: "CHECK_FX_EFFECT", expectedSource: "CPC_PRONOUNCEMENTS", severity: "OPPOSITE_QUALITY",
      explanation: "Conversão cambial e desempenho operacional são efeitos distintos. A leitura deve separar moeda funcional, efeitos de tradução, transações em moeda estrangeira e fluxos efetivamente realizados."
    }
  ]);

  function cleanText(value, maximum = 1000) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function finiteNumber(value, minimum = -1000000000000, maximum = 1000000000000) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function safeRatio(numerator, denominator, multiplier = 1) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return Number(((numerator / denominator) * multiplier).toFixed(2));
  }

  function summarizeFinancialSnapshot(candidate = {}) {
    const revenue = finiteNumber(candidate.revenue);
    const grossProfit = finiteNumber(candidate.grossProfit);
    const operatingProfit = finiteNumber(candidate.operatingProfit);
    const netIncome = finiteNumber(candidate.netIncome);
    const operatingCashFlow = finiteNumber(candidate.operatingCashFlow);
    const capex = finiteNumber(candidate.capex, 0);
    const currentAssets = finiteNumber(candidate.currentAssets);
    const currentLiabilities = finiteNumber(candidate.currentLiabilities);
    const totalDebt = finiteNumber(candidate.totalDebt, 0);
    const cash = finiteNumber(candidate.cash, 0);
    const equity = finiteNumber(candidate.equity);
    const grossMargin = safeRatio(grossProfit, revenue, 100);
    const operatingMargin = safeRatio(operatingProfit, revenue, 100);
    const netMargin = safeRatio(netIncome, revenue, 100);
    const freeCashFlowApprox = Number((operatingCashFlow - capex).toFixed(2));
    const currentRatio = safeRatio(currentAssets, currentLiabilities);
    const netDebt = Number((totalDebt - cash).toFixed(2));
    const netDebtToEquity = safeRatio(netDebt, equity);
    const cashToIncome = safeRatio(operatingCashFlow, netIncome);
    let cashBridge = "MIXED";
    if (netIncome > 0 && operatingCashFlow >= netIncome * 1.1) cashBridge = "CASH_AHEAD";
    else if (netIncome > 0 && operatingCashFlow <= netIncome * 0.8) cashBridge = "PROFIT_AHEAD";
    else if (netIncome < 0 && operatingCashFlow > 0) cashBridge = "DIVERGENT_SIGNS";
    return { revenue, grossProfit, operatingProfit, netIncome, operatingCashFlow, capex, currentAssets, currentLiabilities, totalDebt, cash, equity, grossMargin, operatingMargin, netMargin, freeCashFlowApprox, currentRatio, netDebt, netDebtToEquity, cashToIncome, cashBridge };
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
    if (!item) throw new Error("Caso de demonstrações financeiras desconhecido.");
    const answer = normalizeAnswer(candidateAnswer);
    const checks = [
      { id: "interpretation", label: "Leitura da qualidade", points: 35, passed: answer.interpretation === item.expectedInterpretation },
      { id: "driver", label: "Motor contábil dominante", points: 25, passed: answer.driver === item.expectedDriver },
      { id: "action", label: "Próxima verificação", points: 20, passed: answer.action === item.expectedAction },
      { id: "source", label: "Fonte primária", points: 10, passed: answer.source === item.expectedSource },
      { id: "rationale", label: "Justificativa auditável", points: 10, passed: answer.rationale.length >= 60 }
    ];
    let score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
    let hardViolation = "";
    const opposite = (item.expectedInterpretation === "QUALITY_STRENGTHENED" && answer.interpretation === "QUALITY_WEAKENED") ||
      (item.expectedInterpretation === "QUALITY_WEAKENED" && answer.interpretation === "QUALITY_STRENGTHENED");
    if (item.severity === "OPPOSITE_QUALITY" && opposite) {
      hardViolation = "A resposta inverteu a leitura central de qualidade/consistência descrita pelo caso.";
      score = Math.min(score, 49);
    } else if (item.severity === "NO_DETERMINISTIC_CONCLUSION" && answer.interpretation !== "CONDITIONAL") {
      hardViolation = "A resposta transformou um caso que exige notas e reconciliação em conclusão determinística.";
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
    if (!attempt) throw new Error("Tentativa de demonstrações financeiras inválida.");
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
    summarizeFinancialSnapshot,
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