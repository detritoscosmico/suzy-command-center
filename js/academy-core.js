(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.AcademyCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function uniqueLessonIds(completed = [], lessonIds = []) {
    const valid = new Set(lessonIds);
    return [...new Set(completed.filter(id => valid.has(id)))];
  }

  function calculateProgress(completed = [], totalLessons = 0) {
    const total = Math.max(0, Number(totalLessons) || 0);
    if (!total) return { completed: 0, total: 0, percent: 0 };

    const done = Math.min(new Set(completed).size, total);
    return {
      completed: done,
      total,
      percent: Math.round((done / total) * 100)
    };
  }

  function gradeAssessment(answers = {}, answerKey = {}, passingScore = 70) {
    const questionIds = Object.keys(answerKey);
    const total = questionIds.length;
    const correct = questionIds.reduce(
      (sum, id) => sum + (answers[id] === answerKey[id] ? 1 : 0),
      0
    );
    const score = total ? Math.round((correct / total) * 100) : 0;

    return {
      total,
      correct,
      score,
      passed: score >= passingScore,
      passingScore
    };
  }

  function canUnlockLesson(index, completed = [], lessonIds = []) {
    if (index <= 0) return true;
    return completed.includes(lessonIds[index - 1]);
  }

  function normalizeAcademyState(raw, lessonIds = []) {
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
      bestScore: Math.max(0, Math.min(100, Number(source.bestScore) || 0)),
      attempts: Math.max(0, Math.floor(Number(source.attempts) || 0)),
      passed: Boolean(source.passed)
    };
  }

  return {
    uniqueLessonIds,
    calculateProgress,
    gradeAssessment,
    canUnlockLesson,
    normalizeAcademyState
  };
});
