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

  await page.getByLabel("Nom complet").fill("Test E2E");
  await page.getByLabel("Date de naissance").fill("2006-06-15");
  await page.getByLabel("Genre").selectOption("NON_PRECISE");
  await page.getByLabel("Ville / commune").fill("Cocody");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page.getByText("Étape 2 sur 3")).toBeVisible();
  await expect(page.getByText("+225").first()).toBeVisible();
  const email = page.getByRole("textbox", { name: "Email (optionnel)" });
  await expect(email).toBeVisible();
  await expect(email).not.toHaveAttribute("required");
});

test("accompagnement form step gates block incomplete steps", async ({ page }) => {
  const formAlert = page.locator("form p[role='alert']");
  await page.goto("/accompagnement#inscription");
  await expect(page.getByText("Étape 1 sur 3")).toBeVisible();

  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(formAlert).toHaveText("Indique ton nom complet.");

  await page.getByLabel("Nom complet").fill("Test Gates");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(formAlert).toHaveText("Indique ta date de naissance.");

  await page.getByLabel("Date de naissance").fill("2010-01-15");
  await expect(page.getByText(/moins de 18 ans/)).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(formAlert).toHaveText("Choisis un genre.");

  await page.getByLabel("Genre").selectOption("NON_PRECISE");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(formAlert).toHaveText("Indique ta ville ou commune.");

  await page.getByLabel("Ville / commune").fill("Cocody");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Étape 2 sur 3")).toBeVisible();

  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(formAlert).toHaveText("Numéro WhatsApp à 10 chiffres, s'il te plaît.");

  await page.getByLabel("WhatsApp", { exact: true }).fill("0701");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(formAlert).toHaveText("Numéro WhatsApp à 10 chiffres, s'il te plaît.");

  await page.getByLabel("WhatsApp", { exact: true }).fill("0701020399");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Étape 3 sur 3")).toBeVisible();

  await page.getByRole("button", { name: "Rejoindre le parcours" }).click();
  await expect(formAlert).toHaveText("Indique ton établissement.");

  await page.getByLabel("Établissement").fill("Lycée Test Gates");
  await page.getByRole("button", { name: "Rejoindre le parcours" }).click();
  await expect(formAlert).toHaveText("Il faut accepter d'être contacté(e) sur WhatsApp.");
});

test("accompagnement form page has admin login", async ({ page }) => {
  await page.goto("/accompagnement#inscription");
  const admin = page.getByRole("link", { name: "Connexion admin" });
  await expect(admin).toBeVisible();
  await expect(admin).toHaveAttribute("href", /\/connexion\?next=\/admin\/accompagnement/);
});
