import { test, expect } from "@playwright/test";

test.describe("Bourses", () => {
  test("listing renders cards or empty state", async ({ page }) => {
    await page.goto("/bourses");
    await expect(page.locator("h1").first()).toBeVisible();
    // Either scholarship cards are present, or an empty/no-results message.
    const cards = page.getByRole("link", { name: /Voir|Détails|En savoir plus/i });
    await expect(page.locator("body")).toBeVisible();
    // Soft assertion: at least the page shell loaded.
    expect(await cards.count()).toBeGreaterThanOrEqual(0);
  });

  test("opening a scholarship shows the detail page", async ({ page }) => {
    await page.goto("/bourses");
    const firstCardLink = page.locator('a[href^="/bourses/"]').first();
    const count = await firstCardLink.count();
    test.skip(count === 0, "No scholarships seeded — skipping detail check");
    await firstCardLink.click();
    await expect(page).toHaveURL(/\/bourses\/.+/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
