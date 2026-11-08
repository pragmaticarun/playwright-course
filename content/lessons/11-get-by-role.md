---
number: 11
slug: get-by-role
title: Semantic locators and getByRole
module: Locators
minutes: 40
summary: Role, name, and exactness. The locator you should reach for before CSS, XPath, or a test id.
source: Locators | https://playwright.dev/docs/locators
source: getByRole | https://playwright.dev/docs/api/class-page#page-get-by-role
source: ARIA roles | https://www.w3.org/TR/wai-aria-1.2/#role_definitions
source: Best practices | https://playwright.dev/docs/best-practices
---

## Intuition

A locator is a description that is re-evaluated every time you act or assert. It is not a pointer to a node. If React, or the small script in Workshop Bench, replaces the button, the locator finds the new one. An `ElementHandle` grabbed earlier is the dangling pointer. Prefer locators. Playwright's own best-practices page says the same thing, and then tells you to prefer user-facing attributes: roles, labels, and text, over CSS and XPath.

`getByRole(role, { name })` is the first tool. The role is the accessibility role. The name is the accessible name. For a button, that is usually its text. `{ exact: true }` turns the name match from a substring into a full string. The filter button "All" is a good candidate for `exact`, because substring matches surprise you the moment a label contains those letters.

The level option narrows headings: `{ level: 1, name: "Workshop Bench" }` is the catalog h1, not a card title. `includeHidden: true` is an escape hatch for nodes the accessibility tree has dropped. Do not use it to click a hidden control. If the control is hidden, the user cannot click it either.

Roles you will use constantly on this lab: `button`, `link`, `heading`, `textbox` via label more often than role, `checkbox`, `radio`, `combobox` is not how this lab's selects are queried: a native `<select>` is found with `getByLabel`. The form lesson shows that. For links and buttons, role plus name is enough.

## Worked example

From `tests/locators.spec.ts`:

```ts
await page.goto("/");
await page.getByRole("button", { name: "Rust", exact: true }).click();
await expect(page.getByRole("link", { name: "rustc" })).toBeVisible();
await expect(page.getByRole("link", { name: "adb" })).toBeHidden();
```

The click retries until the Rust button is actionable. The expectations retry until the links match the visibility you asked for. `toBeHidden` passes when the node is gone or hidden. The filter sets the `hidden` property on non-Rust cards. adb's link is still in the DOM and is hidden. The assertion documents that.

Chaining keeps a search inside a region:

```ts
const card = page.getByRole("listitem").filter({ hasText: "rustc" });
await card.getByRole("button", { name: "Add rustc to shelf" }).click();
```

`filter` returns another locator. It does not click. The chain reads like a sentence: in the list item that mentions rustc, click the add button. That survives a second "Add" button elsewhere on the page.

:::callout compare
Resource ids versus roles
Android tests often start from `R.id`. That is stable and invisible to the user. `getByRole` starts from what TalkBack would say. When the id is the only stable hook you have, `getByTestId` exists and a later lesson uses it. It is the second choice, because an id can stay green while the accessible name becomes "Click here".
:::

## Names that are not the text you see

`aria-label` replaces the contents as the accessible name. A button whose text is an icon and whose `aria-label` is "Close menu" is `getByRole("button", { name: "Close menu" })`. The visible glyphs are not the name. The course site's menu button is labeled that way so the accessible name does not depend on the icon.

Punctuation and extra whitespace are normalized in accessible names. Do not copy a newline from the DOM inspector into the locator. Use the name a screen reader would speak.

Playwright 1.65 also waits for the target of a click to be not inert. A role locator can still describe a button inside an `inert` subtree if that button remains exposed. On this lab the save button is inside `inert`, and the waiting lesson clicks it by id to show the actionability failure directly. Role locators remain the default everywhere the control is actually available.

:::exercise
### Filter to Android

Write a test that presses the Android filter and expects the adb and scrcpy links to be visible and the cargo link to be hidden.

:::hint
Use `exact: true` on the filter button. The link names are the tool names.
:::

:::solution
```ts
await page.goto("/");
await page.getByRole("button", { name: "Android", exact: true }).click();
await expect(page.getByRole("link", { name: "adb" })).toBeVisible();
await expect(page.getByRole("link", { name: "scrcpy" })).toBeVisible();
await expect(page.getByRole("link", { name: "cargo" })).toBeHidden();
```
:::
:::

:::exercise
### Tighten a loose name

`getByRole("button", { name: "Add" })` throws a strict-mode violation on the catalog because every card has an add button. Fix the locator so it adds only rustc.

:::hint
Put the tool name in the accessible name match, or chain from the list item.
:::

:::solution
```ts
await page.getByRole("button", { name: "Add rustc to shelf" }).click();
```
The button text is `Add rustc to shelf`. That name is unique.
:::
:::

:::quiz
A locator is best described as what?
- A cached DOM node pointer
+ A description re-run on each action and assertion
- A CSS selector compiled once at launch
- A screenshot of the element
The node can be replaced. The description finds the next one.
:::

:::quiz
What does `{ exact: true }` change on `getByRole`?
- It requires an id match
+ The accessible name must match the whole string, not a substring
- It disables auto-waiting
- It searches iframes
Substring is the default. Exact is how you avoid a short name hitting a longer one.
:::

:::quiz
Which locator does the best-practices guide want first?
+ `getByRole` and other user-facing locators
- XPath from the root of the document
- A CSS class used only for color
- `page.evaluate` that returns an element
User-facing attributes survive refactors that shuffle divs. XPath usually does not.
:::
