const { test, expect } = require("@playwright/test");
const { createHash } = require("node:crypto");

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

test("calcula SHA-256 dos bytes originais incluindo BOM", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto("/dados.html");
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(csv)]);
  await page.locator("#datasetFile").setInputFiles({ name: "com-bom.csv", mimeType: "text/csv", buffer: bytes });
  const expected = createHash("sha256").update(bytes).digest("hex");
  await expect(page.locator("#fileDigest")).toHaveText(expected);
  await expect(page.locator("#kpiFileState")).toHaveText("VALIDADO");
});

test("mantém somente a seleção de arquivo mais recente", async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(() => {
    const original = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      if (this.name === "lento.csv") await new Promise(resolve => setTimeout(resolve, 150));
      return original.call(this);
    };
  });
  await page.goto("/dados.html");
  const slow = csv.replaceAll("2026-08-01", "2026-07-01");
  const recent = csv.replaceAll("2026-08-01", "2026-09-01");
  await page.locator("#datasetFile").setInputFiles({ name: "lento.csv", mimeType: "text/csv", buffer: Buffer.from(slow) });
  await page.locator("#datasetFile").setInputFiles({ name: "recente.csv", mimeType: "text/csv", buffer: Buffer.from(recent) });
  await expect(page.locator("#filePeriod")).toContainText("2026-09-01T10:00:00.000Z");
  await page.waitForTimeout(200);
  await expect(page.locator("#filePeriod")).toContainText("2026-09-01T10:00:00.000Z");
  await expect(page.locator("#previewBody")).not.toContainText("2026-07-01");
});
