import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CatalogPage, CheckoutPage, NotesPage, ShelfPage } from "./pages";

test("order rustc from an empty shelf @cross", async ({ page }) => {
  const catalog = new CatalogPage(page);
  const shelf = new ShelfPage(page);
  const checkout = new CheckoutPage(page);

  await catalog.open();
  await expect(catalog.heading).toBeVisible();
  await catalog.filter("Rust");
  await expect(page.getByRole("link", { name: "adb" })).toBeHidden();
  await catalog.add("rustc");

  await shelf.open();
  await expect(page.getByRole("cell", { name: "rustc" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "bench-2026.11" })).toBeVisible();

  await checkout.open();
  await expect(page.getByText("rustc × 1")).toBeVisible();
  await checkout.place("Arun", "arun@example.com", "lab order");

  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText("BN-ARUN")).toBeVisible();
  await expect(page.locator("#ordered-items")).toHaveText("rustc:1");
  await expect(page.getByText("lab order")).toBeVisible();
});

test("catalog scan stays inside WCAG A and AA", async ({ page }) => {
  const catalog = new CatalogPage(page);
  await catalog.open();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test.describe("already authenticated", () => {
  test.use({ storageState: "playwright/.auth/maintainer.json" });

  test("storage state is enough for the notes page", async ({ page }) => {
    const notes = new NotesPage(page);
    await notes.open();
    await expect(page.getByText("signed in as maintainer")).toBeVisible();
  });
});
