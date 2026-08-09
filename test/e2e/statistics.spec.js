const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
}

async function fillExpectedAnswer(page) {
  const caseId = await page.locator("#caseLab").getAttribute("data-case-id");
  const answer = await page.evaluate(id => {
    const item = window.SuzyStatisticsCore.findCase(id);
    return { conclusion: item.expectedConclusion, risk: item.expectedRisk, action: item.expectedAction, source: item.expectedSource };
  }, caseId);
  await page.locator("#caseConclusion").selectOption(answer.conclusion);
  await page.locator("#caseRisk").selectOption(answer.risk);
  await page.locator("#caseAction").selectOption(answer.action);
  await page.locator("#caseSource").selectOption(answer.source);
  await page.locator("#caseRationale").fill("A conclusão respeita o desenho da amostra, explicita a incerteza e define uma validação coerente com o risco principal identificado.");
}

test("calcula expectativa e intervalo sem declarar validação", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/estatistica.html");
  await page.locator("#sampleForm button[type=submit]").click();
  await expect(page.locator("#sampleTotal")).toHaveText("10");
  await expect(page.locator("#sampleWinRate")).toHaveText("70%");
  await expect(page.locator("#sampleExpectancy")).toHaveText("0.050R");
  await expect(page.locator("#sampleFeedback")).toContainText("não comprova estabilidade futura");
});

test("aprova E3 somente após seis variantes sem violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/estatistica.html");

  for (let index = 0; index < 6; index += 1) {
    await fillExpectedAnswer(page);
    await page.locator("#caseForm button[type=submit]").click();
    await expect(page.locator("#caseScore")).toHaveText("100");
    if (index < 5) await page.locator("#nextCase").click();
  }

  await expect(page.locator("#kpiCases")).toHaveText("6/6");
  await expect(page.locator("#kpiAverage")).toHaveText("100");
  await expect(page.locator("#kpiViolations")).toHaveText("0");
  await expect(page.locator("#kpiStatus")).toHaveText("E3 APROVADO");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-statistics-probability-v1")));
  expect(stored.passed).toBe(true);
});

test("aprovar método inválido gera violação dura e nota máxima 49", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/estatistica.html");
  const seed = await page.evaluate(() => {
    for (let candidate = 1; candidate < 500; candidate += 1) {
      if (window.SuzyStatisticsCore.createSession(candidate).cases[0].severity === "REJECT_UNSUPPORTED") return candidate;
    }
    return 1;
  });
  await page.locator("#sessionSeed").fill(String(seed));
  await page.locator("#startSession").click();
  const expected = await page.evaluate(() => {
    const item = window.SuzyStatisticsCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    return { risk: item.expectedRisk, action: item.expectedAction, source: item.expectedSource };
  });
  await page.locator("#caseConclusion").selectOption("SUPPORTED_LIMITED");
  await page.locator("#caseRisk").selectOption(expected.risk);
  await page.locator("#caseAction").selectOption(expected.action);
  await page.locator("#caseSource").selectOption(expected.source);
  await page.locator("#caseRationale").fill("Vou aceitar a conclusão apesar de o desenho descrito usar informação indevida ou seleção incompatível com uma avaliação imparcial.");
  await page.locator("#caseForm button[type=submit]").click();

  await expect(page.locator("#caseScore")).toHaveText("49");
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("VIOLAÇÃO DURA");
  await expect(page.locator("#kpiViolations")).toHaveText("1");
});

test("revela a fonte metodológica esperada após resposta incorreta", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/estatistica.html");
  const expected = await page.evaluate(() => {
    const item = window.SuzyStatisticsCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    const expectedSource = window.SuzyStatisticsCore.SOURCES.find(source => source.id === item.expectedSource);
    const wrongSource = window.SuzyStatisticsCore.SOURCES.find(source => source.id !== item.expectedSource);
    return {
      conclusion: item.expectedConclusion,
      risk: item.expectedRisk,
      action: item.expectedAction,
      sourceTitle: expectedSource.title,
      wrongSource: wrongSource.id
    };
  });

  await page.locator("#caseConclusion").selectOption(expected.conclusion);
  await page.locator("#caseRisk").selectOption(expected.risk);
  await page.locator("#caseAction").selectOption(expected.action);
  await page.locator("#caseSource").selectOption(expected.wrongSource);
  await page.locator("#caseRationale").fill("A conclusão respeita o desenho da amostra, explicita a incerteza e define uma validação coerente com o risco principal identificado.");
  await page.locator("#caseForm button[type=submit]").click();

  await expect(page.locator("#caseScore")).toHaveText("90");
  await expect(page.locator("#caseExpected")).toContainText(expected.sourceTitle);
});
