(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyStatisticsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PASS_SCORE = 80;
  const REQUIRED_CASES = 6;
  const MAX_HISTORY = 60;
  const CONCLUSIONS = Object.freeze(["SUPPORTED_LIMITED", "INSUFFICIENT_EVIDENCE", "INVALID_METHOD"]);
  const RISKS = Object.freeze([
    "SMALL_SAMPLE",
    "SELECTION_BIAS",
    "MULTIPLE_TESTING",
    "DATA_LEAKAGE",
    "DEPENDENCE",
    "METRIC_MISUSE",
    "NON_STATIONARITY",
    "UNCERTAINTY"
  ]);
  const ACTIONS = Object.freeze([
    "EXPAND_SAMPLE",
    "AUDIT_SELECTION",
    "USE_HOLDOUT",
    "REBUILD_PIPELINE",
    "TIME_AWARE_VALIDATION",
    "REPORT_DISTRIBUTION",
    "STRATIFY_REGIMES",
    "REPORT_INTERVAL"
  ]);

  const SOURCES = Object.freeze([
    { id: "NIST_SAMPLE_SIZE", title: "NIST — tamanho de amostra", url: "https://www.itl.nist.gov/div898/handbook/prc/section2/prc222.htm" },
    { id: "NIST_MEAN", title: "NIST — média populacional e amostral", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm" },
    { id: "NIST_CI", title: "NIST — limites de confiança para a média", url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm" },
    { id: "SKLEARN_LEAKAGE", title: "scikit-learn — vazamento de dados", url: "https://scikit-learn.org/stable/common_pitfalls.html#data-leakage" },
    { id: "SKLEARN_CV", title: "scikit-learn — validação e séries temporais", url: "https://scikit-learn.org/stable/modules/cross_validation.html" },
    { id: "ASA_ETHICS", title: "ASA — prática estatística ética", url: "https://www.amstat.org/your-career/ethical-guidelines-for-statistical-practice" },
    { id: "PBO", title: "Bailey et al. — probabilidade de overfitting em backtest", url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2326253" }
  ]);

  const CASES = Object.freeze([
    {
      id: "tiny-winning-streak",
      title: "Oito operações e uma sequência vencedora",
      facts: ["Foram observadas oito operações M1 em uma única semana.", "Seis terminaram positivas, sem ajuste explícito de custos.", "A conclusão proposta é: ‘75% de acerto valida a estratégia’."],
      expectedConclusion: "INSUFFICIENT_EVIDENCE", expectedRisk: "SMALL_SAMPLE", expectedAction: "EXPAND_SAMPLE", expectedSource: "NIST_SAMPLE_SIZE", severity: "NO_VALIDATION_CLAIM",
      explanation: "Oito observações não sustentam uma alegação de validação. A precisão desejada, a variabilidade e o protocolo precisam ser definidos antes de dimensionar a amostra."
    },
    {
      id: "predeclared-holdout",
      title: "Protocolo congelado e teste fora da amostra",
      facts: ["As regras foram registradas antes da coleta.", "Duzentas operações formaram a amostra de desenvolvimento e cem ficaram intocadas para teste cronológico.", "Após custos, a expectativa foi positiva nos dois blocos; a conclusão limita-se ao período e às condições estudadas."],
      expectedConclusion: "SUPPORTED_LIMITED", expectedRisk: "NON_STATIONARITY", expectedAction: "STRATIFY_REGIMES", expectedSource: "ASA_ETHICS", severity: "",
      explanation: "O desenho permite relatar evidência interna limitada, mas não garante repetição futura. Regimes, dependência e estabilidade ainda precisam ser examinados."
    },
    {
      id: "cherry-picked-session",
      title: "Somente o melhor horário ficou no relatório",
      facts: ["A coleta incluiu Londres, Nova York e Ásia.", "Depois de ver os resultados, as sessões negativas foram removidas.", "O relatório apresenta apenas Londres como se esse recorte fosse planejado desde o início."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "SELECTION_BIAS", expectedAction: "AUDIT_SELECTION", expectedSource: "ASA_ETHICS", severity: "REJECT_UNSUPPORTED",
      explanation: "Escolher o recorte depois de ver o resultado cria viés de seleção. O relatório precisa preservar o protocolo, os descartes e os resultados negativos."
    },
    {
      id: "hundred-variants-best",
      title: "A melhor entre cem configurações",
      facts: ["Cem combinações de indicadores foram testadas no mesmo histórico.", "A configuração com maior retorno foi escolhida.", "O mesmo histórico é usado como prova final, sem correção nem teste intocado."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "MULTIPLE_TESTING", expectedAction: "USE_HOLDOUT", expectedSource: "PBO", severity: "REJECT_UNSUPPORTED",
      explanation: "Quanto mais alternativas são tentadas, maior a chance de selecionar ruído. A configuração escolhida precisa de avaliação fora da amostra e relato completo da busca."
    },
    {
      id: "future-normalization",
      title: "Normalização com informação do futuro",
      facts: ["A média e o desvio de toda a série foram calculados antes da divisão treino/teste.", "Esses valores incluem o período reservado para teste.", "O desempenho final é tratado como estimativa imparcial."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "DATA_LEAKAGE", expectedAction: "REBUILD_PIPELINE", expectedSource: "SKLEARN_LEAKAGE", severity: "REJECT_UNSUPPORTED",
      explanation: "O conjunto de teste influenciou o pré-processamento. A divisão deve ocorrer antes do ajuste de qualquer transformação, usando apenas dados disponíveis naquele momento."
    },
    {
      id: "shuffled-time-series",
      title: "Candles futuros misturados ao treino",
      facts: ["Os candles foram embaralhados aleatoriamente.", "Observações futuras e passadas ficaram nos dois lados da validação.", "A pontuação é apresentada como capacidade de generalização temporal."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "DEPENDENCE", expectedAction: "TIME_AWARE_VALIDATION", expectedSource: "SKLEARN_CV", severity: "REJECT_UNSUPPORTED",
      explanation: "Séries temporais têm ordem e autocorrelação. A validação precisa preservar o tempo e impedir que informação futura participe do treino."
    },
    {
      id: "high-winrate-negative-expectancy",
      title: "Alta taxa de acerto, expectativa negativa",
      facts: ["A amostra registra 70% de vitórias.", "O ganho médio é 0,30R e a perda média é 1R.", "A estratégia é chamada de lucrativa apenas pela taxa de acerto."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "METRIC_MISUSE", expectedAction: "REPORT_DISTRIBUTION", expectedSource: "NIST_MEAN", severity: "REJECT_UNSUPPORTED",
      explanation: "Taxa de acerto isolada omite magnitude de ganhos e perdas. Com esses valores, a expectativa amostral é negativa antes de outras incertezas."
    },
    {
      id: "positive-expectancy-interval",
      title: "Expectativa positiva com incerteza declarada",
      facts: ["Há 300 operações de uma regra previamente definida.", "A expectativa amostral após custos é 0,20R.", "O relatório divulga intervalo, dispersão e afirma apenas evidência no período observado."],
      expectedConclusion: "SUPPORTED_LIMITED", expectedRisk: "UNCERTAINTY", expectedAction: "REPORT_INTERVAL", expectedSource: "NIST_CI", severity: "",
      explanation: "É legítimo relatar o que a amostra mostra quando a incerteza e os limites são explícitos. Isso continua sendo evidência interna, não garantia ou validação externa."
    },
    {
      id: "overlapping-signals",
      title: "Cento e cinquenta sinais sobrepostos",
      facts: ["Os sinais compartilham grande parte dos mesmos candles.", "Cada sinal é contado como observação independente.", "O tamanho nominal 150 é usado para declarar alta precisão."],
      expectedConclusion: "INSUFFICIENT_EVIDENCE", expectedRisk: "DEPENDENCE", expectedAction: "TIME_AWARE_VALIDATION", expectedSource: "SKLEARN_CV", severity: "NO_VALIDATION_CLAIM",
      explanation: "Observações sobrepostas podem carregar dependência forte. O tamanho nominal não equivale automaticamente ao número efetivo de informações independentes."
    },
    {
      id: "single-regime-generalization",
      title: "Um regime virou regra universal",
      facts: ["A amostra cobre somente um período de alta volatilidade.", "Não há estratificação por liquidez, sessão ou regime.", "A conclusão afirma funcionar em qualquer mercado e condição."],
      expectedConclusion: "INSUFFICIENT_EVIDENCE", expectedRisk: "NON_STATIONARITY", expectedAction: "STRATIFY_REGIMES", expectedSource: "ASA_ETHICS", severity: "NO_VALIDATION_CLAIM",
      explanation: "Uma amostra de regime único não sustenta generalização universal. O limite de escopo precisa ser declarado e novos regimes avaliados separadamente."
    },
    {
      id: "confidence-language",
      title: "Interpretação errada do intervalo de confiança",
      facts: ["Foi calculado um intervalo de confiança de 95% por um método definido.", "O relatório diz que existe 95% de probabilidade de o parâmetro fixo estar dentro deste intervalo específico.", "Nenhuma explicação do procedimento repetido é dada."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "UNCERTAINTY", expectedAction: "REPORT_INTERVAL", expectedSource: "NIST_CI", severity: "REJECT_UNSUPPORTED",
      explanation: "Na interpretação frequentista, 95% qualifica a cobertura do procedimento em repetições, não uma probabilidade posterior atribuída ao parâmetro fixo."
    },
    {
      id: "costs-omitted",
      title: "Efeito pequeno antes dos custos",
      facts: ["O ganho médio bruto é 0,04R por operação.", "Spread, slippage e comissão não foram incluídos.", "O relatório chama o resultado de vantagem líquida comprovada."],
      expectedConclusion: "INVALID_METHOD", expectedRisk: "METRIC_MISUSE", expectedAction: "REPORT_DISTRIBUTION", expectedSource: "ASA_ETHICS", severity: "REJECT_UNSUPPORTED",
      explanation: "Significância ou média bruta não substitui relevância econômica. Custos, dispersão e sensibilidade precisam entrar antes de qualquer alegação líquida."
    }
  ]);

  function cleanText(value, maximum = 1000) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function finiteNumber(value, minimum = 0, maximum = 1000000) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function calculateWilsonInterval(successes, total, z = 1.96) {
    const maximumCount = Number.MAX_SAFE_INTEGER;
    const n = Math.trunc(finiteNumber(total, 0, maximumCount));
    const wins = Math.min(n, Math.trunc(finiteNumber(successes, 0, maximumCount)));
    if (!n) return { lower: 0, upper: 0 };
    const p = wins / n;
    const zSquared = z * z;
    const denominator = 1 + zSquared / n;
    const center = (p + zSquared / (2 * n)) / denominator;
    const margin = z * Math.sqrt((p * (1 - p) + zSquared / (4 * n)) / n) / denominator;
    return {
      lower: Number((Math.max(0, center - margin) * 100).toFixed(2)),
      upper: Number((Math.min(1, center + margin) * 100).toFixed(2))
    };
  }

  function summarizeSample(candidate = {}) {
    const wins = Math.trunc(finiteNumber(candidate.wins));
    const losses = Math.trunc(finiteNumber(candidate.losses));
    const averageWin = finiteNumber(candidate.averageWin, 0, 1000);
    const averageLoss = finiteNumber(candidate.averageLoss, 0, 1000);
    const total = wins + losses;
    const probabilityWin = total ? wins / total : 0;
    const winRate = Number((probabilityWin * 100).toFixed(2));
    const expectancy = Number((probabilityWin * averageWin - (1 - probabilityWin) * averageLoss).toFixed(3));
    const breakevenWinRate = averageWin + averageLoss > 0
      ? Number((averageLoss / (averageWin + averageLoss) * 100).toFixed(2))
      : 0;
    return { wins, losses, total, averageWin, averageLoss, winRate, expectancy, breakevenWinRate, interval: calculateWilsonInterval(wins, total) };
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
    const conclusion = cleanText(candidate.conclusion, 40);
    const risk = cleanText(candidate.risk, 40);
    const action = cleanText(candidate.action, 40);
    const source = cleanText(candidate.source, 40);
    return {
      conclusion: CONCLUSIONS.includes(conclusion) ? conclusion : "",
      risk: RISKS.includes(risk) ? risk : "",
      action: ACTIONS.includes(action) ? action : "",
      source: SOURCES.some(item => item.id === source) ? source : "",
      rationale: cleanText(candidate.rationale, 1200)
    };
  }

  function gradeCase(caseId, candidateAnswer = {}) {
    const item = findCase(caseId);
    if (!item) throw new Error("Caso estatístico desconhecido.");
    const answer = normalizeAnswer(candidateAnswer);
    const checks = [
      { id: "conclusion", label: "Força da conclusão", points: 35, passed: answer.conclusion === item.expectedConclusion },
      { id: "risk", label: "Risco estatístico principal", points: 25, passed: answer.risk === item.expectedRisk },
      { id: "action", label: "Próxima validação necessária", points: 20, passed: answer.action === item.expectedAction },
      { id: "source", label: "Fonte metodológica", points: 10, passed: answer.source === item.expectedSource },
      { id: "rationale", label: "Justificativa auditável", points: 10, passed: answer.rationale.length >= 60 }
    ];
    let score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
    let hardViolation = "";
    if (item.severity === "REJECT_UNSUPPORTED" && answer.conclusion === "SUPPORTED_LIMITED") {
      hardViolation = "A resposta tratou um método inválido como evidência favorável.";
      score = Math.min(score, 49);
    } else if (item.severity === "NO_VALIDATION_CLAIM" && answer.conclusion === "SUPPORTED_LIMITED") {
      hardViolation = "A resposta validou uma alegação que a amostra não consegue sustentar.";
      score = Math.min(score, 69);
    }
    return {
      caseId: item.id,
      answer,
      checks,
      score,
      passed: score >= PASS_SCORE && !hardViolation,
      hardViolation,
      expectedConclusion: item.expectedConclusion,
      expectedRisk: item.expectedRisk,
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
    if (!attempt) throw new Error("Tentativa estatística inválida.");
    return normalizeState({ ...state, lastSeed: attempt.seed, history: [...state.history, attempt] });
  }

  return {
    PASS_SCORE,
    REQUIRED_CASES,
    MAX_HISTORY,
    CONCLUSIONS,
    RISKS,
    ACTIONS,
    SOURCES,
    CASES,
    calculateWilsonInterval,
    summarizeSample,
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
