import { expect, test } from "@playwright/test";

test("nightly android preferences survive a submit @cross", async ({ page }) => {
  await page.goto("/forms");
  await page.getByLabel("Display name").fill("Arunkumar");
  await page.getByLabel("Channel").selectOption("nightly");
  await page.getByRole("radio", { name: "Android" }).check();
  await page.getByLabel("Notes").fill("adb over usb");
  await page.getByRole("button", { name: "Save preferences" }).click();

  await expect(page.locator("dd").nth(0)).toHaveText("Arunkumar");
  await expect(page.locator("dd").nth(1)).toHaveText("nightly");
  await expect(page.locator("dd").nth(2)).toHaveText("android");
  await expect(page.locator("dd").nth(3)).toHaveText("no");
  await expect(page.locator("dd").nth(4)).toHaveText("adb over usb");
});

test("empty shelf cannot place an order @cross", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByText("The shelf is empty. Add a tool before placing an order.")).toBeVisible();
  await page.getByLabel("Your name").fill("Arun");
  await page.getByLabel("Email").fill("arun@example.com");
  await page.getByRole("checkbox", { name: "I am testing this local bench" }).check();
  await page.getByRole("button", { name: "Place bench order" }).click();
  await expect(page.getByRole("heading", { name: "Order needs a fix" })).toBeVisible();
  await expect(page.getByText("The shelf is empty.")).toBeVisible();
});
