import { test, expect } from "@playwright/test";

test("preferences round-trip through labels @cross", async ({ page }) => {
  await page.goto("/forms");
  await page.getByLabel("Display name").fill("Arun");
  await page.getByLabel("Channel").selectOption("beta");
  await page.getByRole("radio", { name: "Rust" }).check();
  await page.getByRole("checkbox", { name: "Email the build log" }).check();
  await page.getByLabel("Notes").fill("nightly only on the lab machine");
  await page.getByRole("button", { name: "Save preferences" }).click();

  await expect(page.getByRole("heading", { name: "Preferences saved" })).toBeVisible();
  await expect(page.locator("dd").nth(0)).toHaveText("Arun");
  await expect(page.locator("dd").nth(1)).toHaveText("beta");
  await expect(page.locator("dd").nth(2)).toHaveText("rust");
  await expect(page.locator("dd").nth(3)).toHaveText("yes");
  await expect(page.locator("dd").nth(4)).toHaveText("nightly only on the lab machine");
});

test("html in a name is escaped @cross", async ({ page }) => {
  await page.goto("/forms");
  await page.getByLabel("Display name").fill("<script>alert(1)</script>");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("heading", { name: "Preferences saved" })).toBeVisible();
  await expect(page.locator("script")).toHaveCount(0);
  await expect(page.locator("dd").nth(0)).toHaveText("<script>alert(1)</script>");
});
