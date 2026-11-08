import { test, expect } from "@playwright/test";

test("frame button is not the parent button @cross", async ({ page }) => {
  await page.goto("/frames");
  const notes = page.frameLocator('iframe[title="Release notes"]');
  await notes.getByRole("button", { name: "Acknowledge" }).click();
  await expect(notes.getByText("Acknowledged")).toBeVisible();
  await expect(page.getByText("Acknowledged")).toHaveCount(0);
});

test("alert, confirm, and prompt @cross", async ({ page }) => {
  await page.goto("/dialogs");

  page.once("dialog", (dialog) => {
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toBe("Shelf is locked");
    return dialog.accept();
  });
  await page.getByRole("button", { name: "Show shelf alert" }).click();
  await expect(page.getByText("Alert closed")).toBeVisible();

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Confirm discard" }).click();
  await expect(page.getByText("Kept")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept("cargo"));
  await page.getByRole("button", { name: "Name the pin" }).click();
  await expect(page.getByText("Named cargo")).toBeVisible();
});

test("popup is a second page @cross", async ({ page }) => {
  await page.goto("/popup");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Open bench note" }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading", { name: "Bench note" })).toBeVisible();
  await popup.close();
});
