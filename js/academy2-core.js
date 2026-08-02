(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.Academy2Core = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clampNumber(value, minimum, maximum, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function uniqueLessonIds(completed = [], lessonIds = []) {
    const valid = new Set(lessonIds);
    return [...new Set(completed.filter(id => valid.has(id)))];
  }

  function calculateProgress(completed = [], totalLessons = 0) {
    const total = Math.max(0, Math.floor(Number(totalLessons) || 0));
    if (!total) return { completed: 0, total: 0, percent: 0 };

    const done = Math.min(new Set(completed).size, total);
    return {
      completed: done,
      total,
      percent: Math.round((done / total) * 100)
    };
  }

  function canUnlockLesson(index, completed = [], lessonIds = []) {
    if (index <= 0) return true;
    return completed.includes(lessonIds[index - 1]);
  }

  function calculateEma(values = [], period = 9) {
    const safePeriod = Math.max(1, Math.round(Number(period) || 9));
    const multiplier = 2 / (safePeriod + 1);
    let previous = null;

    return values.map(value => {
      const number = Number(value);
      if (!Number.isFinite(number)) return previous;
      previous = previous === null
        ? number
        : number * multiplier + previous * (1 - multiplier);
      return previous;
    });
  }

  function classifyTechnicalContext(candles = []) {
    const valid = candles.filter(candle =>
      candle &&
      ["open", "high", "low", "close"].every(key => Number.isFinite(Number(candle[key])))
    );

    if (valid.length < 12) {
      return {
        trend: "INSUFFICIENT",
        score: 0,
        reasons: ["São necessários pelo menos 12 candles válidos."]
      };
    }

    const closes = valid.map(candle => Number(candle.close));
    const ema9 = calculateEma(closes, 9);
    const ema21 = calculateEma(closes, 21);
    const last = valid.at(-1);
    const fast = ema9.at(-1);
    const slow = ema21.at(-1);
    const fastPast = ema9.at(-5);
    const recent = valid.slice(-6);
    const previous = valid.slice(-12, -6);
    const recentHigh = Math.max(...recent.map(candle => Number(candle.high)));
    const recentLow = Math.min(...recent.map(candle => Number(candle.low)));
    const previousHigh = Math.max(...previous.map(candle => Number(candle.high)));
    const previousLow = Math.min(...previous.map(candle => Number(candle.low)));

    let bullish = 0;
    let bearish = 0;
    const reasons = [];

    if (last.close > fast && fast > slow) {
      bullish += 2;
      reasons.push("Preço acima da EMA 9 e EMA 9 acima da EMA 21.");
    }
    if (last.close < fast && fast < slow) {
      bearish += 2;
      reasons.push("Preço abaixo da EMA 9 e EMA 9 abaixo da EMA 21.");
    }
    if (fast > fastPast) {
      bullish += 1;
      reasons.push("EMA 9 inclinada para cima.");
    }
    if (fast < fastPast) {
      bearish += 1;
      reasons.push("EMA 9 inclinada para baixo.");
    }
    if (recentHigh > previousHigh && recentLow > previousLow) {
      bullish += 2;
      reasons.push("Máximas e mínimas recentes avançaram.");
    }
    if (recentHigh < previousHigh && recentLow < previousLow) {
      bearish += 2;
      reasons.push("Máximas e mínimas recentes recuaram.");
    }

    const total = Math.max(1, bullish + bearish);
    if (bullish >= bearish + 2) {
      return { trend: "UP", score: Math.round((bullish / total) * 100), reasons };
    }
    if (bearish >= bullish + 2) {
      return { trend: "DOWN", score: Math.round((bearish / total) * 100), reasons };
    }

    return {
      trend: "SIDEWAYS",
      score: Math.round((Math.max(bullish, bearish) / total) * 100),
      reasons: reasons.length ? reasons : ["Sem alinhamento técnico suficiente."]
    };
  }

  function calculateRiskReward({ entry, stop, target, direction = "LONG" }) {
    const safeEntry = Number(entry);
    const safeStop = Number(stop);
    const safeTarget = Number(target);
    const side = String(direction).toUpperCase();

    if (![safeEntry, safeStop, safeTarget].every(Number.isFinite)) {
      return { valid: false, risk: 0, reward: 0, ratio: 0, reason: "Valores inválidos." };
    }

    const risk = side === "SHORT" ? safeStop - safeEntry : safeEntry - safeStop;
    const reward = side === "SHORT" ? safeEntry - safeTarget : safeTarget - safeEntry;

    if (risk <= 0 || reward <= 0) {
      return {
        valid: false,
        risk,
        reward,
        ratio: 0,
        reason: "Stop e alvo não respeitam a direção escolhida."
      };
    }

    return {
      valid: true,
      risk,
      reward,
      ratio: Number((reward / risk).toFixed(2)),
      reason: ""
    };
  }

  function evaluateSetupChecklist(checks = {}, options = {}) {
    const required = Array.isArray(options.required)
      ? options.required
      : ["context", "zone", "trigger", "invalidation", "risk"];
    const blockers = Array.isArray(options.blockers)
      ? options.blockers
      : ["newsRisk", "emotionalRisk"];
    const completed = required.filter(key => Boolean(checks[key]));
    const activeBlockers = blockers.filter(key => Boolean(checks[key]));
    const score = required.length
      ? Math.round((completed.length / required.length) * 100)
      : 0;

    return {
      required: required.length,
      completed: completed.length,
      missing: required.filter(key => !checks[key]),
      blockers: activeBlockers,
      score,
      approved: completed.length === required.length && activeBlockers.length === 0
    };
  }

  function gradeAssessment(answers = {}, answerKey = {}, passingScore = 75) {
    const ids = Object.keys(answerKey);
    const correct = ids.reduce(
      (sum, id) => sum + (Number(answers[id]) === Number(answerKey[id]) ? 1 : 0),
      0
    );
    const score = ids.length ? Math.round((correct / ids.length) * 100) : 0;

    return {
      total: ids.length,
      correct,
      score,
      passingScore,
      passed: score >= passingScore
    };
  }

  function scorePractice(answer, expected) {
    const normalizedAnswer = String(answer || "").toUpperCase();
    const normalizedExpected = String(expected || "").toUpperCase();
    return {
      correct: normalizedAnswer === normalizedExpected,
      answer: normalizedAnswer,
      expected: normalizedExpected
    };
  }

  function normalizeLevel2State(raw, lessonIds = []) {
    const source = raw && typeof raw === "object" ? raw : {};
    const completed = uniqueLessonIds(
      Array.isArray(source.completed) ? source.completed : [],
      lessonIds
    );

    return {
      completed,
      activeLesson: lessonIds.includes(source.activeLesson)
        ? source.activeLesson
        : lessonIds[0] || null,
      bestScore: clampNumber(source.bestScore, 0, 100, 0),
      attempts: Math.max(0, Math.floor(Number(source.attempts) || 0)),
      passed: Boolean(source.passed),
      practiceAttempts: Math.max(0, Math.floor(Number(source.practiceAttempts) || 0)),
      practiceCorrect: Math.max(0, Math.floor(Number(source.practiceCorrect) || 0))
    };
  }

  function canOpenAssessment(state, totalLessons, minimumPractice = 5) {
    const progress = calculateProgress(state?.completed || [], totalLessons);
    return progress.completed === progress.total &&
      Number(state?.practiceAttempts || 0) >= minimumPractice;
  }

  return {
    calculateProgress,
    canUnlockLesson,
    calculateEma,
    classifyTechnicalContext,
    calculateRiskReward,
    evaluateSetupChecklist,
    gradeAssessment,
    scorePractice,
    normalizeLevel2State,
    canOpenAssessment
  };
});
