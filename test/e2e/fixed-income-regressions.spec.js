const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Regressão de estado coberta uma vez no Chromium desktop.");
}

const approvedCases = [
  ["price-yield-inverse", "CONSISTENT_MECHANISM", "PRICE_YIELD", "REPRICE_CASH_FLOWS", "TREASURY_SECONDARY"],
  ["curve-guarantees-selic", "INSUFFICIENT_EVIDENCE", "TERM_STRUCTURE", "SEPARATE_CURVE_FROM_FORECAST", "TREASURY_SECONDARY"],
  ["duration-long-bond", "CONSISTENT_MECHANISM", "DURATION", "COMPARE_DURATION", "TREASURY_SECONDARY"],
  ["duration-only-large-shock", "RISK_OR_PREMISE_UNDERSTATED", "CONVEXITY", "ADD_CONVEXITY", "TREASURY_SECONDARY"],
  ["credit-spread-widens", "CONSISTENT_MECHANISM", "CREDIT_SPREAD", "CHECK_SPREAD_AND_ISSUER", "CVM_DEBENTURES"],
  ["fixed-income-no-credit-risk", "RISK_OR_PREMISE_UNDERSTATED", "CREDIT_QUALITY", "CHECK_CREDIT_RISK", "CVM_RISK"]
];

function passingHistory() {
  return approvedCases.map(([caseId, interpretation, driver, action, source], index) => ({
    sessionId: "fixed-income-approved-old",
    seed: 77,
    timestamp: new Date(Date.UTC(2026, 6, 1, 10, index)).toISOString(),
    caseId,
    answer: {
      interpretation, driver, action, source,
      rationale: "A resposta aprovada documenta mecanismo, fonte institucional, risco relevante e limite de inferência antes de qualquer conclusão financeira."
    }
  }));
}

test("rejeita yield fora do intervalo sem calcular com valor truncado", async ({ page }) => {
  await page.goto("/renda-fixa.html");
  await page.locator("#fiYield").fill("-100");
  await page.locator("#fixedIncomeForm button[type=submit]").click();
  await expect(page.locator("#fiPrice")).toHaveText("N/A");
  await expect(page.locator("#fiFeedback")).toContainText("Entradas inválidas");
});

test("preserva aprovação E3 antiga depois de mais de sessenta tentativas", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(history => {
    const later = Array.from({ length: 60 }, (_, index) => ({
      sessionId: `later-${Math.floor(index / 6)}`,
      seed: 100 + index,
      timestamp: new Date(Date.UTC(2026, 7, 1, 10, index)).toISOString(),
      caseId: history[index % history.length].caseId,
      answer: { interpretation:"", driver:"", action:"", source:"", rationale:"tentativa posterior incompleta" }
    }));
    localStorage.setItem("suzy-fixed-income-v1", JSON.stringify({ version:1, history:[...history, ...later] }));
  }, passingHistory());
  await page.goto("/renda-fixa.html");
  await expect(page.locator("#kpiStatus")).toHaveText("E3 APROVADO");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-fixed-income-v1")));
  expect(stored.history).toHaveLength(60);
  expect(stored.history.filter(item => item.sessionId === "fixed-income-approved-old")).toHaveLength(6);
  expect(stored.passed).toBe(true);
  expect(stored.bestAverage).toBe(100);
});

test("Área do Aluno reconhece Renda Fixa E3 e totaliza dezoito módulos", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(history => {
    localStorage.setItem("suzy-fixed-income-v1", JSON.stringify({ version:1, history }));
  }, passingHistory());
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="renda-fixa.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/18");
});
