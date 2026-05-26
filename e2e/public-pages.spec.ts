import { test, expect } from "@playwright/test";

// Public routes should render without a server error and show a heading.
const ROUTES = [
  "/",
  "/bourses",
  "/universites",
  "/soumettre",
  "/a-propos",
  "/contact",
  "/cgu",
  "/confidentialite",
];

for (const route of ROUTES) {
  test(`public page renders: ${route}`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status(), `status for ${route}`).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });
}
