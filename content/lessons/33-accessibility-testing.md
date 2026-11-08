---
number: 33
slug: accessibility-testing
title: Accessibility testing with axe
module: Structure
minutes: 40
summary: @axe-core/playwright 4.14.0 scans the lab. Automated scans catch some WCAG failures and miss the rest.
source: Accessibility testing | https://playwright.dev/docs/accessibility-testing
source: @axe-core/playwright | https://www.npmjs.com/package/@axe-core/playwright
source: axe-core | https://github.com/dequelabs/axe-core
source: WCAG 2.2 | https://www.w3.org/TR/WCAG22/
---

## Intuition

axe is a scanner you run inside a Playwright test. It injects into the page, checks rules, and returns violations. `@axe-core/playwright` at 4.14.0 is the package this course pins. The major and minor track axe-core's line, not semver in the usual npm sense: the package readme says a 4.14.x release of the Playwright wrapper uses axe-core 4.14.x.

The Playwright accessibility guide is explicit about the limit. Automated checks find missing names, bad contrast, and duplicate ids. They do not find a confusing reading order, a label that is present and wrong, or a flow that traps the keyboard in a way the rules do not encode. The guide points at Accessibility Insights for Web for the manual pass. You still write the scan. You do not declare the product accessible because the scan is empty.

Workshop Bench's `/a11y` page is written to pass WCAG 2.x A and AA tags that axe knows: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`. The broken page is written to fail `button-name` and `image-alt`. The tests assert those outcomes. A scan that is always empty because you disabled every rule is not a scan.

## Worked example

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the accessible bench has no WCAG A or AA violations", async ({ page }) => {
  await page.goto("/a11y");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

`analyze` waits for you to call it. Navigate and finish animations first. The guide shows `waitFor` on a menu before scanning the menu, because axe sees the DOM you have, not the DOM you are about to open.

The broken page:

```ts
const results = await new AxeBuilder({ page }).analyze();
const ids = results.violations.map((violation) => violation.id);
expect(ids).toContain("button-name");
expect(ids).toContain("image-alt");
```

This scan does not pass `withTags`, so best-practice rules run too. The assertion is `toContain`, not a full equality, because extra rules may fire and the point of the test is the two deliberate bugs. The good page uses equality to `[]` under a tag set, which is stricter and appropriate when you own the page.

`include` and `exclude` scope the scan. `disableRules` turns off a rule you have filed a bug for. The guide prefers `exclude` for one bad element and warns that exclude drops every rule on that subtree. Do not exclude `main` to get a green run.

Attach the JSON when a scan fails in CI:

```ts
await testInfo.attach("axe", {
  body: JSON.stringify(results, null, 2),
  contentType: "application/json",
});
```

The report then holds the nodes and the help URLs. That is more useful than the one-line expect diff.

:::callout note
Contrast on the course site and the lab
axe's color-contrast rule measures what the page paints. The lab uses dark text on a light paper background and a copper button with light text. The good scan includes that chrome because the shared layout wraps `/a11y`. If you restyle the footer to gray-on-gray, this test is the one that should go red.
:::

## A fixture for a shared policy

The guide's fixture example builds an `AxeBuilder` with the tags and an exclude already applied. Do that when every page shares a known third-party widget you cannot fix this week. Keep the exclude list short and commented with a ticket id. A comment that says "exclude the bad thing" with no ticket becomes permanent.

Manual checks you still owe the lab, even though the scan is green: tab through the catalog and confirm the filter buttons and the skip link take focus in an order a person can predict; confirm the focus ring, which the CSS draws, is visible; try the form with only the keyboard. None of those are in the axe tags you enabled, or they are only partly covered.

The capstone scans the catalog with the same tags. A violation there fails the project, not a side suite nobody runs.

:::exercise
### Scan the catalog

Write a test that opens `/` and expects no violations for the four WCAG tags used above.

:::hint
The capstone already does this. Match that shape. Call `analyze` after `goto`.
:::

:::solution
```ts
await page.goto("/");
const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  .analyze();
expect(results.violations).toEqual([]);
```
:::
:::

:::exercise
### Do not snapshot the whole violation list

The guide shows a fingerprint of `{ rule, targets }` instead of `expect(violations).toMatchSnapshot()`. Why is the full object a bad snapshot?

:::hint
Violations include HTML snippets of the nodes.
:::

:::solution
The HTML snippet changes when you edit copy that is unrelated to the bug, and the snapshot fails. A fingerprint of the rule id and the target selectors stays stable until the violation itself moves. The lab's broken page uses `toContain` on ids, which is even smaller, because those two rules are the entire point.
:::
:::

:::quiz
An empty axe result means:
- The page meets WCAG completely
+ No enabled automated rule failed; manual testing is still required
- The locators are correct
- The screenshot baseline matches
Playwright's guide says this directly. Do not skip the keyboard pass.
:::

:::quiz
`withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])` does what?
- Disables contrast checks
+ Limits the scan to rules axe tags as those WCAG levels
- Replaces `getByRole`
- Turns on experimental best practices only
Best-practice rules without those tags are left out. The broken-page test omits `withTags` on purpose.
:::

:::quiz
This course pins which `@axe-core/playwright` version?
- 1.65.0
+ 4.14.0
- 0.0.84
- Whatever `npm install` floated last week
4.14.0 is the pinned release. The Playwright package pin is separate, at 1.65.0.
:::
