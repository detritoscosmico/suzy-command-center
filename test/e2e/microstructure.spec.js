const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo coberto uma vez no Chromium desktop.");
}

test("executa ordem a mercado e decompõe o desvio", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/microestrutura.html");
  await page.locator("#orderQuantity").fill("50");
  await page.locator("#executionForm button[type=submit]").click();

  await expect(page.locator("#executionStatus")).toHaveText("FILLED");
  await expect(page.locator("#resultFillPct")).toHaveText("100%");
  await expect(page.locator("#resultSpread")).toContainText("1 pts");
  await expect(page.locator("#resultSlippage")).not.toHaveText("0 pts");
  await expect(page.locator("#historyTotal")).toHaveText("1");
});

test("choque de liquidez gera fill parcial e reprovação de qualidade", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/microestrutura.html");
  await page.locator('[data-preset="SHOCK"]').click();
  await page.locator("#orderQuantity").fill("50");
  await page.locator("#executionForm button[type=submit]").click();

  await expect(page.locator("#executionStatus")).toHaveText("PARTIAL");
  await expect(page.locator("#resultFillPct")).toHaveText("30%");
  await expect(page.locator("#kpiQuality")).toHaveText("REVISAR EXECUÇÃO");
  await expect(page.locator("#qualityChecks .fail")).toHaveCount(2);
});

test("stop com gap mostra componente separado", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/microestrutura.html");
  await page.locator("#orderType").selectOption("STOP");
  await page.locator("#orderTrigger").fill("105");
  await page.locator("#barOpen").fill("108");
  await page.locator("#barHigh").fill("112");
  await page.locator("#barLow").fill("107");
  await page.locator("#barClose").fill("110");
  await page.locator("#executionForm button[type=submit]").click();

  await expect(page.locator("#executionStatus")).toHaveText("FILLED");
  await expect(page.locator("#resultGap")).toHaveText("3 pts");
  await expect(page.locator("#resultDeviation")).not.toHaveText("3 pts");
});

test("limit preserva proteção de preço", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/microestrutura.html");
  await page.locator("#orderType").selectOption("LIMIT");
  await page.locator("#orderTrigger").fill("95");
  await page.locator("#barOpen").fill("94");
  await page.locator("#barHigh").fill("97");
  await page.locator("#barLow").fill("93");
  await page.locator("#barClose").fill("96");
  await page.locator("#executionForm button[type=submit]").click();

  await expect(page.locator("#resultFillPrice")).toHaveText("94");
  await expect(page.locator("#qualityChecks")).toContainText("Proteção da ordem limite respeitada");
});
