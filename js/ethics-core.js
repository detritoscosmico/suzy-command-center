(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyEthicsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;
  const ACTIONS = Object.freeze(["WITHIN_SCOPE", "OUTSIDE_SCOPE", "PAUSE_AND_VERIFY"]);
  const CONFLICTS = Object.freeze(["YES", "NO", "UNCLEAR"]);

  const SOURCES = Object.freeze([
    { id: "DECISION", title: "Decisão de função e jurisdição", url: "docs/decisao-funcao-jurisdicao.md" },
    { id: "CVM19", title: "Resolução CVM 19 — consultoria", url: "https://conteudo.cvm.gov.br/legislacao/resolucoes/resol019.html" },
    { id: "CVM20", title: "Resolução CVM 20 — análise", url: "https://conteudo.cvm.gov.br/legislacao/resolucoes/resol020.html" },
    { id: "CVM21", title: "Resolução CVM 21 — administração de carteiras", url: "https://conteudo.cvm.gov.br/legislacao/resolucoes/resol021.html" },
    { id: "CVM178", title: "Resolução CVM 178 — assessoria de investimento", url: "https://conteudo.cvm.gov.br/legislacao/resolucoes/resol178.html" }
  ]);

  const CASES = Object.freeze([
    {
      id: "own-account-journal",
      title: "Estudo e registro da própria conta",
      facts: ["A pessoa decide somente sobre recursos próprios.", "O material fica restrito ao estudo, à simulação e ao diário.", "Não há recomendação, cliente, comissão ou acesso à conta de terceiro."],
      expectedAction: "WITHIN_SCOPE", expectedConflict: "NO", expectedSource: "DECISION",
      explanation: "Educação, simulação, gestão de risco e registro da própria conta estão dentro da função-alvo aprovada."
    },
    {
      id: "paid-personalized-advice",
      title: "Orientação personalizada mediante pagamento",
      facts: ["Um conhecido envia patrimônio, objetivos e tolerância a risco.", "Ele oferece pagamento por uma indicação personalizada de valores mobiliários.", "A resposta seria usada para decidir a carteira dele."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM19",
      explanation: "A solicitação se aproxima de consultoria profissional e está fora do escopo educacional aprovado."
    },
    {
      id: "recurring-public-reports",
      title: "Relatórios públicos recorrentes de compra e venda",
      facts: ["A proposta é publicar relatórios pagos e recorrentes.", "Os textos indicariam valores mobiliários e momentos de compra ou venda.", "O autor não possui a habilitação profissional correspondente."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM20",
      explanation: "Relatórios destinados à publicação ou distribuição com recomendações exigem análise regulatória própria e não pertencem à função-alvo da Suzy."
    },
    {
      id: "relative-account-password",
      title: "Operar a conta de um parente",
      facts: ["Um parente entrega senha e assinatura eletrônica da corretora.", "O operador escolheria ativos, horários e tamanho das posições.", "O dinheiro e a conta pertencem ao parente."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM21",
      explanation: "Tomar decisões e emitir ordens sobre recursos de terceiros está fora da operação em conta própria e exige enquadramento profissional específico."
    },
    {
      id: "broker-order-commission",
      title: "Captação e transmissão de ordens por comissão",
      facts: ["Uma corretora oferece comissão por clientes captados.", "A atividade incluiria receber e transmitir ordens.", "O acordo usaria a imagem do projeto educacional para atrair investidores."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM178",
      explanation: "Prospecção, recepção e transmissão de ordens pertencem a outra atividade regulada e não ao escopo educacional da Suzy."
    },
    {
      id: "general-risk-lesson",
      title: "Aula geral sobre risco",
      facts: ["A aula explica risco percentual, stop diário e incerteza.", "Não cita uma pessoa, carteira ou ordem específica.", "Não promete retorno nem envia recomendação individual."],
      expectedAction: "WITHIN_SCOPE", expectedConflict: "NO", expectedSource: "DECISION",
      explanation: "Conteúdo geral de educação e gestão de risco permanece dentro do escopo, desde que não vire recomendação personalizada ou promessa."
    },
    {
      id: "issuer-sponsored-praise",
      title: "Pagamento de emissor sem transparência",
      facts: ["Um emissor oferece pagamento para destacar seu ativo.", "O texto teria aparência de análise independente.", "A remuneração não seria revelada ao público."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM20",
      explanation: "Há conflito material e produção pública com aparência de análise. A proposta deve ser recusada dentro da função-alvo aprovada."
    },
    {
      id: "uncertain-token-classification",
      title: "Token com enquadramento incerto",
      facts: ["O produto é chamado de token, mas seus direitos econômicos não estão claros.", "A campanha pede recomendação pública imediata.", "Não foi verificado se o ativo ou a atividade entram no perímetro regulatório."],
      expectedAction: "PAUSE_AND_VERIFY", expectedConflict: "UNCLEAR", expectedSource: "DECISION",
      explanation: "Quando o enquadramento do ativo e da atividade é incerto, a resposta prudente é pausar e buscar orientação competente antes de publicar."
    },
    {
      id: "own-forex-simulation",
      title: "Replay de Forex com dados autorizados",
      facts: ["O histórico foi obtido de fonte autorizada e permanece local.", "As decisões são simuladas e não são compartilhadas como sinais.", "O exercício mede aderência e risco, não lucro prometido."],
      expectedAction: "WITHIN_SCOPE", expectedConflict: "NO", expectedSource: "DECISION",
      explanation: "Replay local e educacional com dados autorizados está dentro do escopo aprovado."
    },
    {
      id: "live-buy-now-post",
      title: "Publicação com ordem direta ao público",
      facts: ["A publicação usa a frase ‘compre agora’ para um valor mobiliário específico.", "Há preço de entrada e momento de saída.", "O conteúdo seria distribuído de forma recorrente a seguidores."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM20",
      explanation: "Uma recomendação pública específica e recorrente ultrapassa o escopo de educação geral do projeto."
    },
    {
      id: "guaranteed-profit-course",
      title: "Curso com garantia de lucro",
      facts: ["A oferta promete retorno certo em operações M1 e M5.", "Não existe amostra validada que sustente a alegação.", "A promessa seria usada para pressionar a compra imediata."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "DECISION",
      explanation: "Promessa de lucro viola os limites éticos e metodológicos do projeto, independentemente do formato comercial."
    },
    {
      id: "third-party-capital-pool",
      title: "Capital de terceiros em uma conta comum",
      facts: ["Três pessoas transfeririam dinheiro para uma conta controlada pelo operador.", "O operador decidiria sozinho as posições.", "Os resultados seriam divididos entre os participantes."],
      expectedAction: "OUTSIDE_SCOPE", expectedConflict: "YES", expectedSource: "CVM21",
      explanation: "Receber e gerir recursos de terceiros não é operação em conta própria e está expressamente fora do escopo aprovado."
    }
  ]);

  function cleanText(value, maximum = 1000) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
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
    return { seed: normalizedSeed, cases: cases.slice(0, Math.min(CASES.length, Math.max(1, Math.trunc(Number(count) || REQUIRED_CASES)))) };
  }

  function findCase(caseId) {
    return CASES.find(item => item.id === caseId) || null;
  }

  function normalizeAnswer(candidate = {}) {
    const action = cleanText(candidate.action, 30);
    const conflict = cleanText(candidate.conflict, 20);
    const source = cleanText(candidate.source, 20);
    return {
      action: ACTIONS.includes(action) ? action : "",
      conflict: CONFLICTS.includes(conflict) ? conflict : "",
      source: SOURCES.some(item => item.id === source) ? source : "",
      rationale: cleanText(candidate.rationale, 1000)
    };
  }

  function gradeCase(caseId, candidateAnswer = {}) {
    const item = findCase(caseId);
    if (!item) throw new Error("Caso ético desconhecido.");
    const answer = normalizeAnswer(candidateAnswer);
    const checks = [
      { id: "scope", label: "Classificação de escopo", points: 50, passed: answer.action === item.expectedAction },
      { id: "conflict", label: "Conflito de interesse", points: 15, passed: answer.conflict === item.expectedConflict },
      { id: "source", label: "Fonte primária aplicável", points: 15, passed: answer.source === item.expectedSource },
      { id: "rationale", label: "Justificativa documentada", points: 20, passed: answer.rationale.length >= 40 }
    ];
    let score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
    let hardViolation = "";
    if (item.expectedAction === "OUTSIDE_SCOPE" && answer.action === "WITHIN_SCOPE") {
      hardViolation = "A resposta autorizou uma atividade que o caso coloca fora do escopo da Suzy.";
      score = Math.min(score, 49);
    } else if (item.expectedAction === "PAUSE_AND_VERIFY" && answer.action === "WITHIN_SCOPE") {
      hardViolation = "A resposta avançou apesar de o enquadramento ainda estar incerto.";
      score = Math.min(score, 69);
    }
    return {
      caseId: item.id,
      answer,
      checks,
      score,
      passed: score >= PASS_SCORE && !hardViolation,
      hardViolation,
      expectedAction: item.expectedAction,
      expectedConflict: item.expectedConflict,
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

  function normalizeHistory(history = []) {
    if (!Array.isArray(history)) return [];
    const bySessionCase = new Map();
    history.map(normalizeAttempt).filter(Boolean).forEach(attempt => bySessionCase.set(`${attempt.sessionId}:${attempt.caseId}`, attempt));
    return [...bySessionCase.values()].sort((left, right) => left.timestamp.localeCompare(right.timestamp)).slice(-MAX_HISTORY);
  }

  function evaluateSession(attempts = []) {
    const normalized = normalizeHistory(attempts);
    const unique = new Map();
    normalized.forEach(attempt => unique.set(attempt.caseId, attempt));
    const results = [...unique.values()];
    const completed = results.length;
    const average = completed ? Number((results.reduce((sum, item) => sum + item.score, 0) / completed).toFixed(1)) : 0;
    const hardViolations = results.filter(item => item.hardViolation).length;
    return {
      completed,
      required: REQUIRED_CASES,
      average,
      hardViolations,
      passed: completed >= REQUIRED_CASES && average >= PASS_SCORE && hardViolations === 0
    };
  }

  function summarizeSessions(history = []) {
    const groups = new Map();
    normalizeHistory(history).forEach(attempt => {
      if (!groups.has(attempt.sessionId)) groups.set(attempt.sessionId, []);
      groups.get(attempt.sessionId).push(attempt);
    });
    return [...groups.entries()].map(([sessionId, attempts]) => ({ sessionId, ...evaluateSession(attempts) }));
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
    if (!attempt) throw new Error("Tentativa ética inválida.");
    return normalizeState({ ...state, lastSeed: attempt.seed, history: [...state.history, attempt] });
  }

  return {
    PASS_SCORE,
    REQUIRED_CASES,
    MAX_HISTORY,
    ACTIONS,
    CONFLICTS,
    SOURCES,
    CASES,
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
