const { test, expect } = require("@playwright/test");

const publicPages = [
  { path: "/index.html", heading: "Painel de Ativos" },
  { path: "/academia.html", heading: "Academia Suzy — Fundamentos" },
  { path: "/academia-nivel2.html", heading: "Análise técnica com contexto" },
  { path: "/replay.html", heading: "Laboratório de Replay — Nível 1" },
  { path: "/simulador.html", heading: "Simulador de Ordens e Custos" },
  { path: "/diario.html", heading: "Diário Profissional do Trader" },
  { path: "/calendario.html", heading: "Calendário Econômico Educacional" },
  { path: "/login.html", heading: "Conta local protegida" }
];

for (const publicPage of publicPages) {
  test(`carrega ${publicPage.path} sem erro de execução`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    const response = await page.goto(publicPage.path);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: publicPage.heading, exact: true })).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name.includes("mobile"), "Fluxo funcional coberto no projeto desktop; o projeto móvel valida carregamento e responsividade.");
}

test("mantém o diário funcional sem backend no modo estático", async ({ page }) => {
  await page.goto("/diario.html");
  await expect(page.locator("#syncStatus")).toHaveText("Somente neste navegador");
  await expect(page.locator("#syncToServer")).toBeDisabled();
  await expect(page.locator("#restoreFromServer")).toBeDisabled();
});

test("carrega cenário artificial no calendário", async ({ page }) => {
  await page.goto("/calendario.html");
  await page.locator("#loadDemo").click();
  await expect(page.locator("#calendarMode")).toHaveText("EXEMPLO ARTIFICIAL");
  await expect(page.locator("#summaryTotal")).toHaveText("3");
  await expect(page.locator("#calendarBody tr")).toHaveCount(3);
  await expect(page.locator("#importFeedback")).toContainText("não representam divulgações reais");
});

test("registra uma operação demo no Command Center", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/index.html");

  await page.locator('button[data-view="operations"]').click();
  await expect(page.locator("#operationsView")).toBeVisible();
  await page.locator("#tradeAmount").fill("100");
  await page.locator("#tradeReason").fill("Teste automatizado de disciplina operacional");
  await page.locator("#registerWin").click();

  await expect(page.locator("#opsCard")).toContainText("1 / 5");
  await expect(page.locator("#tradeFeedback")).not.toBeEmpty();
});

test("conclui a primeira aula e libera a segunda", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/academia.html");

  await page.locator('input[name="lessonAnswer"][value="1"]').check();
  await page.locator("#completeLesson").click();

  await expect(page.locator('[data-lesson="mentalidade"]')).toHaveClass(/completed/);
  await expect(page.locator('[data-lesson="mercados"]')).toBeEnabled();
  await expect(page.locator("#completedLessons")).toHaveText("1/6");
});

test("avança o replay sem revelar toda a série e abre posição", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/replay.html");

  await expect(page.locator("#replayProgress")).toHaveText("30/120");
  await page.locator("#advanceCandle").click();
  await expect(page.locator("#replayProgress")).toHaveText("31/120");
  await page.locator("#tradeNote").fill("Pullback com risco previamente definido");
  await page.locator("#openLong").click();

  await expect(page.locator("#positionDetails")).toBeVisible();
  await expect(page.locator("#positionDirection")).toHaveText("COMPRADO");
  await expect(page.locator("#advanceCandle")).toBeEnabled();
});

test("executa uma ordem a mercado no simulador", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/simulador.html");

  await page.locator("#orderNote").fill("Ordem de teste com custos explícitos");
  await page.locator("#submitOrder").click();

  await expect(page.locator("#positionDetails")).toBeVisible();
  await expect(page.locator("#positionDirection")).toHaveText("COMPRADO");
  await expect(page.locator("#closeMarket")).toBeEnabled();
  await expect(page.locator("#orderFeedback")).not.toBeEmpty();
});

test("salva registro no diário e atualiza as estatísticas", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/diario.html");

  await page.locator("#entryTimestamp").fill("2026-08-02T10:00");
  await page.locator("#entryAsset").fill("EUR/USD");
  await page.locator("#entrySetup").fill("Pullback na tendência");
  await page.locator("#entryR").fill("2");
  await page.locator("#entryContext").fill("Estrutura alinhada, região definida e risco controlado.");
  await page.locator("#entryLesson").fill("Repetir o processo somente com todos os critérios presentes.");
  await page.locator("#journalForm button[type=submit]").click();

  await expect(page.locator("#kpiTotal")).toHaveText("1");
  await expect(page.locator("#kpiTotalR")).toContainText("2.00R");
  await expect(page.locator("#historyBody")).toContainText("EUR/USD");
  await expect(page.locator("#formFeedback")).not.toBeEmpty();
});

test("edita registro, preserva versão e permite restaurar da lixeira", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/diario.html");

  await page.locator("#entryTimestamp").fill("2026-08-02T11:00");
  await page.locator("#entryAsset").fill("BTC/USDT");
  await page.locator("#entrySetup").fill("Rompimento inicial");
  await page.locator("#entryR").fill("1");
  await page.locator("#submitEntryButton").click();

  await page.locator("#historyBody [data-edit]").click();
  await expect(page.locator("#formMode")).toHaveText("EDITANDO REGISTRO");
  await page.locator("#entrySetup").fill("Rompimento confirmado");
  await page.locator("#entryR").fill("1.5");
  await page.locator("#submitEntryButton").click();

  await expect(page.locator("#versionCount")).toHaveText("1");
  await expect(page.locator("#versionBody")).toContainText("Antes da edição");
  await expect(page.locator("#versionBody")).toContainText("Rompimento inicial");

  page.on("dialog", dialog => dialog.accept());
  await page.locator("#historyBody [data-delete]").click();
  await expect(page.locator("#kpiTotal")).toHaveText("0");
  await expect(page.locator("#trashCount")).toHaveText("1");

  await page.locator("#trashBody [data-restore-trash]").click();
  await expect(page.locator("#kpiTotal")).toHaveText("1");
  await expect(page.locator("#trashCount")).toHaveText("0");
  await expect(page.locator("#historyBody")).toContainText("Rompimento confirmado");
});
