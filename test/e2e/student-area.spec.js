const { test, expect } = require("@playwright/test");

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Fluxo completo coberto uma vez no Chromium desktop.");
});

test("salva perfil, presença e plano semanal somente no navegador", async ({ page }) => {
  await page.goto("/alunos.html");
  await expect(page.locator("#kpiModules")).toHaveText("0/12");
  await page.locator("#studentName").fill("Danilo Alves");
  await page.locator("#studentGoal").selectOption("Gestão de risco");
  await page.locator("#studentWeeklyHours").fill("7");
  await page.locator("#studentProfileForm button[type=submit]").click();
  await expect(page.locator("#studentGreeting")).toHaveText("Bom estudo, Danilo Alves.");
  await expect(page.locator("#profileFeedback")).toContainText("somente neste navegador");
  await page.locator("#markAttendance").click();
  await expect(page.locator("#kpiAttendance")).toHaveText("1");
  await expect(page.locator("#kpiStreak")).toHaveText("1 dia");
  await page.locator('[data-task="foundation"]').check();
  await expect(page.locator("#kpiWeek")).toHaveText("1/6");
  await page.reload();
  await expect(page.locator("#studentGreeting")).toHaveText("Bom estudo, Danilo Alves.");
  await expect(page.locator('[data-task="foundation"]')).toBeChecked();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("suzy-student-area-v1")));
  expect(stored.profile).toEqual({ name: "Danilo Alves", goal: "Gestão de risco", weeklyHours: 7, startDate: expect.any(String) });
  expect(stored.profile.email).toBeUndefined();
});

test("reflete evidências existentes e indica a próxima etapa", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("suzy-academia-nivel1-v1", JSON.stringify({ completed: ["mentalidade", "mercados", "candles", "risco", "playbook", "validacao"], passed: true, bestScore: 85 }));
    localStorage.setItem("suzy-academia-nivel2-v1", JSON.stringify({ completed: [], passed: false, bestScore: 0 }));
  });
  await page.goto("/alunos.html");
  await expect(page.locator("#studentModules")).toContainText("CONCLUÍDO");
  await expect(page.locator("#nextStudentAction")).toContainText("ACADEMIA NÍVEL 2 APROVADA");
});
