const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
}

async function fillExpectedAnswer(page) {
  const caseId = await page.locator("#caseLab").getAttribute("data-case-id");
  const answer = await page.evaluate(id => {
    const item = window.SuzyEconomicsCore.findCase(id);
    return { interpretation: item.expectedInterpretation, driver: item.expectedDriver, action: item.expectedAction, source: item.expectedSource };
  }, caseId);
  await page.locator("#caseInterpretation").selectOption(answer.interpretation);
  await page.locator("#caseDriver").selectOption(answer.driver);
  await page.locator("#caseAction").selectOption(answer.action);
  await page.locator("#caseSource").selectOption(answer.source);
  await page.locator("#caseRationale").fill("A leitura separa nível de surpresa, descreve o mecanismo macroeconômico e explicita a próxima verificação antes de qualquer conclusão de mercado.");
}

test("calcula taxa real aproximada e surpresas sem gerar sinal operacional", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/economia.html");
  await page.locator("#macroForm button[type=submit]").click();
  await expect(page.locator("#macroRealRate")).toHaveText("6.00%");
  await expect(page.locator("#macroInflationSurprise")).toHaveText("+0.20 p.p.");
  await expect(page.locator("#macroGrowthSurprise")).toHaveText("+0.10 p.p.");
  await expect(page.locator("#macroFeedback")).toContainText("não é sinal");
});

test("aprova Economia E3 somente após seis variantes sem violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/economia.html");
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
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-economics-macro-v1")));
  expect(stored.passed).toBe(true);
});

test("chamada determinística em cenário condicional gera violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/economia.html");
  const seed = await page.evaluate(() => {
    for (let candidate = 1; candidate < 500; candidate += 1) {
      if (window.SuzyEconomicsCore.createSession(candidate).cases[0].severity === "NO_DETERMINISTIC_CALL") return candidate;
    }
    return 1;
  });
  await page.locator("#sessionSeed").fill(String(seed));
  await page.locator("#startSession").click();
  const expected = await page.evaluate(() => {
    const item = window.SuzyEconomicsCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    return { driver: item.expectedDriver, action: item.expectedAction, source: item.expectedSource };
  });
  await page.locator("#caseInterpretation").selectOption("TIGHTENING_BIAS");
  await page.locator("#caseDriver").selectOption(expected.driver);
  await page.locator("#caseAction").selectOption(expected.action);
  await page.locator("#caseSource").selectOption(expected.source);
  await page.locator("#caseRationale").fill("Vou tratar este cenário condicional como uma direção certa mesmo sem informação suficiente sobre precificação, persistência ou efeitos concorrentes.");
  await page.locator("#caseForm button[type=submit]").click();
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("VIOLAÇÃO DURA");
  await expect(page.locator("#kpiViolations")).toHaveText("1");
});
