const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo coberto uma vez no Chromium desktop.");
}

test("dimensiona posição e mantém o risco dentro do orçamento", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/risco.html");

  await page.locator("#riskCapital").fill("10000");
  await page.locator("#riskPercent").fill("0.5");
  await page.locator("#entryPrice").fill("100");
  await page.locator("#stopPrice").fill("98");
  await page.locator("#quantityStep").fill("1");
  await page.locator("#positionForm button[type=submit]").click();

  await expect(page.locator("#positionState")).toHaveText("CALCULADO");
  await expect(page.locator("#positionBudget")).toContainText("50,00");
  await expect(page.locator("#positionQuantity")).toHaveText("25");
  await expect(page.locator("#kpiTradeRisk")).toHaveText("0,5%");
});

test("reprova concentração por grupo mesmo dentro do limite agregado", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/risco.html");
  await page.locator("#maxOpenRisk").fill("4");
  await page.locator("#maxGroupRisk").fill("1");

  for (const [asset, risk] of [["AAPL", "80"], ["NVDA", "70"]]) {
    await page.locator("#exposureAsset").fill(asset);
    await page.locator("#exposureGroup").fill("Tecnologia EUA");
    await page.locator("#exposureRisk").fill(risk);
    await page.locator("#exposureForm button[type=submit]").click();
  }

  await expect(page.locator("#kpiOpenRisk")).toHaveText("1,5%");
  await expect(page.locator("#exposureSummary")).toHaveClass(/fail/);
  await expect(page.locator("#exposureSummary")).toContainText("Tecnologia EUA acima de 1%");
});

test("interrompe stress test ao atingir o stop da sessão", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/risco.html");
  await page.locator("#stressRisk").fill("1");
  await page.locator("#stressStop").fill("2");
  await page.locator("#stressSequence").fill("-1,-1,-1,+2");
  await page.locator("#stressForm button[type=submit]").click();

  await expect(page.locator("#stressState")).toHaveText("STOP ATIVADO");
  await expect(page.locator("#stressTrades")).toHaveText("3/4");
  await expect(page.locator("#stressMessage")).toContainText("interrompeu 1 operação");
});

test("simula risco de ruína com premissas reproduzíveis", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/risco.html");
  await page.locator("#ruinPaths").fill("500");
  await page.locator("#ruinSeed").fill("42");
  await page.locator("#ruinForm button[type=submit]").click();

  await expect(page.locator("#ruinState")).toHaveText("SIMULAÇÃO REPRODUZÍVEL");
  await expect(page.locator("#ruinProbability")).toContainText("/500");
  await expect(page.locator("#ruinDisclaimer")).toContainText("Não prevê risco real");
});
