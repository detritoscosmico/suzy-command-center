const PROFESSIONAL_STORAGE_KEY = "suzy-professional-program-v1";
const STORAGE_KEYS = Object.freeze({
  academy1: "suzy-academia-nivel1-v1",
  academy2: "suzy-academia-nivel2-v1",
  replay: "suzy-replay-lab-v2",
  replayLegacy: "suzy-replay-lab-v1",
  simulator: "suzy-order-simulator-v1",
  journal: "suzy-professional-journal-v1",
  psychology: "suzy_psychology_v1"
});

const $ = id => document.getElementById(id);
let savedPlaybook = loadPlaybook();

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Não foi possível ler ${key}.`, error);
    return fallback;
  }
}

function loadPlaybook() {
  const saved = readLocalJson(PROFESSIONAL_STORAGE_KEY, {});
  return SuzyProfessionalCore.normalizePlaybook(saved?.plan || saved);
}

function collectEvidence() {
  const academy1 = readLocalJson(STORAGE_KEYS.academy1, {});
  const academy2 = readLocalJson(STORAGE_KEYS.academy2, {});
  const replay = readLocalJson(STORAGE_KEYS.replay, null) || readLocalJson(STORAGE_KEYS.replayLegacy, {});
  const simulator = readLocalJson(STORAGE_KEYS.simulator, {});
  const rawJournal = readLocalJson(STORAGE_KEYS.journal, []);
  const journalEntries = (Array.isArray(rawJournal) ? rawJournal : [])
    .map(SuzyJournalCore.normalizeJournalEntry)
    .filter(Boolean);
  const journalSummary = SuzyJournalCore.summarizeJournal(journalEntries);
  const psychology = SuzyPsychologyCore.normalizeState(readLocalJson(STORAGE_KEYS.psychology, {}));

  return {
    academy1: {
      completed: Array.isArray(academy1.completed) ? new Set(academy1.completed).size : 0,
      total: 6,
      passed: academy1.passed === true,
      bestScore: Number(academy1.bestScore) || 0
    },
    academy2: {
      completed: Array.isArray(academy2.completed) ? new Set(academy2.completed).size : 0,
      total: 8,
      passed: academy2.passed === true,
      bestScore: Number(academy2.bestScore) || 0
    },
    replayTrades: SuzyReplayCore.summarizeReplay(Array.isArray(replay?.trades) ? replay.trades : []).total,
    simulatorTrades: SuzySimulatorCore.summarizeTrades(Array.isArray(simulator?.trades) ? simulator.trades : []).total,
    journal: {
      total: journalSummary.total,
      adherence: journalSummary.adherence,
      averageQuality: journalSummary.averageQuality
    },
    psychology: {
      lessons: psychology.lessonProgress.length,
      assessments: psychology.assessments.length,
      checkIns: psychology.checkIns.length
    }
  };
}

function requirementDetail(requirement) {
  if (requirement.unit === "operações" || requirement.unit === "registros" || requirement.unit === "aulas" || requirement.unit === "avaliação" || requirement.unit === "check-ins") {
    return `${requirement.current} de ${requirement.target} ${requirement.unit}`;
  }
  if (requirement.unit === "%") return `${requirement.current.toFixed(1)}% de ${requirement.target}%`;
  if (requirement.unit === "/5") return `${requirement.current.toFixed(1)} de ${requirement.target.toFixed(1)}`;
  return requirement.met ? `Aprovado • ${requirement.unit}` : "Aprovação pendente";
}

function renderStages(result) {
  $("stagesGrid").innerHTML = result.stages.map(stage => `
    <article class="stage-card ${stage.passed ? "completed" : ""} ${stage.unlocked ? "" : "locked"}">
      <div class="stage-head">
        <span class="stage-number">0${stage.number}</span>
        <span class="stage-state">${stage.passed ? "CONCLUÍDA" : stage.unlocked ? "EM CURSO" : "GATE BLOQUEADO"}</span>
      </div>
      <h3>${stage.title}</h3>
      <p>${stage.description}</p>
      <div class="stage-progress" aria-label="${stage.progress}% concluído"><i style="width:${stage.progress}%"></i></div>
      <ul class="requirement-list">
        ${stage.requirements.map(requirement => `<li class="${requirement.met ? "met" : ""}"><span>${requirement.label}<small>${requirementDetail(requirement)}</small></span></li>`).join("")}
      </ul>
      <a class="stage-link" href="${stage.href}">${stage.id === "playbook" ? "ABRIR PLANO" : "ABRIR MÓDULO"}</a>
    </article>
  `).join("");
}

function renderEvidence(result) {
  const evidence = result.evidence;
  $("evidenceAcademy1").textContent = `${evidence.academy1.completed}/${evidence.academy1.total}`;
  $("evidenceAcademy1Status").textContent = evidence.academy1.passed ? `Aprovado • ${evidence.academy1.bestScore.toFixed(0)}%` : "Avaliação pendente";
  $("evidenceAcademy1Status").className = evidence.academy1.passed ? "pass" : "";
  $("evidenceAcademy2").textContent = `${evidence.academy2.completed}/${evidence.academy2.total}`;
  $("evidenceAcademy2Status").textContent = evidence.academy2.passed ? `Aprovado • ${evidence.academy2.bestScore.toFixed(0)}%` : "Avaliação pendente";
  $("evidenceAcademy2Status").className = evidence.academy2.passed ? "pass" : "";
  $("evidenceReplay").textContent = String(evidence.replayTrades);
  $("evidenceSimulator").textContent = String(evidence.simulatorTrades);
  $("evidenceJournal").textContent = String(evidence.journal.total);
  $("evidenceJournalDetail").textContent = `${evidence.journal.adherence.toFixed(1)}% de aderência • ${evidence.journal.averageQuality.toFixed(1)}/5`;
  $("evidencePsychology").textContent = `${evidence.psychology.lessons}/5 aulas`;
  $("evidencePsychologyDetail").textContent = `${evidence.psychology.assessments} avaliação(ões) • ${evidence.psychology.checkIns} check-ins`;
}

function renderPlaybook(evaluation) {
  $("playbookProgress").textContent = `${evaluation.progress}%`;
  $("playbookProgressBar").style.width = `${evaluation.progress}%`;
  $("playbookMissing").innerHTML = evaluation.valid
    ? "<li>Plano completo. Qualquer mudança relevante deve ser revisada e salva novamente.</li>"
    : evaluation.missing.slice(0, 5).map(item => `<li>${item}</li>`).join("");
}

function render() {
  const result = SuzyProfessionalCore.evaluateProgram(collectEvidence(), savedPlaybook);
  $("programPercent").textContent = `${result.percent}%`;
  $("programProgressBar").style.width = `${result.percent}%`;
  $("completedStages").textContent = `${result.completedStages}/${result.totalStages}`;
  $("programStatus").textContent = result.status;
  $("nextEvidence").textContent = result.nextAction?.label || "Ciclo concluído";
  $("nextActionButton").href = result.nextAction?.href || "#gatesTitle";
  $("nextActionButton").textContent = result.qualified ? "REVISAR PASSAPORTE" : "CONTINUAR PRÓXIMA ETAPA";
  renderStages(result);
  renderEvidence(result);
  renderPlaybook(result.playbook);
  return result;
}

function playbookFromForm() {
  return {
    market: $("planMarket").value,
    setup: $("planSetup").value,
    context: $("planContext").value,
    trigger: $("planTrigger").value,
    invalidation: $("planInvalidation").value,
    riskPerTradePct: $("planRisk").value,
    dailyStopR: $("planDailyStop").value,
    maxTrades: $("planMaxTrades").value,
    reviewRoutine: $("planReview").value,
    acceptsUncertainty: $("planUncertainty").checked
  };
}

function fillPlaybookForm(plan) {
  $("planMarket").value = plan.market;
  $("planSetup").value = plan.setup;
  $("planContext").value = plan.context;
  $("planTrigger").value = plan.trigger;
  $("planInvalidation").value = plan.invalidation;
  $("planRisk").value = plan.riskPerTradePct || "";
  $("planDailyStop").value = plan.dailyStopR || "";
  $("planMaxTrades").value = plan.maxTrades || "";
  $("planReview").value = plan.reviewRoutine;
  $("planUncertainty").checked = plan.acceptsUncertainty;
}

function savePlaybook(event) {
  event.preventDefault();
  savedPlaybook = SuzyProfessionalCore.normalizePlaybook(playbookFromForm());
  const evaluation = SuzyProfessionalCore.evaluatePlaybook(savedPlaybook);
  localStorage.setItem(PROFESSIONAL_STORAGE_KEY, JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    plan: savedPlaybook
  }));
  render();
  $("playbookFeedback").textContent = evaluation.valid
    ? "Plano salvo e validado neste navegador."
    : `Rascunho salvo. Ainda faltam ${evaluation.missing.length} critério(s).`;
  $("playbookFeedback").className = `form-feedback wide ${evaluation.valid ? "success" : "error"}`;
}

function resetPlaybook() {
  if (!confirm("Limpar o plano operacional salvo neste navegador?")) return;
  localStorage.removeItem(PROFESSIONAL_STORAGE_KEY);
  savedPlaybook = SuzyProfessionalCore.normalizePlaybook({});
  fillPlaybookForm(savedPlaybook);
  $("playbookFeedback").textContent = "Plano local removido.";
  $("playbookFeedback").className = "form-feedback wide";
  render();
}

function exportEvidence() {
  const result = render();
  const report = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notice: "Relatório educacional interno. Não comprova habilitação profissional nem resultado financeiro.",
    status: result.status,
    percent: result.percent,
    completedStages: result.completedStages,
    evidence: result.evidence,
    stages: result.stages.map(stage => ({
      id: stage.id,
      title: stage.title,
      passed: stage.passed,
      progress: stage.progress,
      requirements: stage.requirements
    })),
    playbook: result.playbook.plan
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `suzy-passaporte-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

$("playbookForm").addEventListener("submit", savePlaybook);
$("resetPlaybook").addEventListener("click", resetPlaybook);
$("refreshEvidence").addEventListener("click", render);
$("exportEvidence").addEventListener("click", exportEvidence);
window.addEventListener("storage", render);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") render();
});

fillPlaybookForm(savedPlaybook);
render();
