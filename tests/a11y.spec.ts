import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the accessible bench has no WCAG A or AA violations @cross", async ({ page }) => {
  await page.goto("/a11y");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("the broken scan reports button-name and image-alt", async ({ page }) => {
  await page.goto("/a11y/broken");
  const results = await new AxeBuilder({ page }).analyze();
  const ids = results.violations.map((violation) => violation.id);
  expect(ids).toContain("button-name");
  expect(ids).toContain("image-alt");
});
