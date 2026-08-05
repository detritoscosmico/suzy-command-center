const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo coberto uma vez no Chromium desktop.");
}

test("inicia o passaporte profissional sem fabricar evidências", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/programa.html");

  await expect(page.locator("#completedStages")).toHaveText("0/5");
  await expect(page.locator("#nextEvidence")).toHaveText("Academia Nível 1 aprovada");
  await expect(page.locator(".stage-card.completed")).toHaveCount(0);
});

test("conclui os gates somente depois de evidência e playbook válido", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(() => {
    localStorage.setItem("suzy-academia-nivel1-v1", JSON.stringify({
      completed: ["a1", "a2", "a3", "a4", "a5", "a6"],
      passed: true,
      bestScore: 80
    }));
    localStorage.setItem("suzy-academia-nivel2-v1", JSON.stringify({
      completed: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"],
      passed: true,
      bestScore: 83
    }));
    localStorage.setItem("suzy-replay-lab-v2", JSON.stringify({
      trades: Array.from({ length: 20 }, (_, index) => ({
        id: `replay-${index}`,
        status: "CLOSED",
        result: index % 2 ? "LOSS" : "WIN",
        rMultiple: index % 2 ? -1 : 1
      }))
    }));
    localStorage.setItem("suzy-order-simulator-v1", JSON.stringify({
      trades: Array.from({ length: 10 }, (_, index) => ({ id: `sim-${index}`, status: "CLOSED" }))
    }));
    localStorage.setItem("suzy-professional-journal-v1", JSON.stringify(
      Array.from({ length: 20 }, (_, index) => ({
        id: `journal-${index}`,
        timestamp: new Date(Date.UTC(2026, 6, 1, 10, index)).toISOString(),
        asset: "EUR/USD",
        market: "Forex",
        session: "Londres",
        timeframe: "M5",
        direction: "LONG",
        setup: "Pullback",
        rMultiple: index % 2 ? -1 : 1,
        followedPlan: index < 17,
        quality: index < 4 ? 5 : 4,
        emotionBefore: "Calmo",
        emotionAfter: "Neutro",
        errorType: "Nenhum",
        context: "Estrutura definida",
        lesson: "Repetir o processo",
        createdAt: new Date(Date.UTC(2026, 6, 1, 10, index)).toISOString()
      }))
    ));
    localStorage.setItem("suzy_psychology_v1", JSON.stringify({
      version: 1,
      lessonProgress: ["p1", "p2", "p3", "p4", "p5"],
      assessments: [{
        id: "assessment-1",
        createdAt: "2026-07-01T10:00:00.000Z",
        overall: 30,
        scores: { impulse: 30 }
      }],
      checkIns: Array.from({ length: 7 }, (_, index) => ({
        id: `checkin-${index}`,
        date: `2026-07-${String(index + 1).padStart(2, "0")}`,
        createdAt: `2026-07-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
        score: 16.7,
        inputs: {
          sleepQuality: 5,
          emotionalActivation: 1,
          recoveryUrge: 1,
          planClarity: 5,
          acceptsStop: true,
          recentRuleBreak: false
        }
      }))
    }));
  });

  await page.goto("/programa.html");
  await expect(page.locator("#completedStages")).toHaveText("4/5");

  await page.locator("#planMarket").fill("Forex — EUR/USD");
  await page.locator("#planSetup").fill("Pullback a favor da estrutura");
  await page.locator("#planContext").fill("Tendência definida, zona válida e ausência de evento bloqueador");
  await page.locator("#planTrigger").fill("Fechamento além da máxima do candle de rejeição");
  await page.locator("#planInvalidation").fill("Perda do fundo que sustenta a hipótese");
  await page.locator("#planRisk").fill("0.5");
  await page.locator("#planDailyStop").fill("2");
  await page.locator("#planMaxTrades").fill("3");
  await page.locator("#planReview").fill("Revisar aderência, execução, custos e capturas depois da sessão");
  await page.locator("#planUncertainty").check();
  await page.locator("#playbookForm button[type=submit]").click();

  await expect(page.locator("#completedStages")).toHaveText("5/5");
  await expect(page.locator("#programPercent")).toHaveText("100%");
  await expect(page.locator("#playbookFeedback")).toContainText("Plano salvo e validado");
  await expect(page.locator(".stage-card.completed")).toHaveCount(5);
});
