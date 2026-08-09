const { test, expect } = require("@playwright/test");

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
});

test("salva perfil, presença e plano semanal somente no navegador", async ({ page }) => {
  await page.goto("/alunos.html");
  await expect(page.locator("#kpiModules")).toHaveText("0/14");
  await page.locator("#studentName").fill("Danilo Alves");
  await page.locator("#studentGoal").selectOption("Gestão de risco");
  await page.locator("#studentWeeklyHours").fill("7");
  await page.locator("#studentProfileForm button[type=submit]").click();
  await expect(page.locator("#studentGreeting")).toHaveText("Bom estudo, Danilo Alves.");
  await expect(page.locator("#profileFeedback")).toContainText("somente neste navegador");
  await page.locator("#markAttendance").click();
  await expect(page.locator("#kpiAttendance")).toHaveText("1");
  await expect(page.locator("#kpiStreak")).toHaveText("1 dia");
  await page.locator('[data-task="foundation"]').check();
  await expect(page.locator("#kpiWeek")).toHaveText("1/6");
  await page.reload();
  await expect(page.locator("#studentGreeting")).toHaveText("Bom estudo, Danilo Alves.");
  await expect(page.locator('[data-task="foundation"]')).toBeChecked();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-student-area-v1")));
  expect(stored.profile).toEqual({ name: "Danilo Alves", goal: "Gestão de risco", weeklyHours: 7, startDate: expect.any(String) });
  expect(stored.profile.email).toBeUndefined();
});

test("reflete evidências existentes e indica a próxima etapa", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("suzy-academia-nivel1-v1", JSON.stringify({ completed: ["mentalidade", "mercados", "candles", "risco", "playbook", "validacao"], passed: true, bestScore: 85 }));
    localStorage.setItem("suzy-academia-nivel2-v1", JSON.stringify({ completed: [], passed: false, bestScore: 0 }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator("#studentModules")).toContainText("CONCLUÍDO");
  await expect(page.locator("#nextStudentAction")).toContainText("ACADEMIA NÍVEL 2 APROVADA");
});

test("não aceita avaliação pendente nem calendário demo como conclusão", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("suzy-academia-nivel1-v1", JSON.stringify({
      completed: ["mentalidade", "mercados", "candles", "risco", "playbook", "validacao"],
      passed: false,
      bestScore: 60
    }));
    localStorage.setItem("suzy.calendar.educational.v1", JSON.stringify({
      authorized: false,
      mode: "demo",
      events: [{ id: "demo-1" }, { id: "demo-2" }, { id: "demo-3" }]
    }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator("#kpiModules")).toHaveText("0/14");
  await expect(page.locator('#studentModules a[href="academia.html"]')).toContainText("Avaliação pendente");
  await expect(page.locator('#studentModules a[href="calendario.html"]')).not.toContainText("CONCLUÍDO");
});

test("reconhece a aprovação E3 de ética como evidência local", async ({ page }) => {
  await page.addInitScript(() => {
    const coreCases = [
      ["own-account-journal", "WITHIN_SCOPE", "NO", "DECISION"],
      ["paid-personalized-advice", "OUTSIDE_SCOPE", "YES", "CVM19"],
      ["recurring-public-reports", "OUTSIDE_SCOPE", "YES", "CVM20"],
      ["relative-account-password", "OUTSIDE_SCOPE", "YES", "CVM21"],
      ["broker-order-commission", "OUTSIDE_SCOPE", "YES", "CVM178"],
      ["general-risk-lesson", "WITHIN_SCOPE", "NO", "DECISION"]
    ];
    const history = coreCases.map(([caseId, action, conflict, source], index) => ({
      sessionId: "approved-e3",
      seed: 7,
      timestamp: new Date(Date.UTC(2026, 7, 9, 10, index)).toISOString(),
      caseId,
      answer: { action, conflict, source, rationale: "A resposta respeita a função aprovada e documenta a fronteira regulatória aplicável ao caso." }
    }));
    localStorage.setItem("suzy-ethics-regulation-v1", JSON.stringify({ version: 1, history }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="etica.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/14");
});

test("reconhece a aprovação E3 de estatística como evidência local", async ({ page }) => {
  await page.addInitScript(() => {
    const coreCases = [
      ["tiny-winning-streak", "INSUFFICIENT_EVIDENCE", "SMALL_SAMPLE", "EXPAND_SAMPLE", "NIST_SAMPLE_SIZE"],
      ["predeclared-holdout", "SUPPORTED_LIMITED", "NON_STATIONARITY", "STRATIFY_REGIMES", "ASA_ETHICS"],
      ["cherry-picked-session", "INVALID_METHOD", "SELECTION_BIAS", "AUDIT_SELECTION", "ASA_ETHICS"],
      ["hundred-variants-best", "INVALID_METHOD", "MULTIPLE_TESTING", "USE_HOLDOUT", "PBO"],
      ["future-normalization", "INVALID_METHOD", "DATA_LEAKAGE", "REBUILD_PIPELINE", "SKLEARN_LEAKAGE"],
      ["shuffled-time-series", "INVALID_METHOD", "DEPENDENCE", "TIME_AWARE_VALIDATION", "SKLEARN_CV"]
    ];
    const history = coreCases.map(([caseId, conclusion, risk, action, source], index) => ({
      sessionId: "statistics-e3",
      seed: 11,
      timestamp: new Date(Date.UTC(2026, 7, 9, 11, index)).toISOString(),
      caseId,
      answer: { conclusion, risk, action, source, rationale: "A conclusão respeita o desenho da amostra, documenta a incerteza e define a validação necessária para o caso." }
    }));
    localStorage.setItem("suzy-statistics-probability-v1", JSON.stringify({ version: 1, history }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="estatistica.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/14");
});
