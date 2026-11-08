import { expect, test } from "@playwright/test";

test("count visible cards after a toolchain filter @cross", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-card]")).toHaveCount(6);
  await page.getByRole("button", { name: "Android", exact: true }).click();
  await expect(page.locator("[data-card]:not([hidden])")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "adb" })).toBeVisible();
  await expect(page.getByRole("link", { name: "scrcpy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "cargo" })).toBeHidden();
});
