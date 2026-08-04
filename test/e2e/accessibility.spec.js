const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const publicPages = [
  "/index.html",
  "/academia.html",
  "/academia-nivel2.html",
  "/replay.html",
  "/simulador.html",
  "/diario.html",
  "/psicologia.html",
  "/calendario.html",
  "/login.html"
];

function formatViolations(violations) {
  return violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    nodes: violation.nodes.map(node => ({
      target: node.target,
      failureSummary: node.failureSummary
    }))
  }));
}

test.describe("acessibilidade automatizada", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "A auditoria axe é executada uma vez no Chromium desktop; os demais projetos validam compatibilidade de navegador."
    );
  });

  for (const path of publicPages) {
    test(`${path} não possui violações críticas ou sérias de WCAG`, async ({ page }) => {
      await page.goto(path);
      await page.locator("body").waitFor({ state: "visible" });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blockingViolations = results.violations.filter(violation =>
        ["critical", "serious"].includes(violation.impact)
      );

      expect(formatViolations(blockingViolations)).toEqual([]);
    });
  }

  test("a navegação principal do Command Center funciona por teclado", async ({ page }) => {
    await page.goto("/index.html");
    await page.keyboard.press("Tab");

    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(["BUTTON", "A", "INPUT", "SELECT"]).toContain(firstFocusedElement);

    await page.locator('button[data-view="operations"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#operationsView")).toBeVisible();
  });
});