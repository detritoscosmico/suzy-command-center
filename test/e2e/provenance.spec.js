const { test, expect } = require("@playwright/test");

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo coberto uma vez no Chromium desktop.");
}

const csv = "timestamp,open,high,low,close\n2026-08-01T10:00:00Z,100,102,99,101\n2026-08-01T10:05:00Z,101,103,100,102\n";

async function selectCsv(page, content = csv) {
  await page.locator("#datasetFile").setInputFiles({ name: "estudo.csv", mimeType: "text/csv", buffer: Buffer.from(content) });
  await expect(page.locator("#kpiFileState")).toHaveText("VALIDADO");
}

async function fillAuthorizedMetadata(page) {
  await page.locator("#datasetName").fill("EURUSD M5 agosto");
  await page.locator("#sourceName").fill("Fonte de teste licenciada");
  await page.locator("#sourceLicense").fill("Uso educacional autorizado");
  await page.locator("#sourceInstrument").fill("EUR/USD");
  await page.locator("#sourceTimeframe").fill("M5");
  await page.locator("#authorizationConfirmed").check();
}

test("cria manifesto autorizado sem armazenar o CSV bruto", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/dados.html");
  await selectCsv(page);
  await fillAuthorizedMetadata(page);
  await page.locator("#datasetForm button[type=submit]").click();

  await expect(page.locator("#kpiDatasets")).toHaveText("1");
  await expect(page.locator("#registryBody")).toContainText("DADO AUTORIZADO — ARQUIVO LOCAL");
  await expect(page.locator("#fileDigest")).toHaveText(/^[a-f0-9]{64}$/);
  const stored = await page.evaluate(() => localStorage.getItem("suzy-data-provenance-v1"));
  expect(stored).not.toContain("2026-08-01T10:00:00Z,100,102,99,101");
});

test("dataset artificial recebe etiqueta permanente sem exigir licença", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/dados.html");
  await selectCsv(page);
  await page.locator("#sourceType").selectOption("ARTIFICIAL");
  await page.locator("#datasetName").fill("Cenário sintético de treinamento");
  await page.locator("#sourceName").fill("Gerador interno Suzy");
  await page.locator("#sourceInstrument").fill("DEMO/USD");
  await page.locator("#sourceTimeframe").fill("M5");
  await page.locator("#datasetForm button[type=submit]").click();

  await expect(page.locator("#registryBody")).toContainText("DADO ARTIFICIAL — ETIQUETA PERMANENTE");
  await expect(page.locator("#kpiArtificial")).toHaveText("1");
});

test("revalidação detecta arquivo alterado pelo SHA-256", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/dados.html");
  await selectCsv(page);
  await fillAuthorizedMetadata(page);
  await page.locator("#datasetForm button[type=submit]").click();

  const changed = csv.replace("101,103,100,102", "101,104,100,103");
  await selectCsv(page, changed);
  await page.locator("#verifyFile").click();
  await expect(page.locator("#verifyStatus")).toHaveText("MISMATCH");
  await expect(page.locator("#datasetFeedback")).toContainText("SHA-256 não corresponde");
});
