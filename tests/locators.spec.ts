import { test, expect } from "@playwright/test";

test("role locators filter the catalog @cross", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Workshop Bench" })).toBeVisible();
  await expect(page.getByRole("link", { name: "adb" })).toBeVisible();

  await page.getByRole("button", { name: "Rust", exact: true }).click();

  await expect(page.getByRole("link", { name: "rustc" })).toBeVisible();
  await expect(page.getByRole("link", { name: "cargo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "adb" })).toBeHidden();
  await expect(page.getByRole("link", { name: "CMake" })).toBeHidden();
});

test("a named link points at the package page @cross", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "CMake" })).toHaveAttribute("href", "/pkg/cmake");
  await page.getByRole("link", { name: "CMake" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "CMake" })).toBeVisible();
});
