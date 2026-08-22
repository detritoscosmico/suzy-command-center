const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
}

async function fillExpectedAnswer(page) {
  const caseId = await page.locator("#caseLab").getAttribute("data-case-id");
  const answer = await page.evaluate(id => {
    const item = window.SuzyFixedIncomeCore.findCase(id);
    return { interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource };
  }, caseId);
  await page.locator("#caseInterpretation").selectOption(answer.interpretation);
  await page.locator("#caseDriver").selectOption(answer.driver);
  await page.locator("#caseAction").selectOption(answer.action);
  await page.locator("#caseSource").selectOption(answer.source);
  await page.locator("#caseRationale").fill("A análise identifica fluxo, taxa, risco, fonte institucional e limite de inferência sem converter o caso em recomendação financeira.");
}

test("Programa Profissional expõe a Entrega 06 e navega para renda fixa", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/programa.html");
  const link = page.locator('a[href="renda-fixa.html"]');
  await expect(link).toHaveCount(2);
  await link.first().click();
  await expect(page).toHaveURL(/\/renda-fixa\.html$/);
  await expect(page.locator("h1")).toContainText("Renda fixa");
});

test("calcula preço, duration, convexidade e curva em todos os projetos", async ({ page }) => {
  await page.goto("/renda-fixa.html");
  await page.locator("#fixedIncomeForm button[type=submit]").click();
  await expect(page.locator("#fiPrice")).toHaveText("926.40");
  await expect(page.locator("#fiMacaulay")).toHaveText("4.0113");
  await expect(page.locator("#fiModified")).toHaveText("3.7842");
  await expect(page.locator("#fiConvexity")).toHaveText("18.1423");
  await expect(page.locator("#fiApprox")).toHaveText("-3.6935%");
  await expect(page.locator("#fiExact")).toHaveText("-3.6951%");
  await expect(page.locator("#fiCurveShape")).toHaveText("INCLINADA POSITIVA");
  await expect(page.locator("#fiFeedback")).toContainText("nenhuma saída é indicação");
});

test("aprova Renda Fixa E3 após seis variantes sem violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/renda-fixa.html");
  for (let index = 0; index < 6; index += 1) {
    await fillExpectedAnswer(page);
    await page.locator("#caseForm button[type=submit]").click();
    await expect(page.locator("#caseScore")).toHaveText("100");
    if (index < 5) await page.locator("#nextCase").click();
  }
  await expect(page.locator("#kpiCases")).toHaveText("6/6");
  await expect(page.locator("#kpiStatus")).toHaveText("E3 APROVADO");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-fixed-income-v1")));
  expect(stored.passed).toBe(true);
});

test("negação de marcação a mercado gera violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/renda-fixa.html");
  const seed = await page.evaluate(() => {
    for (let candidate = 1; candidate < 1000; candidate += 1) {
      if (window.SuzyFixedIncomeCore.createSession(candidate).cases[0].severity === "NO_MARK_TO_MARKET") return candidate;
    }
    return 1;
  });
  await page.locator("#sessionSeed").fill(String(seed));
  await page.locator("#startSession").click();
  const expected = await page.evaluate(() => {
    const item = window.SuzyFixedIncomeCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    return { driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource };
  });
  await page.locator("#caseInterpretation").selectOption("CONSISTENT_MECHANISM");
  await page.locator("#caseDriver").selectOption(expected.driver);
  await page.locator("#caseAction").selectOption(expected.action);
  await page.locator("#caseSource").selectOption(expected.source);
  await page.locator("#caseRationale").fill("Aceito a afirmação de que o preço de um prefixado não pode cair antes do vencimento mesmo quando a taxa exigida pelo mercado aumenta.");
  await page.locator("#caseForm button[type=submit]").click();
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("NO_MARK_TO_MARKET");
  await expect(page.locator("#kpiViolations")).toHaveText("1");
});

test("fontes institucionais abrem em nova aba com proteção de opener", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/renda-fixa.html");
  const links = page.locator("#sourceLab a");
  await expect(links).toHaveCount(7);
  for (let index = 0; index < 7; index += 1) {
    await expect(links.nth(index)).toHaveAttribute("target", "_blank");
    await expect(links.nth(index)).toHaveAttribute("rel", /noopener/);
  }
});
