const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
}

async function fillExpectedAnswer(page) {
  const caseId = await page.locator("#caseLab").getAttribute("data-case-id");
  const answer = await page.evaluate(id => {
    const item = window.SuzyFinancialsCore.findCase(id);
    return { interpretation: item.expectedInterpretation, driver: item.expectedDriver, action: item.expectedAction, source: item.expectedSource };
  }, caseId);
  await page.locator("#caseInterpretation").selectOption(answer.interpretation);
  await page.locator("#caseDriver").selectOption(answer.driver);
  await page.locator("#caseAction").selectOption(answer.action);
  await page.locator("#caseSource").selectOption(answer.source);
  await page.locator("#caseRationale").fill("A leitura reconcilia DRE, balanço, caixa e notas, explicita a limitação do dado e registra a próxima evidência antes de qualquer conclusão de investimento.");
}

test("calcula snapshot financeiro sem transformar razões em recomendação", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/financials.html");
  await page.locator("#financialForm button[type=submit]").click();
  await expect(page.locator("#finGrossMargin")).toHaveText("42.00%");
  await expect(page.locator("#finOperatingMargin")).toHaveText("15.00%");
  await expect(page.locator("#finFcf")).toHaveText("50.00");
  await expect(page.locator("#finCurrentRatio")).toHaveText("2.00x");
  await expect(page.locator("#finNetDebt")).toHaveText("220.00");
  await expect(page.locator("#finFeedback")).toContainText("não classificam sozinhas");
});

test("aprova Demonstrações Financeiras E3 somente após seis variantes sem violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/financials.html");
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
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-financial-statements-v1")));
  expect(stored.passed).toBe(true);
});

test("conclusão determinística em caso que exige reconciliação gera violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/financials.html");
  const seed = await page.evaluate(() => {
    for (let candidate = 1; candidate < 500; candidate += 1) {
      if (window.SuzyFinancialsCore.createSession(candidate).cases[0].severity === "NO_DETERMINISTIC_CONCLUSION") return candidate;
    }
    return 1;
  });
  await page.locator("#sessionSeed").fill(String(seed));
  await page.locator("#startSession").click();
  const expected = await page.evaluate(() => {
    const item = window.SuzyFinancialsCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    return { driver: item.expectedDriver, action: item.expectedAction, source: item.expectedSource };
  });
  await page.locator("#caseInterpretation").selectOption("QUALITY_WEAKENED");
  await page.locator("#caseDriver").selectOption(expected.driver);
  await page.locator("#caseAction").selectOption(expected.action);
  await page.locator("#caseSource").selectOption(expected.source);
  await page.locator("#caseRationale").fill("Vou forçar uma conclusão direcional mesmo que o caso dependa de notas, reconciliação e composição adicionais antes de interpretar a qualidade das demonstrações.");
  await page.locator("#caseForm button[type=submit]").click();
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("VIOLAÇÃO DURA");
  await expect(page.locator("#kpiViolations")).toHaveText("1");
});