(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyProfessionalCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const THRESHOLDS = Object.freeze({
    academy1Lessons: 6,
    academy2Lessons: 8,
    replayTrades: 20,
    simulatorTrades: 10,
    journalEntries: 20,
    journalAdherence: 80,
    journalQuality: 4,
    psychologyLessons: 5,
    psychologyAssessments: 1,
    psychologyCheckIns: 7
  });

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function cleanText(value, maximum) {
    return String(value ?? "").trim().slice(0, maximum);
  }

  function integer(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function ratioProgress(current, target) {
    const safeTarget = Math.max(1, Number(target) || 1);
    return Math.round(clamp((Number(current) || 0) / safeTarget, 0, 1) * 100);
  }

  function booleanRequirement(label, met, detail) {
    return {
      label,
      current: met ? 1 : 0,
      target: 1,
      unit: detail || "aprovação",
      progress: met ? 100 : 0,
      met: Boolean(met)
    };
  }

  function numericRequirement(label, current, target, unit, options = {}) {
    const number = Number(current) || 0;
    const met = options.maximum
      ? number > 0 && number <= target
      : number >= target;
    return {
      label,
      current: Number(number.toFixed(2)),
      target,
      unit,
      progress: options.maximum ? (met ? 100 : 0) : ratioProgress(number, target),
      met
    };
  }

  function normalizePlaybook(candidate = {}) {
    return {
      market: cleanText(candidate.market, 50),
      setup: cleanText(candidate.setup, 120),
      context: cleanText(candidate.context, 240),
      trigger: cleanText(candidate.trigger, 240),
      invalidation: cleanText(candidate.invalidation, 240),
      riskPerTradePct: Number(clamp(candidate.riskPerTradePct, 0, 100).toFixed(2)),
      dailyStopR: Number(clamp(candidate.dailyStopR, 0, 100).toFixed(2)),
      maxTrades: integer(candidate.maxTrades),
      reviewRoutine: cleanText(candidate.reviewRoutine, 300),
      acceptsUncertainty: candidate.acceptsUncertainty === true
    };
  }

  function evaluatePlaybook(candidate = {}) {
    const plan = normalizePlaybook(candidate);
    const checks = [
      { key: "market", label: "Mercado e universo de ativos definidos", met: Boolean(plan.market) },
      { key: "setup", label: "Setup descrito em regras", met: Boolean(plan.setup) },
      { key: "context", label: "Contexto obrigatório definido", met: Boolean(plan.context) },
      { key: "trigger", label: "Gatilho de entrada objetivo", met: Boolean(plan.trigger) },
      { key: "invalidation", label: "Invalidação técnica definida", met: Boolean(plan.invalidation) },
      { key: "riskPerTradePct", label: "Risco por operação entre 0,10% e 2%", met: plan.riskPerTradePct >= 0.1 && plan.riskPerTradePct <= 2 },
      { key: "dailyStopR", label: "Stop diário entre 0,50R e 5R", met: plan.dailyStopR >= 0.5 && plan.dailyStopR <= 5 },
      { key: "maxTrades", label: "Limite entre 1 e 10 operações", met: plan.maxTrades >= 1 && plan.maxTrades <= 10 },
      { key: "reviewRoutine", label: "Rotina de revisão pós-sessão", met: Boolean(plan.reviewRoutine) },
      { key: "acceptsUncertainty", label: "Declaração de incerteza aceita", met: plan.acceptsUncertainty }
    ];

    return {
      plan,
      checks,
      missing: checks.filter(check => !check.met).map(check => check.label),
      progress: Math.round((checks.filter(check => check.met).length / checks.length) * 100),
      valid: checks.every(check => check.met)
    };
  }

  function normalizeEvidence(candidate = {}) {
    const academy1 = candidate.academy1 || {};
    const academy2 = candidate.academy2 || {};
    const journal = candidate.journal || {};
    const psychology = candidate.psychology || {};

    return {
      academy1: {
        completed: integer(academy1.completed),
        total: integer(academy1.total) || THRESHOLDS.academy1Lessons,
        passed: academy1.passed === true,
        bestScore: clamp(academy1.bestScore, 0, 100)
      },
      academy2: {
        completed: integer(academy2.completed),
        total: integer(academy2.total) || THRESHOLDS.academy2Lessons,
        passed: academy2.passed === true,
        bestScore: clamp(academy2.bestScore, 0, 100)
      },
      replayTrades: integer(candidate.replayTrades),
      simulatorTrades: integer(candidate.simulatorTrades),
      journal: {
        total: integer(journal.total),
        adherence: clamp(journal.adherence, 0, 100),
        averageQuality: clamp(journal.averageQuality, 0, 5)
      },
      psychology: {
        lessons: integer(psychology.lessons),
        assessments: integer(psychology.assessments),
        checkIns: integer(psychology.checkIns)
      }
    };
  }

  function stageProgress(requirements) {
    if (!requirements.length) return 0;
    return Math.round(requirements.reduce((sum, requirement) => sum + requirement.progress, 0) / requirements.length);
  }

  function createStage(definition, unlocked) {
    const evidenceComplete = definition.requirements.every(requirement => requirement.met);
    return {
      ...definition,
      unlocked,
      evidenceComplete,
      passed: unlocked && evidenceComplete,
      progress: stageProgress(definition.requirements)
    };
  }

  function evaluateProgram(candidateEvidence = {}, candidatePlaybook = {}) {
    const evidence = normalizeEvidence(candidateEvidence);
    const playbook = evaluatePlaybook(candidatePlaybook);
    const definitions = [
      {
        id: "knowledge",
        number: 1,
        title: "Fundamentos e análise",
        description: "Comprovação teórica antes de avançar para execução.",
        href: "academia.html",
        requirements: [
          {
            ...booleanRequirement("Academia Nível 1 aprovada", evidence.academy1.passed, `${evidence.academy1.bestScore.toFixed(0)}%`),
            progress: evidence.academy1.passed ? 100 : ratioProgress(evidence.academy1.completed, evidence.academy1.total)
          },
          {
            ...booleanRequirement("Academia Nível 2 aprovada", evidence.academy2.passed, `${evidence.academy2.bestScore.toFixed(0)}%`),
            progress: evidence.academy2.passed ? 100 : ratioProgress(evidence.academy2.completed, evidence.academy2.total)
          }
        ]
      },
      {
        id: "practice",
        number: 2,
        title: "Prática deliberada",
        description: "Amostra mínima em ambientes artificiais, sem exigir lucro para aprovar.",
        href: "replay.html",
        requirements: [
          numericRequirement("Operações encerradas no replay", evidence.replayTrades, THRESHOLDS.replayTrades, "operações"),
          numericRequirement("Operações com custos no simulador", evidence.simulatorTrades, THRESHOLDS.simulatorTrades, "operações")
        ]
      },
      {
        id: "process",
        number: 3,
        title: "Processo auditável",
        description: "Consistência do registro e aderência às próprias regras.",
        href: "diario.html",
        requirements: [
          numericRequirement("Registros no Diário Profissional", evidence.journal.total, THRESHOLDS.journalEntries, "registros"),
          numericRequirement("Aderência ao plano", evidence.journal.adherence, THRESHOLDS.journalAdherence, "%"),
          numericRequirement("Qualidade média de execução", evidence.journal.averageQuality, THRESHOLDS.journalQuality, "/5")
        ]
      },
      {
        id: "discipline",
        number: 4,
        title: "Disciplina e autoconsciência",
        description: "Rotina comportamental sem usar pontuação psicológica como licença para operar.",
        href: "psicologia.html",
        requirements: [
          numericRequirement("Aulas comportamentais", evidence.psychology.lessons, THRESHOLDS.psychologyLessons, "aulas"),
          numericRequirement("Autoavaliação educacional", evidence.psychology.assessments, THRESHOLDS.psychologyAssessments, "avaliação"),
          numericRequirement("Check-ins registrados", evidence.psychology.checkIns, THRESHOLDS.psychologyCheckIns, "check-ins")
        ]
      },
      {
        id: "playbook",
        number: 5,
        title: "Playbook de mesa",
        description: "Plano operacional completo, limitado e revisável.",
        href: "#playbookTitle",
        requirements: [
          {
            label: "Plano operacional auditável",
            current: playbook.progress,
            target: 100,
            unit: "%",
            progress: playbook.progress,
            met: playbook.valid
          }
        ]
      }
    ];

    const stages = [];
    for (const definition of definitions) {
      const unlocked = definition.number === 1 || stages[stages.length - 1].passed;
      stages.push(createStage(definition, unlocked));
    }

    const completedStages = stages.filter(stage => stage.passed).length;
    const percent = Math.round(stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length);
    const nextStage = stages.find(stage => !stage.passed) || null;
    const nextRequirement = nextStage?.requirements.find(requirement => !requirement.met) || null;
    const statusLabels = [
      "Fundação em construção",
      "Base teórica comprovada",
      "Prática em consolidação",
      "Processo auditável",
      "Disciplina documentada",
      "Ciclo profissional concluído"
    ];

    return {
      version: 1,
      evidence,
      playbook,
      stages,
      completedStages,
      totalStages: stages.length,
      percent,
      qualified: completedStages === stages.length,
      status: statusLabels[completedStages],
      nextAction: nextStage ? {
        stageId: nextStage.id,
        href: nextStage.href,
        label: nextRequirement?.label || nextStage.title
      } : null
    };
  }

  return {
    THRESHOLDS,
    normalizePlaybook,
    evaluatePlaybook,
    normalizeEvidence,
    evaluateProgram
  };
});
