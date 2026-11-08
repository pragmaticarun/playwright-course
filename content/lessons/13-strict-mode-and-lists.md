---
number: 13
slug: strict-mode-and-lists
title: Strict mode, filters, and lists of locators
module: Locators
minutes: 35
summary: One match for an action, many matches for a count, and how to narrow without nth when you can.
source: Locators, strictness | https://playwright.dev/docs/locators#strictness
source: Locator.count | https://playwright.dev/docs/api/class-locator#locator-count
source: Locator.filter | https://playwright.dev/docs/api/class-locator#locator-filter
---

## Intuition

Playwright actions are strict. `click`, `fill`, and `check` require the locator to match exactly one element. Zero matches is a timeout. Two matches is an immediate strict-mode violation that names both elements. The error is a gift. It means your description was ambiguous, and the runner refused to guess. Selenium-style "click the first one" hides that ambiguity until the first match changes.

Assertions split the difference. `toBeVisible` on a locator that matches two elements also complains, because "visible" of which one is not defined. `toHaveCount` is the assertion that expects many. Use it when the number is the behavior.

`locator.all()` gives you an array of locators, one per match, at that moment. The list is a snapshot of how many matched, but each entry is still a locator. Iterating is legitimate for "every row contains a pin". It is a trap for "click the third thing" if a filter would say which row you meant.

`first()`, `last()`, and `nth()` exist and are explicit. They silence strict mode by picking an index. An index is a contract with the current sort order. The catalog is sorted by the array in `catalog.js`. If you assert `nth(2)` is rustc, you are pinning that order. Say so in the test name. Do not use `nth` just to get past an error you did not read.

## Worked example

The locator drill counts cards without clicking a list:

```ts
await page.goto("/");
await expect(page.locator("[data-card]")).toHaveCount(6);
await page.getByRole("button", { name: "Android", exact: true }).click();
await expect(page.locator("[data-card]:not([hidden])")).toHaveCount(2);
```

`toHaveCount` retries. The CSS locator is deliberate: `hidden` cards are still list items in the DOM, and this test wants the count of cards the filter left showing. A role locator for `listitem` would skip `hidden` nodes because they leave the accessibility tree, which is also a valid assertion: "the user can see two items." Pick the tree you mean. This drill pins the DOM flag. The role-based locator test pins what is visible to `getByRole`.

Strict mode on the catalog:

```ts
await page.getByRole("button", { name: "Add" }).click();
```

That fails. Every card has an add button whose name contains "Add". The fix is a longer name or a `filter`, not `first()`.

```ts
const rustc = page.getByRole("listitem").filter({ hasText: "rustc" });
await expect(rustc).toHaveCount(1);
await rustc.getByRole("button", { name: "Add rustc to shelf" }).click();
```

`filter` does not change strictness by itself. After it, one list item remains, and the button inside it is unique anyway.

:::callout compare
Off-by-one is still off-by-one
`nth` is `operator[]`. You would not index a `std::vector` of search results when you have the key. You would not `nth(0)` a set of buttons when you have the accessible name. Indexes belong in tests whose subject is the order.
:::

## Lists and soft failures

`expect(locator).toHaveText(["a", "b"])` on a locator that matches multiple elements checks each text, in order. That is a list assertion, not a strict-mode violation. The contract is "these texts, this order." It retries.

`locator.evaluateAll` runs in the browser over the matched nodes and returns a value. Use it to pull a small array of strings when an assertion on locators is awkward. Do not use it to click. Clicks belong on locators so auto-wait still applies.

When you truly have two elements and you want both checked without the test stopping at the first failure, soft assertions are in the timeout lesson. They are not a way around strict mode. A strict violation throws before the soft checker helps you.

:::exercise
### Make a strict click unique

The checkout page and the header both contain links, but only one button is named "Place bench order". A colleague's locator `page.getByRole("link")` times out or goes strict. Replace it with a locator that submits the form. Do not use `nth`.

:::hint
The submit control is a button, not a link. The header links are links.
:::

:::solution
```ts
await page.getByRole("button", { name: "Place bench order" }).click();
```
Role plus full name is unique. `getByRole("link")` matches every navigation link.
:::
:::

:::exercise
### Count after a filter

Assert that the Rust filter leaves exactly two `[data-card]` elements not hidden, without using `nth`.

:::hint
`toHaveCount` is the multi-element assertion. `:not([hidden])` matches the DOM flag the filter sets.
:::

:::solution
```ts
await page.goto("/");
await page.getByRole("button", { name: "Rust", exact: true }).click();
await expect(page.locator("[data-card]:not([hidden])")).toHaveCount(2);
```
:::
:::

:::quiz
An action locator that matches two buttons fails how?
- It clicks both
- It clicks the first and logs a warning
+ It throws a strict-mode violation
- It waits until one is removed, forever, with no error text
Strict mode fails fast and prints both matches. Read them and narrow the locator.
:::

:::quiz
Which call is built for many matches?
- `click()`
+ `toHaveCount()`
- `fill()`
- `check()`
Count is a list assertion. The actions want one element.
:::

:::quiz
`nth(0)` is appropriate when?
- You are in a hurry
+ The test's subject is the order of matches, and you accept that contract
- Strict mode is a bug
- The element has no role
Say that you mean the first row. Otherwise filter by what the user sees.
:::
