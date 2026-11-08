import { expect, test } from "@playwright/test";

test("poster matches the committed Linux Chromium baseline", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "The committed baseline is Linux Chromium.");
  await page.goto("/visual");
  await expect(page.locator(".poster")).toHaveScreenshot("bench-poster.png", {
    animations: "disabled",
    caret: "hide",
  });
});
