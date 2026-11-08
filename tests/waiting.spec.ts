import { test, expect } from "@playwright/test";

test("delayed text becomes shelf ready @cross", async ({ page }) => {
  await page.goto("/delayed");
  await expect(page.getByText("Loading the shelf")).toBeVisible();
  await expect(page.getByText("Shelf ready")).toBeVisible();
});

test("an inert control accepts a click only after the panel opens", async ({ page }) => {
  await page.goto("/inert");
  const save = page.locator("#save-pin");
  await expect(save).toBeVisible();
  await expect(save.click({ trial: true, timeout: 1_000 })).rejects.toThrow();
  await page.getByRole("button", { name: "Open panel" }).click();
  await expect(page.locator("#panel-state")).toHaveText("Panel open");
  await save.click();
  await expect(page.locator("#panel-state")).toHaveText("Pin saved");
});
