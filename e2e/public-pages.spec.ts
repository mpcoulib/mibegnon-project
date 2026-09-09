import { test, expect } from "@playwright/test";

// Public routes should render without a server error and show a heading.
const ROUTES = [
  "/",
  "/bourses",
  "/universites",
  "/accompagnement",
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

test("accompagnement interest form keeps email optional", async ({ page }) => {
  await page.goto("/accompagnement#inscription");
  await expect(page.getByRole("heading", { name: "Inscription" })).toBeVisible();
  const email = page.getByRole("textbox", { name: "Email (optionnel)" });
  await expect(email).toBeAttached();
  await expect(email).not.toHaveAttribute("required");
});

test("accompagnement form page has admin login", async ({ page }) => {
  await page.goto("/accompagnement#inscription");
  const admin = page.getByRole("link", { name: "Connexion admin" });
  await expect(admin).toBeVisible();
  await expect(admin).toHaveAttribute("href", /\/connexion\?next=\/admin\/accompagnement/);
});
