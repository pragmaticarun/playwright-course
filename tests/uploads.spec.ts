import { test, expect } from "@playwright/test";

test("uploads a manifest buffer", async ({ page }) => {
  await page.goto("/upload");
  await page.getByLabel("Manifest").setInputFiles({
    name: "pins.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("rustc\n"),
  });
  await page.getByRole("button", { name: "Upload manifest" }).click();
  await expect(page.getByRole("heading", { name: "Upload received" })).toBeVisible();
  await expect(page.getByText("Received pins.txt (6 bytes).")).toBeVisible();
});

test("downloads the bench notes", async ({ page }) => {
  await page.goto("/download");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download bench notes" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("bench-notes.txt");
  const saved = await download.path();
  expect(saved).toBeTruthy();
});
