const { test, expect } = require("@playwright/test");
const derivativesCore = require("../../js/derivatives-core.js");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
}

function passingHistory() {
  return derivativesCore.createSession(77).cases.map((item, index) => ({
    sessionId:"derivatives-approved",
    seed:77,
    timestamp:new Date(Date.UTC(2026,7,22,16,index)).toISOString(),
    caseId:item.id,
    answer:{ interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource, rationale:"A resposta mapeia payoff, fluxo, risco, fonte institucional e limite de modelo antes de qualquer conclusão operacional ou financeira." }
  }));
}

async function fillExpectedAnswer(page) {
  const caseId = await page.locator("#caseLab").getAttribute("data-case-id");
  const answer = await page.evaluate(id => {
    const item = window.SuzyDerivativesCore.findCase(id);
    return { interpretation:item.expectedInterpretation, driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource };
  }, caseId);
  await page.locator("#caseInterpretation").selectOption(answer.interpretation);
  await page.locator("#caseDriver").selectOption(answer.driver);
  await page.locator("#caseAction").selectOption(answer.action);
  await page.locator("#caseSource").selectOption(answer.source);
  await page.locator("#caseRationale").fill("A análise mapeia payoff, fluxo de caixa, risco, fonte institucional e limite do modelo sem converter o cenário em sinal ou recomendação.");
}

test("Programa Profissional expõe a Entrega 07 e navega para derivativos", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/programa.html");
  const link = page.locator('a[href="derivativos.html"]');
  await expect(link).toHaveCount(2);
  await link.first().click();
  await expect(page).toHaveURL(/\/derivativos\.html$/);
  await expect(page.locator("h1")).toContainText("Derivativos");
});

test("calcula snapshot educacional de futuros, DI, opções e swap", async ({ page }) => {
  await page.goto("/derivativos.html");
  expect(await page.locator("#derivativesForm").evaluate(form => form.checkValidity())).toBe(true);
  await page.locator("#derivativesForm button[type=submit]").click();
  await expect(page.locator("#futPnl")).toHaveText("100.00");
  await expect(page.locator("#basisValue")).toHaveText("500.00 (0.5000%)");
  await expect(page.locator("#diPu")).toHaveText("89285.71");
  await expect(page.locator("#optionExpiry")).toHaveText("-5.00");
  const optionModelPrice = Number(await page.locator("#optionModelPrice").textContent());
  expect(optionModelPrice).toBeCloseTo(3.275, 3);
  await expect(page.locator("#optionDelta")).toHaveText("0.559820");
  await expect(page.locator("#optionGamma")).not.toHaveText("N/A");
  await expect(page.locator("#optionTheta")).not.toHaveText("N/A");
  await expect(page.locator("#optionVega")).not.toHaveText("N/A");
  await expect(page.locator("#swapNet")).toHaveText("10000.00");
  await expect(page.locator("#derivativesFeedback")).toContainText("não são sinais de entrada");
});

test("normaliza cancelamento numérico sem invalidar o snapshot completo", async ({ page }) => {
  await page.goto("/derivativos.html");
  await page.locator("#optionSpot").fill("1");
  await page.locator("#optionStrike").fill("10");
  await page.locator("#optionRate").fill("0");
  await page.locator("#optionVol").fill("100");
  await page.locator("#optionDays").fill("30");
  await page.locator("#derivativesForm button[type=submit]").click();
  await expect(page.locator("#optionModelPrice")).toHaveText("0.0000");
  await expect(page.locator("#optionTime")).toHaveText("0.0000");
  await expect(page.locator("#swapNet")).toHaveText("10000.00");
  await expect(page.locator("#derivativesFeedback")).toContainText("Snapshot educacional calculado");
});

test("preserva componente temporal negativo em cenário europeu com taxa negativa", async ({ page }) => {
  await page.goto("/derivativos.html");
  await page.locator("#optionSpot").fill("100");
  await page.locator("#optionStrike").fill("50");
  await page.locator("#optionRate").fill("-100");
  await page.locator("#optionVol").fill("1");
  await page.locator("#optionDays").fill("365");
  await page.locator("#derivativesForm button[type=submit]").click();
  await expect(page.locator("#optionModelPrice")).toHaveText("0.0000");
  await expect(page.locator("#optionIntrinsic")).toHaveText("50.0000");
  await expect(page.locator("#optionTime")).toHaveText("-50.0000");
});

test("validação nativa bloqueia volatilidade abaixo do limite e o core também rejeita zero", async ({ page }) => {
  await page.goto("/derivativos.html");
  await page.locator("#optionVol").fill("0");
  const validity = await page.locator("#optionVol").evaluate(input => ({ formValid:input.form.checkValidity(), rangeUnderflow:input.validity.rangeUnderflow }));
  expect(validity.formValid).toBe(false);
  expect(validity.rangeUnderflow).toBe(true);
  const coreResult = await page.evaluate(() => window.SuzyDerivativesCore.blackScholesSnapshot({ spot:100, strike:100, annualRatePercent:10, volatilityPercent:0, days:30, type:"CALL" }));
  expect(coreResult.valid).toBe(false);
  expect(coreResult.reason).toBe("INVALID_MODEL_INPUT");
});

test("resultado da avaliação é anunciado e recebe foco programático", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/derivativos.html");
  await fillExpectedAnswer(page);
  await page.locator("#caseForm button[type=submit]").click();
  const result = page.locator("#caseResult");
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute("role", "status");
  await expect(result).toHaveAttribute("aria-live", "polite");
  await expect(result).toHaveAttribute("aria-atomic", "true");
  await expect(result).toContainText("100");
  await expect(result).toContainText("APROVADO");
  await expect(result).toContainText("Resposta esperada:");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("caseResult");
});

test("aprova Derivativos E3 após seis variantes sem violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/derivativos.html");
  for (let index = 0; index < 6; index += 1) {
    await fillExpectedAnswer(page);
    await page.locator("#caseForm button[type=submit]").click();
    await expect(page.locator("#caseScore")).toHaveText("100");
    if (index < 5) await page.locator("#nextCase").click();
  }
  await expect(page.locator("#kpiCases")).toHaveText("6/6");
  await expect(page.locator("#kpiStatus")).toHaveText("E3 APROVADO");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-derivatives-v1")));
  expect(stored.passed).toBe(true);
});

test("tratar margem como perda máxima gera violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/derivativos.html");
  const seed = await page.evaluate(() => {
    for (let candidate = 1; candidate < 5000; candidate += 1) {
      if (window.SuzyDerivativesCore.createSession(candidate).cases[0].id === "margin-is-not-max-loss") return candidate;
    }
    return 1;
  });
  await page.locator("#sessionSeed").fill(String(seed));
  await page.locator("#startSession").click();
  const expected = await page.evaluate(() => {
    const item = window.SuzyDerivativesCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    return { driver:item.expectedDriver, action:item.expectedAction, source:item.expectedSource };
  });
  await page.locator("#caseInterpretation").selectOption("CONSISTENT_MECHANISM");
  await page.locator("#caseDriver").selectOption(expected.driver);
  await page.locator("#caseAction").selectOption(expected.action);
  await page.locator("#caseSource").selectOption(expected.source);
  await page.locator("#caseRationale").fill("Aceito que a margem depositada é o limite máximo de perda mesmo quando o notional e os ajustes diários podem superar esse valor.");
  await page.locator("#caseForm button[type=submit]").click();
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("MARGIN_CAPS_LOSS");
  await expect(page.locator("#caseScore")).toHaveText("49");
});

test("fontes institucionais abrem em nova aba com proteção de opener", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/derivativos.html");
  const links = page.locator("#sourceLab a");
  await expect(links).toHaveCount(10);
  for (let index = 0; index < 10; index += 1) {
    await expect(links.nth(index)).toHaveAttribute("target", "_blank");
    await expect(links.nth(index)).toHaveAttribute("rel", /noopener/);
  }
});

test("Área do Aluno reconhece Derivativos E3 e totaliza dezenove módulos", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const approved = passingHistory();
  expect(derivativesCore.evaluateSession(approved).passed).toBe(true);
  await page.addInitScript(history => localStorage.setItem("suzy-derivatives-v1", JSON.stringify({ version:1, history })), approved);
  await page.goto("/alunos.html");
  await expect(page.locator('#studentModules a[href="derivativos.html"]')).toContainText("CONCLUÍDO");
  await expect(page.locator("#kpiModules")).toHaveText("1/19");
});
