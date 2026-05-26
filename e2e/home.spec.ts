import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("loads and shows primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Explorer les bourses/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Voir les universités/i })
    ).toBeVisible();
  });

  test("CTA navigates to bourses listing", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Explorer les bourses/i }).first().click();
    // App Router soft-nav: URL updates only after the /bourses RSC round-trip.
    // In dev the route compiles on demand (Turbopack) + runs a DB query, which
    // can exceed the 5s default — give navigation room and assert it rendered.
    await expect(page).toHaveURL(/\/bourses/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
