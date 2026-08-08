(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SuzyGovernanceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MAX_REVISIONS = 50;
  const PLAN_FIELDS = Object.freeze([
    { key: "market", label: "Mercado e ativos" },
    { key: "setup", label: "Setup" },
    { key: "context", label: "Contexto obrigatório" },
    { key: "trigger", label: "Gatilho" },
    { key: "invalidation", label: "Invalidação" },
    { key: "riskPerTradePct", label: "Risco por operação (%)" },
    { key: "dailyStopR", label: "Stop diário (R)" },
    { key: "maxTrades", label: "Máximo de operações" },
    { key: "reviewRoutine", label: "Rotina de revisão" },
    { key: "acceptsUncertainty", label: "Incerteza reconhecida" }
  ]);

  function cleanText(value, maximum = 600) {
    return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maximum);
  }

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizePlaybook(candidate = {}) {
    return {
      market: cleanText(candidate.market, 50),
      setup: cleanText(candidate.setup, 120),
      context: cleanText(candidate.context, 240),
      trigger: cleanText(candidate.trigger, 240),
      invalidation: cleanText(candidate.invalidation, 240),
      riskPerTradePct: Number(Math.max(0, finite(candidate.riskPerTradePct)).toFixed(2)),
      dailyStopR: Number(Math.max(0, finite(candidate.dailyStopR)).toFixed(2)),
      maxTrades: Math.max(0, Math.floor(finite(candidate.maxTrades))),
      reviewRoutine: cleanText(candidate.reviewRoutine, 300),
      acceptsUncertainty: candidate.acceptsUncertainty === true
    };
  }

  function validatePlaybook(candidate = {}) {
    const plan = normalizePlaybook(candidate);
    const problems = [];
    if (!plan.market) problems.push("Mercado e ativos não definidos.");
    if (!plan.setup) problems.push("Setup não definido.");
    if (!plan.context) problems.push("Contexto obrigatório não definido.");
    if (!plan.trigger) problems.push("Gatilho não definido.");
    if (!plan.invalidation) problems.push("Invalidação não definida.");
    if (plan.riskPerTradePct < 0.1 || plan.riskPerTradePct > 2) problems.push("Risco por operação deve ficar entre 0,10% e 2%.");
    if (plan.dailyStopR < 0.5 || plan.dailyStopR > 5) problems.push("Stop diário deve ficar entre 0,50R e 5R.");
    if (plan.maxTrades < 1 || plan.maxTrades > 10) problems.push("Máximo de operações deve ficar entre 1 e 10.");
    if (!plan.reviewRoutine) problems.push("Rotina de revisão não definida.");
    if (!plan.acceptsUncertainty) problems.push("A incerteza precisa ser reconhecida.");
    return { plan, valid: problems.length === 0, problems };
  }

  function canonicalPlan(candidate = {}) {
    const plan = normalizePlaybook(candidate);
    return JSON.stringify(PLAN_FIELDS.reduce((result, field) => {
      result[field.key] = plan[field.key];
      return result;
    }, {}));
  }

  function fingerprintPlan(candidate = {}) {
    const text = canonicalPlan(candidate);
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  function displayValue(value) {
    if (typeof value === "boolean") return value ? "SIM" : "NÃO";
    if (value === "" || value === null || value === undefined) return "—";
    return String(value);
  }

  function diffPlans(before = {}, after = {}) {
    const left = normalizePlaybook(before);
    const right = normalizePlaybook(after);
    return PLAN_FIELDS.filter(field => left[field.key] !== right[field.key]).map(field => ({
      key: field.key,
      label: field.label,
      before: displayValue(left[field.key]),
      after: displayValue(right[field.key])
    }));
  }

  function normalizeTimestamp(value) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }

  function normalizeRevision(candidate = {}) {
    const version = Math.max(1, Math.floor(finite(candidate.version, 1)));
    const plan = normalizePlaybook(candidate.plan);
    const timestamp = normalizeTimestamp(candidate.timestamp);
    if (!timestamp || !validatePlaybook(plan).valid) return null;
    return {
      id: cleanText(candidate.id, 80) || `v${version}-${fingerprintPlan(plan)}`,
      version,
      timestamp,
      reason: cleanText(candidate.reason, 600),
      reviewer: cleanText(candidate.reviewer, 80),
      fingerprint: fingerprintPlan(plan),
      plan,
      changes: Array.isArray(candidate.changes) ? candidate.changes.slice(0, PLAN_FIELDS.length).map(item => ({
        key: cleanText(item.key, 40),
        label: cleanText(item.label, 80),
        before: cleanText(item.before, 320),
        after: cleanText(item.after, 320)
      })) : []
    };
  }

  function normalizeHistory(history = []) {
    if (!Array.isArray(history)) return [];
    const seen = new Set();
    return history.map(normalizeRevision).filter(revision => {
      if (!revision || seen.has(revision.version)) return false;
      seen.add(revision.version);
      return true;
    }).sort((left, right) => left.version - right.version).slice(-MAX_REVISIONS);
  }

  function createRevision(candidatePlan, candidateHistory = [], meta = {}) {
    const evaluation = validatePlaybook(candidatePlan);
    if (!evaluation.valid) throw new Error(`Playbook inválido: ${evaluation.problems.join(" ")}`);
    const reason = cleanText(meta.reason, 600);
    if (reason.length < 20) throw new Error("Informe um motivo de mudança com pelo menos 20 caracteres.");
    const history = normalizeHistory(candidateHistory);
    const previous = history[history.length - 1] || null;
    const changes = previous ? diffPlans(previous.plan, evaluation.plan) : PLAN_FIELDS.map(field => ({
      key: field.key,
      label: field.label,
      before: "—",
      after: displayValue(evaluation.plan[field.key])
    }));
    if (previous && changes.length === 0) throw new Error("O playbook não mudou; nenhuma versão nova foi criada.");
    const version = previous ? previous.version + 1 : 1;
    const timestamp = normalizeTimestamp(meta.timestamp) || new Date().toISOString();
    const revision = normalizeRevision({
      id: `v${version}-${fingerprintPlan(evaluation.plan)}`,
      version,
      timestamp,
      reason,
      reviewer: meta.reviewer,
      plan: evaluation.plan,
      changes
    });
    return { revision, history: [...history, revision].slice(-MAX_REVISIONS) };
  }

  function compareRevisions(leftRevision, rightRevision) {
    const left = normalizeRevision(leftRevision);
    const right = normalizeRevision(rightRevision);
    if (!left || !right) throw new Error("Selecione duas versões válidas para comparar.");
    return {
      fromVersion: left.version,
      toVersion: right.version,
      changes: diffPlans(left.plan, right.plan),
      identical: fingerprintPlan(left.plan) === fingerprintPlan(right.plan)
    };
  }

  function dateBoundary(value, endOfDay) {
    if (!value) return null;
    const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  function processEntry(candidate = {}) {
    const timestamp = normalizeTimestamp(candidate.timestamp);
    if (!timestamp) return null;
    return {
      timestamp,
      followedPlan: candidate.followedPlan === true,
      quality: Math.min(5, Math.max(1, finite(candidate.quality, 3))),
      errorType: cleanText(candidate.errorType, 50) || "Nenhum",
      market: cleanText(candidate.market, 30) || "Outros",
      session: cleanText(candidate.session, 30) || "Não informada"
    };
  }

  function countGroups(entries, accessor, limit = 5) {
    const counts = new Map();
    entries.forEach(entry => {
      const key = accessor(entry);
      if (!key || key === "Nenhum") return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()].map(([name, total]) => ({ name, total }))
      .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name))
      .slice(0, limit);
  }

  function summarizeProcessPeriod(candidateEntries = [], from = "", to = "") {
    const start = dateBoundary(from, false);
    const end = dateBoundary(to, true);
    const entries = (Array.isArray(candidateEntries) ? candidateEntries : [])
      .map(processEntry).filter(Boolean).filter(entry => {
        const timestamp = new Date(entry.timestamp);
        return (!start || timestamp >= start) && (!end || timestamp <= end);
      });
    const total = entries.length;
    const adherence = total ? Number((entries.filter(entry => entry.followedPlan).length / total * 100).toFixed(1)) : 0;
    const averageQuality = total ? Number((entries.reduce((sum, entry) => sum + entry.quality, 0) / total).toFixed(2)) : 0;
    return {
      from: from || null,
      to: to || null,
      total,
      adherence,
      averageQuality,
      errors: countGroups(entries, entry => entry.errorType),
      contexts: countGroups(entries, entry => `${entry.market} • ${entry.session}`),
      notice: "Resumo de processo. Não mede causalidade, direção de mercado, lucro ou capacidade preditiva."
    };
  }

  function compareProcessPeriods(left, right) {
    if (!left || !right) throw new Error("Dois períodos são necessários.");
    return {
      totalDelta: finite(right.total) - finite(left.total),
      adherenceDelta: Number((finite(right.adherence) - finite(left.adherence)).toFixed(1)),
      qualityDelta: Number((finite(right.averageQuality) - finite(left.averageQuality)).toFixed(2)),
      notice: "Diferenças descritivas não provam causalidade e não devem ser convertidas em sinal operacional."
    };
  }

  return {
    MAX_REVISIONS,
    PLAN_FIELDS,
    normalizePlaybook,
    validatePlaybook,
    fingerprintPlan,
    diffPlans,
    normalizeRevision,
    normalizeHistory,
    createRevision,
    compareRevisions,
    summarizeProcessPeriod,
    compareProcessPeriods
  };
});
