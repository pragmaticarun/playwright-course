import { expect, test } from "@playwright/test";

test("search, a lesson, a quiz, and local progress", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("device under test");
  await page.screenshot({ path: "/opt/cursor/artifacts/home-desktop.png", fullPage: true });

  const search = page.getByRole("textbox", { name: "Search lessons" });
  await search.fill("zzzz-not-a-lesson");
  await expect(page.getByText("No lesson matches that.")).toBeVisible();
  await search.fill("prompt injection");
  await page.locator(".search-results").getByRole("link", { name: /Secrets, permissions, and prompt injection/ }).click();
  await expect(page).toHaveURL(/secrets-permissions-injection/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Secrets, permissions, and prompt injection");

  await page.getByRole("button", { name: "Copy" }).first().click();
  await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Hint" }).first().click();
  await expect(page.getByText("Redaction edits the text the model sees after the fact.")).toBeVisible();
  await page.getByRole("button", { name: "Solution" }).first().click();
  await expect(page.getByText("tests/auth.setup.ts")).toBeVisible();

  const quiz = page.getByRole("group").filter({ hasText: "The README describes" });
  await quiz.getByRole("radio", { name: /A convenience that replaces text/ }).check();
  await quiz.getByRole("button", { name: "Check answer" }).click();
  await expect(quiz.getByRole("status")).toContainText("Correct.");

  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(page.getByRole("button", { name: "Completed on this browser" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  await page.screenshot({ path: "/opt/cursor/artifacts/lesson-dark-desktop.png", fullPage: false });

  await page.reload();
  await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  await page.goto("/progress");
  await expect(page.getByText("1 of 38 lessons marked complete.")).toBeVisible();
  await expect(page.getByRole("row", { name: /Secrets, permissions/ })).toContainText("Yes");
  const stored = await page.evaluate(() => window.localStorage.getItem("bench-course-progress-v1"));
  expect(stored).toContain("secrets-permissions-injection");
  await page.screenshot({ path: "/opt/cursor/artifacts/progress-desktop.png", fullPage: true });
});

test("a missing lesson is not a course page", async ({ page }) => {
  const response = await page.goto("/lessons/not-a-lesson");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("That page is not on the bench");
});

test("the phone layout opens the lesson menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await page.screenshot({ path: "/opt/cursor/artifacts/home-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open lesson menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Lessons" })).toBeVisible();
  await dialog.getByRole("link", { name: "JavaScript for systems programmers" }).click();
  await expect(page).toHaveURL(/js-for-systems-programmers/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("JavaScript for systems programmers");
  await page.screenshot({ path: "/opt/cursor/artifacts/lesson-mobile.png", fullPage: false });
});
