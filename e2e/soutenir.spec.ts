import { test, expect } from "@playwright/test";

test.describe("Soutenir / donations", () => {
  test("home donate band links to /soutenir", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Nous soutenir" }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/soutenir/);
    await expect(
      page.getByRole("heading", {
        name: /Aide-nous à garder Mibegnon gratuit/i,
      })
    ).toBeVisible();
  });

  test("nav includes Nous soutenir", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Nous soutenir" })
    ).toBeVisible();
  });

  test("soutenir page shows form, progress and FAQ", async ({ page }) => {
    await page.route("**/api/donations/stats", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          monthlyGoalCents: 50000,
          monthlyRaisedCents: 12000,
          monthlySupporterCount: 3,
          totalSupporterCount: 12,
          recentSupporters: [
            {
              displayName: "Awa",
              amountCents: 1000,
              kind: "ONE_TIME",
              publicMessage: null,
              succeededAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto("/soutenir");
    await expect(page.getByText(/Objectif du mois/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Une fois/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Chaque mois/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Faire un don/i })).toBeVisible();
    await expect(page.getByText(/Où va mon argent/i)).toBeVisible();
    await expect(page.getByText("Awa")).toBeVisible();
  });

  test("merci page loads", async ({ page }) => {
    await page.goto("/soutenir/merci");
    await expect(page.getByRole("heading", { name: /Merci mon petit/i })).toBeVisible();
  });

  test("annule page loads", async ({ page }) => {
    await page.goto("/soutenir/annule");
    await expect(page.getByRole("heading", { name: /Paiement annulé/i })).toBeVisible();
  });
});
