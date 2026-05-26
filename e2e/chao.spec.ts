import { test, expect } from "@playwright/test";

const SSE_DONE =
  'data: {"type":"meta","remaining":2,"isLoggedIn":false}\n\n' +
  'data: {"type":"delta","text":"Salut mon petit !"}\n\n' +
  'data: {"type":"done"}\n\n';

test.describe("Chao widget", () => {
  for (const path of ["/", "/bourses", "/connexion"]) {
    test(`launcher visible on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("button", { name: "Discuter avec Chao" })
      ).toBeVisible();
    });
  }

  test("opens panel with welcome message", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Discuter avec Chao" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chao" })).toBeVisible();
    await expect(page.getByText(/Je suis Chao/i)).toBeVisible();
  });

  test("anonymous user hits sign-up gate after 3 messages", async ({ page }) => {
    let calls = 0;

    await page.route("**/api/chat", async (route) => {
      calls += 1;
      if (calls <= 3) {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
          body: SSE_DONE.replace('"remaining":2', `"remaining":${3 - calls}`),
        });
        return;
      }
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ gated: true, remaining: 0, reason: "signup" }),
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Discuter avec Chao" }).click();

    const input = page.getByRole("textbox", { name: "Message pour Chao" });

    for (let i = 1; i <= 4; i++) {
      await input.fill(`Question test ${i}`);
      await page.getByRole("button", { name: "Envoyer" }).click();
      if (i <= 3) {
        await expect(page.getByText(/Salut mon petit/i).first()).toBeVisible({
          timeout: 10_000,
        });
      }
    }

    await expect(page.getByText(/messages gratuits/i)).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Créer mon compte", exact: true })
    ).toHaveAttribute("href", "/inscription");
  });
});
