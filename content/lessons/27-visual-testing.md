---
number: 27
slug: visual-testing
title: Screenshots and visual comparisons
module: Seeing and debugging
minutes: 35
summary: toHaveScreenshot on a stable poster, a Linux Chromium baseline, and why text assertions come first.
source: Visual comparisons | https://playwright.dev/docs/test-snapshots
source: Screenshots | https://playwright.dev/docs/screenshots
source: toHaveScreenshot | https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-screenshot
---

## Intuition

A screenshot assertion compares pixels. It catches a padding change that no role assertion would notice, and it fails because the font rasterizer is different, which no user would call a bug. Treat screenshots as a narrow net around a surface you froze on purpose. Do not cover the catalog with one. The catalog's contract is "the rustc link is visible," and a locator assertion says that. The poster at `/visual` is a fixed box, Arial, no timer, no data. That is a screenshot subject.

`await expect(page.locator(".poster")).toHaveScreenshot("bench-poster.png")` compares the element, not the whole window. The window includes the header, which you might change without meaning to change the poster. Element screenshots stay scoped.

The first run with `--update-snapshots` writes the PNG. Later runs compare. The file in this repo is the Linux Chromium capture from the environment that built the course. It will not match macOS, and it may not match a different Chromium revision. The test skips unless `browserName === "chromium"`. The Firefox and WebKit projects also skip it via the `@cross` grep, because the test is untagged. If you regenerate the baseline, look at the diff before you commit it. A baseline update is a product decision.

`animations: "disabled"` and `caret: "hide"` are options that remove two sources of noise. The poster has neither animations nor a caret. The options are still set so a future edit does not flake. `maxDiffPixels` can forgive a few antialiased edges. This course starts at the default, zero tolerance, because the poster is simple. If you add a photo, you will need a tolerance and a discussion.

## Worked example

```ts
test("poster matches the committed Linux Chromium baseline", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "The committed baseline is Linux Chromium.");
  await page.goto("/visual");
  await expect(page.locator(".poster")).toHaveScreenshot("bench-poster.png", {
    animations: "disabled",
    caret: "hide",
  });
});
```

The snapshot path is next to the test, under `tests/visual.spec.ts-snapshots/`. Commit the PNG. Do not gitignore it or the next machine has nothing to compare.

A full-page screenshot for a bug report is different from an assertion:

```ts
await page.screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true });
```

The config already takes a screenshot on failure. You do not need this line in every test. Use it when you want a shot at a moment that is not a failure, such as after a dialog.

`toHaveScreenshot` retries a few times because fonts and images settle. It is still a pixel compare. It will not become a text assertion. If the poster heading changes from "Pin the shelf" to "Pin the shelf.", the image fails. A `toHaveText` would also fail and would tell you the string. Use the text assertion for the string. Use the image for the copper bar and the border you cannot describe as text cheaply.

:::callout compare
Golden files in compilers
A screenshot baseline is a golden file. You update it when the output change is intended, and you review the diff. You do not update it to make CI green and look later. The PNG is binary, so the review belongs in the HTML report's diff, not in `git diff` alone.
:::

## What makes a surface stable

No `setTimeout`. No random ids. No network image. No system font that differs by distro: the poster sets Arial, Helvetica, sans-serif. No hover state. A fixed width in CSS, 720 pixels, so the locator box does not depend on the window. The test does not set a special viewport because the element width is fixed. The header can wrap on a phone viewport without moving the poster pixels.

Masking is available (`mask: [locator]`) when a region is dynamic, such as a clock. Masking the whole poster means you are snapshotting nothing. Delete the test instead.

1.65's screenshot work is mostly about the MCP and trace tools, not about a new matcher. The matcher you want is still `toHaveScreenshot`. Page-level `toHaveScreenshot` exists on `expect(page)` when the whole viewport is the subject. Prefer the element.

:::exercise
### Update a baseline on purpose

The poster kicker changes from "Workshop Bench" to "Bench". Which command regenerates the PNG, and what do you look at before committing?

:::hint
`--update-snapshots` writes the actual image. The report shows the diff if you run once without the flag first.
:::

:::solution
Run the visual test once to see the mismatch, then `npx playwright test tests/visual.spec.ts --project=chromium --update-snapshots`. Open the new PNG and confirm only the kicker text changed. Then commit the PNG with the CSS change.
:::
:::

:::exercise
### Choose the assertion

The order id must be `BN-ARUN`. Would you snapshot the confirmation page? What do you write instead?

:::hint
The id is text. The page chrome will drift.
:::

:::solution
```ts
await expect(page.getByText("BN-ARUN")).toBeVisible();
```
A screenshot would fail for unrelated header edits and would be harder to read in review.
:::
:::

:::quiz
This course's screenshot baseline is valid for which browser?
- All three, because pixels are pixels
+ Linux Chromium, the project that generated it
- Firefox only
- Headed Chrome on macOS
The test skips other browser names. Fonts and rasterizers differ.
:::

:::quiz
Why snapshot `.poster` instead of `page`?
- Element screenshots are newer
+ The header can change without the poster changing, and the subject is the poster
- `page` screenshots were removed
- Element screenshots ignore CSS
Scope the golden file to the surface you froze.
:::

:::quiz
`--update-snapshots` should be used when?
- The test failed and you are in a hurry
+ You have reviewed the pixel diff and the new image is the intended product
- On every CI run
- Only on WebKit
Updating a baseline is a commit. Look at it.
:::
