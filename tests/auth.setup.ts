import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(__dirname, "../playwright/.auth/maintainer.json");

setup("authenticate as maintainer", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.goto("/login");
  await page.getByLabel("Name").fill("maintainer");
  await page.getByLabel("Passphrase").fill("shelf-note");
  await page.getByRole("button", { name: "Unlock notes" }).click();
  await page.waitForURL("**/maintainer");
  await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
