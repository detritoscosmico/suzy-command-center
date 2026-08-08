(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyCapstoneCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 4;
  const CASES = Object.freeze([
    {
      id: "macro-window-eurusd",
      title: "EUR/USD antes de dado de alto impacto",
      market: "EUR/USD • Londres/Nova York",
      facts: ["Tendência intradiária de alta", "Pullback chegou à zona planejada", "Evento de alto impacto para USD em 3 minutos", "Spread atual dentro do limite"],
      policy: { maxRiskPct: 0.5, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: true,
      blocker: "Evento macro de alto impacto dentro da janela de bloqueio de 5 minutos.",
      outcome: "Desfecho artificial: o preço acelera para cima e depois devolve o movimento em segundos. A direção não altera a nota do caso."
    },
    {
      id: "wide-spread-gold",
      title: "Ouro com spread fora da política",
      market: "XAU/USD • abertura americana",
      facts: ["Setup técnico completo", "Liquidez classificada como normal", "Spread artificial: 3,8 pontos", "Política do caso: spread máximo 2 pontos"],
      policy: { maxRiskPct: 0.5, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: true,
      blocker: "Spread de 3,8 pontos excede o máximo de 2 pontos definido para o caso.",
      outcome: "Desfecho artificial: o alvo técnico seria atingido. Mesmo assim, operar contra o limite de spread continua sendo quebra de processo."
    },
    {
      id: "thin-liquidity-nvda",
      title: "NVDA em cenário de liquidez rasa",
      market: "NVDA • sessão regular",
      facts: ["Rompimento confirmado no gráfico artificial", "Spread dentro do limite", "Liquidez classificada como rasa", "Política exige liquidez normal ou profunda"],
      policy: { maxRiskPct: 0.75, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: true,
      blocker: "Liquidez do cenário está abaixo do mínimo permitido pela política.",
      outcome: "Desfecho artificial: ocorre fill parcial e o restante não executa. O caso mede respeito ao bloqueio, não oportunidade perdida."
    },
    {
      id: "clean-pullback-aapl",
      title: "AAPL com condições dentro da política",
      market: "AAPL • sessão regular",
      facts: ["Pullback em tendência definida", "Sem evento de alto impacto na janela", "Spread 1,1 ponto para limite de 2", "Liquidez normal", "Gatilho observável disponível"],
      policy: { maxRiskPct: 0.75, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: false,
      blocker: "Nenhum bloqueio obrigatório está presente. Operar ou não operar pode ser válido se o processo estiver documentado.",
      outcome: "Desfecho artificial: o mercado toca o stop antes de retomar a direção original. Resultado negativo não torna o processo automaticamente ruim."
    },
    {
      id: "clean-range-btc",
      title: "BTC em range com setup definido",
      market: "BTC/USD • cenário 24/7 artificial",
      facts: ["Range bem delimitado", "Rejeição na borda inferior confirmada", "Spread e liquidez dentro dos limites", "Nenhum bloqueio de evento configurado", "Invalidação pode ser definida fora do range"],
      policy: { maxRiskPct: 0.5, maxSpreadPoints: 2.5, macroBlockMinutes: 0, minimumLiquidity: "NORMAL" },
      blocked: false,
      blocker: "Nenhum bloqueio obrigatório. A escolha de ficar de fora continua válida quando justificada.",
      outcome: "Desfecho artificial: o preço permanece lateral e encerra próximo da entrada. A nota continua baseada apenas no processo prévio."
    },
    {
      id: "missing-trigger-sp500",
      title: "S&P 500 com contexto, mas sem gatilho",
      market: "S&P 500 • cenário artificial",
      facts: ["Contexto de tendência favorável", "Zona de interesse alcançada", "Candle de confirmação ainda não fechou", "Política exige gatilho fechado antes da entrada", "Spread e liquidez adequados"],
      policy: { maxRiskPct: 0.5, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: true,
      blocker: "Gatilho obrigatório ainda não existe; antecipar a entrada viola o processo do caso.",
      outcome: "Desfecho artificial: o preço parte sem confirmar e segue na direção esperada. FOMO não transforma antecipação em processo correto."
    },
    {
      id: "gap-tesla",
      title: "Tesla após gap e volatilidade extrema",
      market: "TSLA • abertura artificial",
      facts: ["Gap de abertura acima da região planejada", "Volatilidade classificada como extrema", "Slippage estimado acima do limite", "Política exige aguardar normalização antes de nova ordem"],
      policy: { maxRiskPct: 0.5, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: true,
      blocker: "Volatilidade e slippage ultrapassam a condição autorizada pelo plano do caso.",
      outcome: "Desfecho artificial: o preço continua acelerando após o gap. Perder uma oportunidade é aceitável; quebrar uma regra explícita não é."
    },
    {
      id: "clean-vale",
      title: "VALE3 com cenário completo e risco pequeno",
      market: "VALE3 • sessão regular",
      facts: ["Estrutura e gatilho confirmados", "Liquidez normal", "Spread abaixo do teto", "Sem evento bloqueador", "Stop técnico definido antes da decisão"],
      policy: { maxRiskPct: 0.5, maxSpreadPoints: 2, macroBlockMinutes: 5, minimumLiquidity: "NORMAL" },
      blocked: false,
      blocker: "Nenhum bloqueio obrigatório. O caso aceita TRADE ou NO_TRADE com justificativa coerente.",
      outcome: "Desfecho artificial: o preço atinge +1,4R e depois retorna. O múltiplo não participa da rubrica do capstone."
    }
  ]);

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function cleanText(value, maximum = 600) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function seededRandom(seed) {
    let state = (Math.floor(finite(seed, 42)) >>> 0) || 42;
    return function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createCaseSet(seed = 42, count = REQUIRED_CASES) {
    const random = seededRandom(seed);
    const shuffled = CASES.map(item => ({ ...item, facts: [...item.facts], policy: { ...item.policy } }));
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    return shuffled.slice(0, Math.min(CASES.length, Math.max(1, Math.floor(finite(count, REQUIRED_CASES)))));
  }

  function normalizeResponse(candidate = {}) {
    return {
      action: String(candidate.action).toUpperCase() === "TRADE" ? "TRADE" : "NO_TRADE",
      blockerAssessment: String(candidate.blockerAssessment).toUpperCase() === "BLOCKED" ? "BLOCKED" : "CLEAR",
      riskPercent: Math.max(0, finite(candidate.riskPercent)),
      trigger: cleanText(candidate.trigger, 240),
      invalidation: cleanText(candidate.invalidation, 240),
      rationale: cleanText(candidate.rationale, 800),
      acceptsUncertainty: candidate.acceptsUncertainty === true
    };
  }

  function evaluateCase(scenario, candidateResponse = {}) {
    if (!scenario || !scenario.id) throw new Error("Caso inválido.");
    const response = normalizeResponse(candidateResponse);
    const isTrade = response.action === "TRADE";
    const expectedBlockerAssessment = scenario.blocked ? "BLOCKED" : "CLEAR";
    const checks = [
      {
        id: "decision",
        label: "Decisão respeita bloqueios obrigatórios",
        weight: 25,
        passed: !scenario.blocked || response.action === "NO_TRADE"
      },
      {
        id: "blocker",
        label: "Leitura de bloqueadores coerente com os fatos",
        weight: 15,
        passed: response.blockerAssessment === expectedBlockerAssessment
      },
      {
        id: "risk",
        label: "Risco respeita o teto do caso",
        weight: 15,
        passed: !isTrade || (response.riskPercent > 0 && response.riskPercent <= scenario.policy.maxRiskPct)
      },
      {
        id: "trigger",
        label: "Gatilho é documentado antes da entrada",
        weight: 10,
        passed: !isTrade || response.trigger.length >= 12
      },
      {
        id: "invalidation",
        label: "Invalidação é documentada antes da entrada",
        weight: 10,
        passed: !isTrade || response.invalidation.length >= 12
      },
      {
        id: "rationale",
        label: "Justificativa registra o processo",
        weight: 15,
        passed: response.rationale.length >= 40
      },
      {
        id: "uncertainty",
        label: "Incerteza é reconhecida explicitamente",
        weight: 10,
        passed: response.acceptsUncertainty
      }
    ];
    let score = checks.filter(check => check.passed).reduce((sum, check) => sum + check.weight, 0);
    const hardViolations = [];
    if (scenario.blocked && isTrade) hardViolations.push("Operação escolhida apesar de bloqueio obrigatório explícito.");
    if (isTrade && response.riskPercent > scenario.policy.maxRiskPct) hardViolations.push("Risco escolhido acima do teto do caso.");
    if (scenario.blocked && isTrade) score = Math.min(score, 49);
    else if (hardViolations.length) score = Math.min(score, 69);
    const passed = score >= PASS_SCORE && hardViolations.length === 0;

    return {
      scenarioId: scenario.id,
      response,
      score,
      passed,
      checks,
      hardViolations,
      outcome: scenario.outcome,
      blockerExplanation: scenario.blocker,
      rubricVersion: 1
    };
  }

  function evaluateCapstone(attempts = []) {
    const valid = Array.isArray(attempts)
      ? attempts.filter(item => item && Number.isFinite(Number(item.score)))
      : [];
    const total = valid.length;
    const passedCases = valid.filter(item => item.passed).length;
    const hardViolations = valid.reduce((sum, item) => sum + (Array.isArray(item.hardViolations) ? item.hardViolations.length : 0), 0);
    const averageScore = total ? Math.round(valid.reduce((sum, item) => sum + Number(item.score), 0) / total) : 0;
    const completed = total >= REQUIRED_CASES;
    const passed = completed && passedCases === total && averageScore >= PASS_SCORE && hardViolations === 0;
    return {
      requiredCases: REQUIRED_CASES,
      total,
      passedCases,
      hardViolations,
      averageScore,
      completed,
      passed,
      status: passed ? "CICLO CONCLUÍDO" : completed ? "REVISÃO NECESSÁRIA" : "EM DESENVOLVIMENTO"
    };
  }

  return {
    PASS_SCORE,
    REQUIRED_CASES,
    CASES,
    createCaseSet,
    normalizeResponse,
    evaluateCase,
    evaluateCapstone
  };
});
