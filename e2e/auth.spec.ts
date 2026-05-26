import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("connexion page shows login form", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("dashboard redirects unauthenticated user to connexion", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/connexion/);
  });
});
