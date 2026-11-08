import { test, expect } from "@playwright/test";

test("shelf state stays inside one context @cross", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add adb to shelf" }).click();
  await expect(page.getByRole("status")).toHaveText("Added adb to the shelf");

  const other = await browser.newContext();
  const fresh = await other.newPage();
  await fresh.goto("/shelf");
  await expect(fresh.getByText("The shelf is empty.")).toBeVisible();
  await other.close();

  await page.goto("/shelf");
  await expect(page.getByRole("cell", { name: "adb" })).toBeVisible();
});

test("notes stay locked without the fixture cookie @cross", async ({ page }) => {
  const response = await page.goto("/maintainer");
  expect(response?.status()).toBe(403);
  await expect(page.getByRole("heading", { name: "Notes are locked" })).toBeVisible();
});
