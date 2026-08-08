const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo coberto uma vez no Chromium desktop.");
}

const validPlan = {
  market: "Forex — EUR/USD",
  setup: "Pullback a favor da estrutura",
  context: "Tendência definida e ausência de evento bloqueador",
  trigger: "Fechamento confirma retomada além da máxima de referência",
  invalidation: "Perda do fundo estrutural que sustenta a hipótese",
  riskPerTradePct: 0.5,
  dailyStopR: 2,
  maxTrades: 3,
  reviewRoutine: "Revisar aderência, execução e erros depois da sessão",
  acceptsUncertainty: true
};

async function seedPlan(page) {
  await page.goto("/governanca.html");
  await page.evaluate(plan => localStorage.setItem("suzy-professional-program-v1", JSON.stringify({ version: 1, plan })), validPlan);
  await page.reload();
}

async function createBaseline(page) {
  await page.locator("#changeReason").fill("Criar linha de base formal antes de qualquer alteração futura.");
  await page.locator("#versionForm button[type=submit]").click();
  await expect(page.locator("#kpiVersion")).toHaveText("v1");
}

test("cria linha de base e segunda versão somente com motivo", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await seedPlan(page);
  await createBaseline(page);
  await expect(page.locator("#kpiPlanState")).toHaveText("AUDITADO");

  await page.locator("#govRisk").fill("0.4");
  await expect(page.locator("#kpiPlanState")).toHaveText("MUDANÇA PENDENTE");
  await page.locator("#changeReason").fill("Reduzir o teto de risco após revisão formal da disciplina do processo.");
  await page.locator("#versionForm button[type=submit]").click();

  await expect(page.locator("#kpiVersion")).toHaveText("v2");
  await expect(page.locator("#kpiRevisions")).toHaveText("2");
  await page.locator("#compareVersions").click();
  await expect(page.locator("#versionDiff")).toContainText("Risco por operação (%)");
  await expect(page.locator("#versionDiff")).toContainText("DEPOIS: 0.4");
});

test("recusa justificativa curta e não cria versão", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await seedPlan(page);
  await page.locator("#changeReason").fill("curto");
  await page.locator("#versionForm button[type=submit]").click();

  await expect(page.locator("#versionFeedback")).toContainText("pelo menos 20 caracteres");
  await expect(page.locator("#kpiRevisions")).toHaveText("0");
});

test("revisão periódica mostra processo e não exibe P/L", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/governanca.html");
  await page.evaluate(() => localStorage.setItem("suzy-professional-journal-v1", JSON.stringify([
    { timestamp: "2026-08-01T10:00:00Z", asset: "EUR/USD", setup: "Pullback", followedPlan: true, quality: 5, errorType: "Nenhum", market: "Forex", session: "Londres", rMultiple: 10 },
    { timestamp: "2026-08-02T10:00:00Z", asset: "EUR/USD", setup: "Pullback", followedPlan: false, quality: 3, errorType: "FOMO", market: "Forex", session: "Londres", rMultiple: -10 }
  ])));
  await page.reload();
  await page.locator("#periodAFrom").fill("2026-08-01");
  await page.locator("#periodATo").fill("2026-08-31");
  await page.locator("#periodBFrom").fill("2026-08-01");
  await page.locator("#periodBTo").fill("2026-08-31");
  await page.locator("#reviewPeriods").click();

  await expect(page.locator("#periodAResult")).toContainText("50%");
  await expect(page.locator("#periodAResult")).toContainText("FOMO (1)");
  await expect(page.locator("#periodComparison")).toContainText("não provam causalidade");
  await expect(page.locator("#reviewLab")).not.toContainText("P/L 10");
});
