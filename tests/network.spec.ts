import { test, expect } from "@playwright/test";

test("a route fulfills a down mirror", async ({ page }) => {
  await page.route("**/api/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ service: "bench", ok: false, message: "mirror down" }),
    }),
  );
  await page.goto("/status");
  await expect(page.getByRole("status")).toHaveText("mirror down");
});

test("the unmocked status is bench ok @cross", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("status")).toHaveText("bench ok");
});
