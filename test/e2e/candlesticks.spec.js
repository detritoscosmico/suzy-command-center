const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

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
  await expect(page.locator(".study-note")).toContainText("Não representam situação atual do mercado");
  await expect(page.locator(".study-note")).toContainText("recomendação, previsão ou sinal operacional");
  await expect(page.locator(".method-note")).toContainText("foram excluídas desta biblioteca");
});

test("não possui violações críticas ou sérias de acessibilidade", async ({ page }) => {
  await page.goto("/candlesticks.html");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(violation => ["critical", "serious"].includes(violation.impact));
  expect(blocking.map(violation => ({ id: violation.id, impact: violation.impact }))).toEqual([]);
});
