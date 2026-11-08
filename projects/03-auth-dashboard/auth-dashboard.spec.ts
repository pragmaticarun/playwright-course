import { expect, test } from "@playwright/test";

test("a fresh context is locked out of signing notes @cross", async ({ page }) => {
  const response = await page.goto("/maintainer");
  expect(response?.status()).toBe(403);
  await expect(page.getByRole("link", { name: "Go to maintainer login" })).toBeVisible();
});

test.describe("maintainer storage state", () => {
  test.use({ storageState: "playwright/.auth/maintainer.json" });

  test("the setup project cookie opens the notes @cross", async ({ page }) => {
    await page.goto("/maintainer");
    await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
    await expect(page.getByText("signed in as maintainer")).toBeVisible();
  });
});
