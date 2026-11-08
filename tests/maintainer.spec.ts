import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/maintainer.json" });

test("storage state opens signing notes", async ({ page }) => {
  await page.goto("/maintainer");
  await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
  await expect(page.getByText("rotate the local bench key")).toBeVisible();
});
