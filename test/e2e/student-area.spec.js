const { test, expect } = require("@playwright/test");

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
});

test("salva perfil, presença e plano semanal somente no navegador", async ({ page }) => {
  await page.goto("/alunos.html");
  await expect(page.locator("#kpiModules")).toHaveText("0/17");
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
  await expect(page.locator("#kpiModules")).toHaveText("0/17");
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
  await expect(page.locator("#kpiModules")).toHaveText("1/17");
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
  await expect(page.locator("#kpiModules")).toHaveText("1/17");
});

test("reconhece a aprovação E3 de economia como evidência local", async ({ page }) => {
  await page.addInitScript(() => {
    const coreCases = [
      ["inflation-above-consensus", "TIGHTENING_BIAS", "INFLATION_SURPRISE", "CHECK_EXPECTATIONS", "BCB_TARGET"],
      ["fully-priced-rate-hike", "CONDITIONAL", "PRICING_SURPRISE", "CHECK_PRICING", "BCB_COPOM"],
      ["headline-down-services-sticky", "CONDITIONAL", "INFLATION_COMPOSITION", "CHECK_COMPOSITION", "IBGE_IPCA"],
      ["strong-growth-tight-labor", "TIGHTENING_BIAS", "ACTIVITY_LABOR", "CHECK_LAGS", "IBGE_PIB"],
      ["weak-growth-rising-unemployment", "EASING_BIAS", "GROWTH_SLOWDOWN", "CHECK_INFLATION_PERSISTENCE", "IBGE_LABOR"],
      ["fiscal-term-premium", "TIGHTENING_BIAS", "FISCAL_TERM_PREMIUM", "CHECK_FISCAL", "TESOURO"]
    ];
    const history = coreCases.map(([caseId, interpretation, driver, action, source], index) => ({
      sessionId: "economics-e3",
      seed: 13,
      timestamp: new Date(Date.UTC(2026, 7, 10, 12, index)).toISOString(),
      caseId,
      answer: { interpretation, driver, action, source, rationale: "A leitura separa nível de surpresa, descreve o mecanismo macroeconômico e documenta a verificação necessária antes de qualquer conclusão de mercado." }
    }));
    localStorage.setItem("suzy-economics-macro-v1", JSON.stringify({ version: 1, history }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="economia.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/17");
});

test("reconhece a aprovação E3 de demonstrações financeiras como evidência local", async ({ page }) => {
  await page.addInitScript(() => {
    const coreCases = [
      ["revenue-up-margin-up", "QUALITY_STRENGTHENED", "MARGIN_MIX", "CHECK_SEGMENTS", "CVM_COMPANIES"],
      ["profit-and-cfo-rise", "QUALITY_STRENGTHENED", "WORKING_CAPITAL", "CHECK_CFO_RECONCILIATION", "CPC03"],
      ["cfo-boosted-by-payables", "CONDITIONAL", "PAYABLES_STRETCH", "CHECK_WORKING_CAPITAL", "CPC03"],
      ["acquisition-debt-jump", "CONDITIONAL", "ACQUISITION_FUNDING", "CHECK_DEBT_MATURITY", "CVM_COMPANIES"],
      ["impairment-noncash", "CONDITIONAL", "IMPAIRMENT_NONCASH", "CHECK_NOTES", "CPC_PRONOUNCEMENTS"],
      ["capitalized-development-costs", "QUALITY_WEAKENED", "CAPITALIZATION_POLICY", "CHECK_CAPITALIZATION", "CPC_PRONOUNCEMENTS"]
    ];
    const history = coreCases.map(([caseId, interpretation, driver, action, source], index) => ({
      sessionId: "financials-e3",
      seed: 17,
      timestamp: new Date(Date.UTC(2026, 7, 10, 13, index)).toISOString(),
      caseId,
      answer: { interpretation, driver, action, source, rationale: "A leitura reconcilia DRE, balanço, fluxo de caixa e notas, documenta a limitação e define a próxima evidência necessária antes de qualquer conclusão." }
    }));
    localStorage.setItem("suzy-financial-statements-v1", JSON.stringify({ version: 1, history }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="financials.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/17");
});

test("reconhece a aprovação E3 de valuation como evidência local", async ({ page }) => {
  await page.addInitScript(() => {
    const coreCases = [
      ["low-discount-rate", "OVERSTATED_ASSUMPTIONS", "DISCOUNT_RATE", "RECALCULATE_WACC", "BCB_SELIC"],
      ["terminal-growth-high", "OVERSTATED_ASSUMPTIONS", "TERMINAL_GROWTH", "RUN_SENSITIVITY", "BCB_SELIC"],
      ["margin-recovery", "OVERSTATED_ASSUMPTIONS", "MARGIN_ASSUMPTION", "NORMALIZE_MARGIN", "CVM_FILINGS"],
      ["debt-reconciliation", "INSUFFICIENT_EVIDENCE", "CAPITAL_STRUCTURE", "RECONCILE_NET_DEBT", "CVM_FILINGS"],
      ["cyclical-peak", "INSUFFICIENT_EVIDENCE", "CYCLICAL_EARNINGS", "NORMALIZE_CYCLE", "CVM_FILINGS"],
      ["peer-mismatch", "INSUFFICIENT_EVIDENCE", "COMPARABILITY", "REBUILD_PEER_SET", "CVM_FILINGS"]
    ];
    const history = coreCases.map(([caseId, interpretation, driver, action, source], index) => ({
      sessionId: "valuation-e3",
      seed: 19,
      timestamp: new Date(Date.UTC(2026, 7, 15, 14, index)).toISOString(),
      caseId,
      answer: { interpretation, driver, action, source, rationale: "A análise documenta premissas, reconcilia enterprise value com equity value e trata o resultado como faixa sensível, não como preço garantido." }
    }));
    localStorage.setItem("suzy-valuation-v1", JSON.stringify({ version: 1, history }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="valuation.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/17");
});