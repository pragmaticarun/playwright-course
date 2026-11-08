---
number: 12
slug: labels-text-testid
title: Labels, text, test ids, and chaining
module: Locators
minutes: 40
summary: getByLabel, getByText, getByPlaceholder, getByTestId, and when each one is the honest choice.
source: Locators | https://playwright.dev/docs/locators
source: Other locators | https://playwright.dev/docs/other-locators
source: getByTestId | https://playwright.dev/docs/api/class-page#page-get-by-test-id
---

## Intuition

Roles cover controls whose role is obvious. Several other user-facing locators cover the rest, and one escape hatch covers the case where the UI is genuinely not user-facing.

`getByLabel` finds a form control by its accessible name from a `<label>`, `aria-label`, or `aria-labelledby`. It is the right call for inputs, selects, and textareas. The toolchain form's "Display name", "Channel", and "Notes" are labels. The checkbox "Email the build log" is also a label wrapped around the input, so `getByRole("checkbox", { name: "Email the build log" })` and `getByLabel` both work. Pick one and stay with it in a file.

`getByText` finds an element by its text. It is good for assertions on a status line and risky as a click target when the text is inside a paragraph that also contains a button. Prefer clicking the button by role. Use text to assert what the user reads: "Preferences saved", "mirror down", "The shelf is empty."

`getByPlaceholder` uses placeholder text. Placeholders vanish while typing and fail contrast and naming checks often enough that you should not build a form that has only placeholders. The lab forms use labels. Do not add placeholders to make tests easier.

`getByAltText` reads an image's alt. The good a11y page's mark can be found that way. The broken page's image has no alt, so this locator cannot find it. That is the point.

`getByTitle` uses the `title` attribute, which is a poor name source. Avoid it.

`getByTestId` reads `data-testid` by default. Configure `testIdAttribute` if your codebase already standardized on `data-test`. Test ids are stable and invisible. They do not tell you whether the control has an accessible name. Use them for a canvas, a row in a grid that has no accessible name, or a third-party widget you cannot relabel. Do not sprinkle them on every button to avoid learning roles.

CSS and XPath still exist: `page.locator("css=...")` and `page.locator("xpath=...")`. They couple you to structure. The inert lesson uses `#save-pin` because the point of that test is the attribute, not the role. One id in a test about ids is fine. A suite of CSS paths is a refactor tax.

## Worked example

The form round-trip in `tests/forms.spec.ts`:

```ts
await page.getByLabel("Display name").fill("Arun");
await page.getByLabel("Channel").selectOption("beta");
await page.getByRole("radio", { name: "Rust" }).check();
await page.getByRole("checkbox", { name: "Email the build log" }).check();
await page.getByLabel("Notes").fill("nightly only on the lab machine");
await page.getByRole("button", { name: "Save preferences" }).click();
await expect(page.locator("dd").nth(0)).toHaveText("Arun");
```

`nth` is an index. Indexes break when someone inserts a row. Here the definition list order is the contract of the echo page, and the test is about that echo. For a catalog, prefer filtering by text over `nth`. `locator("dd").nth(0)` is a CSS-ish structural locator used only because the echo page has no better name on the value cells. If you own the page, add a description list that is still fine, or put each value in an element with a label. The lab keeps the `dl` so you can feel when a structural locator is the awkward choice.

Chaining and `filter`:

```ts
await page
  .getByRole("listitem")
  .filter({ has: page.getByRole("link", { name: "cmake" }) })
  .getByRole("button", { name: "Add CMake to shelf" })
  .click();
```

`has` expects a locator relative to the candidate. `hasText` expects a string or regex. Both narrow. They do not click.

:::callout note
Test id attribute
The default attribute is `data-testid`. The MCP server and the test runner both let you change it, with `use.testIdAttribute` in the config and `--test-id-attribute` on the MCP CLI. Change it once, in the config, if your app already picked a different attribute. Do not pass a different attribute from each test.
:::

## Locators are lazy and strict

Creating a locator never throws because the element is missing. Acting throws, or times out, when the description matches nothing or matches more than one element. Strict mode is the subject of the next lesson. The practical rule: if you meant one button, the name should match one button. If you meant a list, use a method that expects a list, such as `toHaveCount`, instead of `click` on the group.

`locator.or(other)` unions two descriptions. It is for cases where the control has two legitimate shapes, not for papering over a race. `locator.and(other)` intersects. You will rarely need either in this lab.

:::exercise
### Fill the checkout form with labels

On `/checkout`, fill "Your name" and "Email", check "I am testing this local bench", and click "Place bench order". Assume the shelf is empty. Assert the heading "Order needs a fix".

:::hint
The empty shelf is a server-side error. The checkbox name is the label text.
:::

:::solution
```ts
await page.goto("/checkout");
await page.getByLabel("Your name").fill("Arun");
await page.getByLabel("Email").fill("arun@example.com");
await page.getByRole("checkbox", { name: "I am testing this local bench" }).check();
await page.getByRole("button", { name: "Place bench order" }).click();
await expect(page.getByRole("heading", { name: "Order needs a fix" })).toBeVisible();
```
:::
:::

:::exercise
### Choose a locator for a generated row

A table cell's text is the tool name the test just added. Would you use `getByTestId`, `getByRole("cell", { name })`, or a CSS nth-child? Say why.

:::hint
The cell's accessible name can be its text. The user sees that text.
:::

:::solution
`getByRole("cell", { name: "adb" })` matches what the user reads and what the isolation test already uses. A test id is justified if cells are virtualized and have no accessible name. nth-child breaks when a column is inserted.
:::
:::

:::quiz
Which locator matches a native select by its `<label>` text?
- `getByRole("button", { name })` always
+ `getByLabel`
- `getByPlaceholder`
- `getByTitle`
The label provides the accessible name. `getByLabel("Channel")` is the call used on the toolchain form.
:::

:::quiz
When is `getByTestId` the recommended hook?
- For every button, so tests never read the UI
+ When the control has no stable user-facing name, such as a canvas or a generated row you cannot name
- Instead of assertions
- Only inside iframes
Test ids skip the user's experience. Use them when there is no experience to hook.
:::

:::quiz
Creating a locator that matches nothing throws when?
- Immediately, at `getByRole`
+ When you act or assert and the retry timeout expires
- When the file is imported
- Never; click becomes a no-op
Locators are lazy. The failure happens at the action or the expect, with a timeout, unless strict mode finds two matches first.
:::
