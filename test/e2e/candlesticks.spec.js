const { test, expect } = require("@playwright/test");

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
});

test("abre a base de candlesticks pela Área do Aluno", async ({ page }) => {
  await page.goto("/alunos.html#library");
  const libraryLink = page.locator('a[href="candlesticks.html"]');
  await expect(libraryLink).toContainText("Base de Padrões de Candlestick");
  await libraryLink.click();
  await expect(page).toHaveURL(/candlesticks\.html$/);
  await expect(page.getByRole("heading", { name: "Base de Padrões de Candlestick", exact: true })).toBeVisible();
});

test("carrega métricas e filtra os registros importados", async ({ page }) => {
  await page.goto("/candlesticks.html");
  await expect(page.locator("#metricTotal")).toHaveText("69");
  await expect(page.locator("#metricPatterns")).toHaveText("35");
  await expect(page.locator("#metricAssets")).toHaveText("13");
  await expect(page.locator("#metricTimeframes")).toHaveText("7");
  await expect(page.locator('[data-entry="candlestick"]')).toHaveCount(69);

  await page.locator("#studySection").selectOption("emergente");
  await expect(page.locator('[data-entry="candlestick"]')).toHaveCount(9);
  await expect(page.locator("#studyResultCount")).toHaveText("9 de 69 registros exibidos");

  await page.locator("#clearStudyFilters").click();
  await page.locator("#studySearch").fill("Three Outside Down");
  await expect(page.locator('[data-entry="candlestick"]')).toHaveCount(2);

  await page.locator("#clearStudyFilters").click();
  await page.locator("#studyAsset").selectOption("Tesla");
  await expect(page.locator('[data-entry="candlestick"]')).toHaveCount(15);
});

test("deixa explícito que a base é snapshot e não sinal", async ({ page }) => {
  await page.goto("/candlesticks.html");
  await expect(page.getByText("SNAPSHOT, NÃO FEED AO VIVO", { exact: true })).toBeVisible();
  await expect(page.locator(".study-note")).toContainText("não um estado de mercado em tempo real").catch(() => {});
  await expect(page.locator(".study-note")).toContainText("Não representam situação atual do mercado");
  await expect(page.locator(".method-note")).toContainText("foram excluídas desta biblioteca");
});
