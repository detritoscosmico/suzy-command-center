const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
}

async function fillExpectedAnswer(page) {
  const caseId = await page.locator("#caseLab").getAttribute("data-case-id");
  const answer = await page.evaluate(id => {
    const item = window.SuzyEthicsCore.findCase(id);
    return { action: item.expectedAction, conflict: item.expectedConflict, source: item.expectedSource };
  }, caseId);
  await page.locator("#caseAction").selectOption(answer.action);
  await page.locator("#caseConflict").selectOption(answer.conflict);
  await page.locator("#caseSource").selectOption(answer.source);
  await page.locator("#caseRationale").fill("A classificação respeita a função-alvo aprovada, identifica a fronteira e impede avanço sem fonte suficiente.");
}

test("aprova E3 somente após seis variantes sem violação dura", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/etica.html");

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
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-ethics-regulation-v1")));
  expect(stored.passed).toBe(true);
});

test("autorizar caso fora do escopo gera violação dura e nota máxima 49", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/etica.html");
  const seed = await page.evaluate(() => {
    for (let candidate = 1; candidate < 500; candidate += 1) {
      if (window.SuzyEthicsCore.createSession(candidate).cases[0].expectedAction === "OUTSIDE_SCOPE") return candidate;
    }
    return 1;
  });
  await page.locator("#sessionSeed").fill(String(seed));
  await page.locator("#startSession").click();
  const expected = await page.evaluate(() => {
    const item = window.SuzyEthicsCore.findCase(document.querySelector("#caseLab").dataset.caseId);
    return { conflict: item.expectedConflict, source: item.expectedSource };
  });
  await page.locator("#caseAction").selectOption("WITHIN_SCOPE");
  await page.locator("#caseConflict").selectOption(expected.conflict);
  await page.locator("#caseSource").selectOption(expected.source);
  await page.locator("#caseRationale").fill("Vou prosseguir apesar de os fatos mostrarem uma atividade destinada a terceiros e fora da função aprovada.");
  await page.locator("#caseForm button[type=submit]").click();

  await expect(page.locator("#caseScore")).toHaveText("49");
  await expect(page.locator("#hardViolation")).toBeVisible();
  await expect(page.locator("#hardViolation")).toContainText("VIOLAÇÃO DURA");
  await expect(page.locator("#kpiViolations")).toHaveText("1");
});
