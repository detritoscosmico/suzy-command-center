const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo coberto uma vez no Chromium desktop.");
}

test("mantém o desfecho oculto até a decisão ser travada", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/capstone.html");

  await expect(page.locator("#caseResult")).toBeHidden();
  await expect(page.locator(".locked-outcome")).toHaveText("DESFECHO BLOQUEADO");
  await page.locator("#caseRationale").fill("Prefiro ficar de fora porque o processo admite incerteza e exige disciplina antes do resultado.");
  await page.locator("#caseUncertainty").check();
  await page.locator("#caseForm button[type=submit]").click();

  await expect(page.locator("#caseResult")).toBeVisible();
  await expect(page.locator("#caseOutcome")).toContainText("Desfecho artificial");
  await expect(page.locator("#caseScore")).not.toHaveText("—");
});

test("a mesma semente reproduz o primeiro caso", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/capstone.html");
  await page.locator("#sessionSeed").fill("2");
  await page.locator("#startSession").click();
  const firstTitle = await page.locator("#caseTitle").textContent();

  await page.locator("#startSession").click();
  await expect(page.locator("#caseTitle")).toHaveText(firstTitle);
  await expect(page.locator("#caseProgress")).toHaveText("CASO 1 DE 4");
});

test("operar contra bloqueio explícito limita a nota a 49", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/capstone.html");
  await page.locator("#sessionSeed").fill("1");
  await page.locator("#startSession").click();
  await expect(page.locator("#caseTitle")).toContainText("NVDA");

  await page.locator("#caseAction").selectOption("TRADE");
  await page.locator("#blockerAssessment").selectOption("BLOCKED");
  await page.locator("#caseRisk").fill("0.25");
  await page.locator("#caseTrigger").fill("Rompimento confirmado do nível planejado");
  await page.locator("#caseInvalidation").fill("Fechamento abaixo da mínima estrutural");
  await page.locator("#caseRationale").fill("Estou registrando a decisão completa antes do desfecho para testar a penalidade de processo.");
  await page.locator("#caseUncertainty").check();
  await page.locator("#caseForm button[type=submit]").click();

  await expect(page.locator("#caseScore")).toHaveText("49");
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("VIOLAÇÃO DURA");
  await expect(page.locator("#kpiViolations")).toHaveText("1");
});
