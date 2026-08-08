(function () {
  "use strict";
  const core = window.SuzyGovernanceCore;
  if (!core) return;

  const GOVERNANCE_KEY = "suzy-governance-v1";
  const PROGRAM_KEY = "suzy-professional-program-v1";
  const JOURNAL_KEY = "suzy-professional-journal-v1";
  const $ = id => document.getElementById(id);
  let history = loadHistory();

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadHistory() {
    const state = readJson(GOVERNANCE_KEY, {});
    return core.normalizeHistory(state.history || []);
  }

  function currentProgramPlan() {
    const state = readJson(PROGRAM_KEY, {});
    return core.normalizePlaybook(state.plan || state);
  }

  function journalEntries() {
    const value = readJson(JOURNAL_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function planFromForm() {
    return {
      market: $("govMarket").value,
      setup: $("govSetup").value,
      context: $("govContext").value,
      trigger: $("govTrigger").value,
      invalidation: $("govInvalidation").value,
      riskPerTradePct: $("govRisk").value,
      dailyStopR: $("govDailyStop").value,
      maxTrades: $("govMaxTrades").value,
      reviewRoutine: $("govReviewRoutine").value,
      acceptsUncertainty: $("govUncertainty").checked
    };
  }

  function fillPlan(plan) {
    $("govMarket").value = plan.market || "";
    $("govSetup").value = plan.setup || "";
    $("govContext").value = plan.context || "";
    $("govTrigger").value = plan.trigger || "";
    $("govInvalidation").value = plan.invalidation || "";
    $("govRisk").value = plan.riskPerTradePct || "";
    $("govDailyStop").value = plan.dailyStopR || "";
    $("govMaxTrades").value = plan.maxTrades || "";
    $("govReviewRoutine").value = plan.reviewRoutine || "";
    $("govUncertainty").checked = plan.acceptsUncertainty;
  }

  function saveState(revision) {
    const savedAt = new Date().toISOString();
    localStorage.setItem(GOVERNANCE_KEY, JSON.stringify({ version: 1, updatedAt: savedAt, history }));
    localStorage.setItem(PROGRAM_KEY, JSON.stringify({ version: 1, updatedAt: savedAt, plan: revision.plan }));
  }

  function formatDate(value) {
    return new Date(value).toLocaleString("pt-BR");
  }

  function renderHistory() {
    const body = $("historyBody");
    body.replaceChildren();
    if (!history.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.className = "empty";
      cell.textContent = "Nenhuma versão auditada.";
      row.append(cell);
      body.append(row);
      return;
    }
    [...history].reverse().forEach(revision => {
      const row = document.createElement("tr");
      const values = [`v${revision.version}`, formatDate(revision.timestamp), revision.fingerprint, revision.changes.length, revision.reviewer || "—", revision.reason];
      values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.append(cell);
      });
      body.append(row);
    });
  }

  function renderKpis() {
    const latest = history[history.length - 1];
    const formPlan = planFromForm();
    $("kpiVersion").textContent = latest ? `v${latest.version}` : "SEM BASE";
    $("kpiFingerprint").textContent = latest ? `fingerprint ${latest.fingerprint}` : "fingerprint —";
    $("kpiRevisions").textContent = String(history.length);
    $("kpiJournal").textContent = String(journalEntries().length);
    if (!latest) {
      $("kpiPlanState").textContent = "NÃO VERSIONADO";
      $("kpiPlanState").className = "";
      $("kpiPlanDetail").textContent = "crie a linha de base";
      return;
    }
    const changed = core.diffPlans(latest.plan, formPlan).length;
    $("kpiPlanState").textContent = changed ? "MUDANÇA PENDENTE" : "AUDITADO";
    $("kpiPlanState").className = changed ? "fail-text" : "pass-text";
    $("kpiPlanDetail").textContent = changed ? `${changed} campo(s) alterado(s)` : "igual à última versão";
  }

  function renderCompareOptions() {
    const from = $("compareFrom");
    const to = $("compareTo");
    from.replaceChildren();
    to.replaceChildren();
    history.forEach(revision => {
      const optionA = document.createElement("option");
      optionA.value = String(revision.version);
      optionA.textContent = `v${revision.version} • ${revision.fingerprint}`;
      from.append(optionA);
      to.append(optionA.cloneNode(true));
    });
    if (history.length > 1) {
      from.value = String(history[history.length - 2].version);
      to.value = String(history[history.length - 1].version);
    }
  }

  function renderAll() {
    renderHistory();
    renderCompareOptions();
    renderKpis();
  }

  function saveRevision(event) {
    event.preventDefault();
    const feedback = $("versionFeedback");
    try {
      const result = core.createRevision(planFromForm(), history, {
        reason: $("changeReason").value,
        reviewer: $("changeReviewer").value
      });
      history = result.history;
      saveState(result.revision);
      fillPlan(result.revision.plan);
      $("changeReason").value = "";
      feedback.textContent = `Versão v${result.revision.version} criada. Fingerprint ${result.revision.fingerprint}; ${result.revision.changes.length} campo(s) registrado(s).`;
      feedback.className = "feedback success";
      renderAll();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = "feedback error";
      renderKpis();
    }
  }

  function compareVersions() {
    const left = history.find(item => item.version === Number($("compareFrom").value));
    const right = history.find(item => item.version === Number($("compareTo").value));
    const container = $("versionDiff");
    container.replaceChildren();
    if (!left || !right) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Crie pelo menos duas versões para comparar.";
      container.append(empty);
      return;
    }
    const comparison = core.compareRevisions(left, right);
    if (!comparison.changes.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "As duas versões têm conteúdo equivalente.";
      container.append(empty);
      return;
    }
    comparison.changes.forEach(change => {
      const card = document.createElement("article");
      card.className = "diff-card";
      const title = document.createElement("strong");
      title.textContent = change.label;
      const values = document.createElement("div");
      const before = document.createElement("span");
      const after = document.createElement("span");
      before.textContent = `ANTES: ${change.before}`;
      after.textContent = `DEPOIS: ${change.after}`;
      values.append(before, after);
      card.append(title, values);
      container.append(card);
    });
  }

  function renderPeriod(container, summary) {
    container.replaceChildren();
    [["Registros", summary.total], ["Aderência", `${summary.adherence}%`], ["Qualidade", `${summary.averageQuality}/5`]].forEach(([label, value]) => {
      const metric = document.createElement("div");
      metric.className = "metric";
      const caption = document.createElement("span");
      const number = document.createElement("strong");
      caption.textContent = label;
      number.textContent = String(value);
      metric.append(caption, number);
      container.append(metric);
    });
    const errors = summary.errors.length ? summary.errors.map(item => `${item.name} (${item.total})`).join(", ") : "Nenhum classificado";
    const contexts = summary.contexts.length ? summary.contexts.map(item => `${item.name} (${item.total})`).join(", ") : "Sem amostra";
    const details = document.createElement("div");
    details.className = "period-list";
    details.textContent = `Erros: ${errors} • Contextos: ${contexts}`;
    container.append(details);
  }

  function reviewPeriods() {
    const entries = journalEntries();
    const left = core.summarizeProcessPeriod(entries, $("periodAFrom").value, $("periodATo").value);
    const right = core.summarizeProcessPeriod(entries, $("periodBFrom").value, $("periodBTo").value);
    renderPeriod($("periodAResult"), left);
    renderPeriod($("periodBResult"), right);
    const comparison = core.compareProcessPeriods(left, right);
    const sign = value => value > 0 ? `+${value}` : String(value);
    $("periodComparison").textContent = `B versus A — amostra ${sign(comparison.totalDelta)}, aderência ${sign(comparison.adherenceDelta)} p.p., qualidade ${sign(comparison.qualityDelta)}. ${comparison.notice}`;
  }

  function setDefaultPeriods() {
    const today = new Date();
    const endB = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startB = new Date(today.getFullYear(), today.getMonth(), 1);
    const endA = new Date(today.getFullYear(), today.getMonth(), 0);
    const startA = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    $("periodAFrom").value = iso(startA);
    $("periodATo").value = iso(endA);
    $("periodBFrom").value = iso(startB);
    $("periodBTo").value = iso(endB);
  }

  function exportGovernance() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      notice: "Auditoria educacional local. Não certifica competência e não produz sinal operacional.",
      revisions: history
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `suzy-governanca-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  $("versionForm").addEventListener("submit", saveRevision);
  $("versionForm").addEventListener("input", renderKpis);
  $("compareVersions").addEventListener("click", compareVersions);
  $("reviewPeriods").addEventListener("click", reviewPeriods);
  $("exportGovernance").addEventListener("click", exportGovernance);
  window.addEventListener("storage", () => { history = loadHistory(); renderAll(); });

  const latest = history[history.length - 1];
  const programPlan = currentProgramPlan();
  fillPlan(core.validatePlaybook(programPlan).valid ? programPlan : latest?.plan || programPlan);
  setDefaultPeriods();
  renderAll();
})();
