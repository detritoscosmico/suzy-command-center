(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SuzyPsychologyCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DIMENSIONS = {
    impulse: {
      label: "Impulsividade",
      action: "Crie uma espera obrigatória de 90 segundos antes de qualquer decisão e verbalize a regra de entrada."
    },
    lossReaction: {
      label: "Reatividade a perdas",
      action: "Depois de uma perda, encerre a sequência, registre a emoção e faça uma revisão antes de continuar o treinamento."
    },
    planAdherence: {
      label: "Aderência ao plano",
      action: "Use um checklist binário. Sem contexto, gatilho, invalidação e risco definidos, nenhuma operação de estudo é registrada."
    },
    emotionalRegulation: {
      label: "Regulação emocional",
      action: "Aplique respiração lenta por dois minutos e adie decisões enquanto a ativação emocional estiver elevada."
    },
    patience: {
      label: "Paciência seletiva",
      action: "Defina previamente quais cenários serão ignorados e contabilize decisões evitadas como execução correta."
    },
    riskAcceptance: {
      label: "Aceitação do risco",
      action: "Antes da sessão, escreva o limite de perda e confirme que ele pode ser aceito sem tentativa de recuperação."
    }
  };

  const DEFAULT_STATE = {
    version: 1,
    lessonProgress: [],
    assessments: [],
    checkIns: []
  };

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function normalizeRating(value) {
    return Math.round(clamp(value, 1, 5));
  }

  function scoreDimension(values = [], reverse = false) {
    if (!Array.isArray(values) || !values.length) return null;
    const ratings = values.map(normalizeRating);
    const adjusted = reverse ? ratings.map(value => 6 - value) : ratings;
    const average = adjusted.reduce((sum, value) => sum + value, 0) / adjusted.length;
    return Number((((average - 1) / 4) * 100).toFixed(1));
  }

  function riskBand(score) {
    const normalized = clamp(score, 0, 100);
    if (normalized <= 25) return { key: "low", label: "Risco comportamental baixo" };
    if (normalized <= 50) return { key: "moderate", label: "Risco comportamental moderado" };
    if (normalized <= 75) return { key: "high", label: "Risco comportamental alto" };
    return { key: "very-high", label: "Risco comportamental muito alto" };
  }

  function evaluateAssessment(answers = {}, questions = []) {
    if (!Array.isArray(questions) || !questions.length) {
      throw new Error("A avaliação não possui perguntas configuradas.");
    }

    const grouped = {};
    for (const question of questions) {
      const id = String(question.id ?? "").trim();
      const dimension = String(question.dimension ?? "").trim();
      if (!id || !DIMENSIONS[dimension]) continue;
      if (!(id in answers)) throw new Error("Responda todas as afirmações antes de concluir a avaliação.");
      if (!grouped[dimension]) grouped[dimension] = [];
      grouped[dimension].push(normalizeRating(answers[id]));
    }

    const scores = {};
    for (const [dimension, values] of Object.entries(grouped)) {
      const reverse = questions
        .filter(question => question.dimension === dimension)
        .every(question => Boolean(question.reverse));
      scores[dimension] = scoreDimension(values, reverse);
    }

    const availableScores = Object.values(scores).filter(Number.isFinite);
    if (!availableScores.length) throw new Error("Não foi possível calcular a avaliação.");
    const overall = Number((availableScores.reduce((sum, value) => sum + value, 0) / availableScores.length).toFixed(1));

    return {
      id: `assessment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      overall,
      band: riskBand(overall),
      scores,
      actions: buildActionPlan(scores)
    };
  }

  function buildActionPlan(scores = {}) {
    return Object.entries(scores)
      .filter(([dimension, score]) => DIMENSIONS[dimension] && Number.isFinite(score))
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([dimension, score]) => ({
        dimension,
        label: DIMENSIONS[dimension].label,
        score: Number(score),
        action: DIMENSIONS[dimension].action
      }));
  }

  function evaluateReadiness(input = {}) {
    const sleepRisk = 6 - normalizeRating(input.sleepQuality);
    const activationRisk = normalizeRating(input.emotionalActivation);
    const recoveryRisk = normalizeRating(input.recoveryUrge);
    const clarityRisk = 6 - normalizeRating(input.planClarity);
    const stopRisk = input.acceptsStop === true ? 1 : 5;
    const breakRisk = input.recentRuleBreak === true ? 5 : 1;
    const values = [sleepRisk, activationRisk, recoveryRisk, clarityRisk, stopRisk, breakRisk];
    const score = Number((((values.reduce((sum, value) => sum + value, 0) / values.length - 1) / 4) * 100).toFixed(1));

    let status;
    if (score <= 30) {
      status = {
        key: "ready",
        label: "Estudo e simulação liberados",
        guidance: "Mantenha o plano, o limite e o registro de processo."
      };
    } else if (score <= 55) {
      status = {
        key: "reduced",
        label: "Somente simulação reduzida",
        guidance: "Diminua a exposição ao estímulo e trabalhe apenas um cenário previamente definido."
      };
    } else if (score <= 75) {
      status = {
        key: "pause",
        label: "Pausa técnica e revisão",
        guidance: "Não avance para decisões rápidas. Revise o diário e repita o protocolo depois da pausa."
      };
    } else {
      status = {
        key: "stop",
        label: "Encerrar a sessão de treinamento",
        guidance: "Interrompa o treinamento, afaste-se da tela e retome somente em outro período com nova avaliação."
      };
    }

    return {
      id: `checkin-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      date: normalizeDateKey(input.date || new Date()),
      createdAt: new Date().toISOString(),
      score,
      status,
      inputs: {
        sleepQuality: normalizeRating(input.sleepQuality),
        emotionalActivation: normalizeRating(input.emotionalActivation),
        recoveryUrge: normalizeRating(input.recoveryUrge),
        planClarity: normalizeRating(input.planClarity),
        acceptsStop: input.acceptsStop === true,
        recentRuleBreak: input.recentRuleBreak === true
      }
    };
  }

  function normalizeDateKey(value) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return new Date().toISOString().slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function upsertDailyCheckIn(checkIns = [], checkIn) {
    const source = Array.isArray(checkIns) ? checkIns : [];
    if (!checkIn || typeof checkIn !== "object") return [...source];
    const date = normalizeDateKey(checkIn.date);
    return [
      ...source.filter(item => normalizeDateKey(item.date) !== date),
      { ...checkIn, date }
    ]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 90);
  }

  function calculateStreak(checkIns = [], referenceDate = new Date()) {
    const dates = new Set((Array.isArray(checkIns) ? checkIns : []).map(item => normalizeDateKey(item.date)));
    const cursor = new Date(`${normalizeDateKey(referenceDate)}T12:00:00`);
    let streak = 0;

    while (dates.has(normalizeDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function normalizeAssessment(candidate = {}) {
    const overall = clamp(candidate.overall, 0, 100);
    const createdAt = new Date(candidate.createdAt);
    if (!Number.isFinite(createdAt.getTime())) return null;
    const scores = {};
    for (const dimension of Object.keys(DIMENSIONS)) {
      if (Number.isFinite(Number(candidate.scores?.[dimension]))) {
        scores[dimension] = clamp(candidate.scores[dimension], 0, 100);
      }
    }
    return {
      id: String(candidate.id || `assessment-${createdAt.getTime()}`),
      createdAt: createdAt.toISOString(),
      overall,
      band: riskBand(overall),
      scores,
      actions: buildActionPlan(scores)
    };
  }

  function normalizeCheckIn(candidate = {}) {
    const createdAt = new Date(candidate.createdAt);
    if (!Number.isFinite(createdAt.getTime())) return null;
    const score = clamp(candidate.score, 0, 100);
    const evaluated = evaluateReadiness({ ...candidate.inputs, date: candidate.date });
    return {
      id: String(candidate.id || `checkin-${createdAt.getTime()}`),
      date: normalizeDateKey(candidate.date),
      createdAt: createdAt.toISOString(),
      score,
      status: evaluated.status,
      inputs: evaluated.inputs
    };
  }

  function normalizeState(candidate = {}) {
    const lessonProgress = [...new Set(
      (Array.isArray(candidate.lessonProgress) ? candidate.lessonProgress : [])
        .filter(value => typeof value === "string")
        .map(value => value.trim())
        .filter(Boolean)
    )].slice(0, 20);

    const assessments = (Array.isArray(candidate.assessments) ? candidate.assessments : [])
      .map(normalizeAssessment)
      .filter(Boolean)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 24);

    const checkIns = (Array.isArray(candidate.checkIns) ? candidate.checkIns : [])
      .map(normalizeCheckIn)
      .filter(Boolean);

    return {
      version: 1,
      lessonProgress,
      assessments,
      checkIns: upsertManyCheckIns(checkIns)
    };
  }

  function upsertManyCheckIns(checkIns = []) {
    return checkIns.reduce((state, checkIn) => upsertDailyCheckIn(state, checkIn), []);
  }

  function cloneState(state = DEFAULT_STATE) {
    return JSON.parse(JSON.stringify(normalizeState(state)));
  }

  return {
    DIMENSIONS,
    DEFAULT_STATE,
    clamp,
    normalizeRating,
    scoreDimension,
    riskBand,
    evaluateAssessment,
    buildActionPlan,
    evaluateReadiness,
    normalizeDateKey,
    upsertDailyCheckIn,
    calculateStreak,
    normalizeState,
    cloneState
  };
});