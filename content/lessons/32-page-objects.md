---
number: 32
slug: page-objects
title: Page objects after the class-field change
module: Structure
minutes: 40
summary: A page object is a facade over locators. Construct those locators inside the constructor on Playwright 1.65.
source: Page object models | https://playwright.dev/docs/pom
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
source: Best practices | https://playwright.dev/docs/best-practices
---

## Intuition

A page object is a class that holds the locators and the gestures for one page. Tests read like the task: open the catalog, filter to Rust, add rustc. The selectors live in one file. When the button name changes, you edit the class, not twelve tests.

It is not a place to hide assertions that always pass. Assert in the test, or return values and let the test assert. A method named `add` that swallows a timeout is a method that hides the product. Throw. The test failure is the point.

Playwright's POM guide shows classes with locators as fields. 1.65 changes the legal way to write those fields when TypeScript uses define-for-class-fields semantics. This fails at runtime:

```ts
class CatalogPage {
  readonly heading = this.page.getByRole("heading", { name: "Workshop Bench" });
  constructor(private readonly page: Page) {}
}
```

Field initializers run before the parameter property exists. The capstone classes in `projects/capstone/pages.ts` assign `this.page` and the locators in the constructor body. Do that even if your current `target` is ES2017 and the bug is latent. The next person will raise the target.

Methods may `await`. Constructors should not. Open the page in `open()`, not in the constructor, so `new CatalogPage(page)` stays synchronous and cheap. The fixture lesson showed an alternative where the fixture calls `open()` before `use`. Either is fine. Doing it in both places is noise.

## Worked example

The capstone flow, with the classes that ship in this repo:

```ts
const catalog = new CatalogPage(page);
const shelf = new ShelfPage(page);
const checkout = new CheckoutPage(page);

await catalog.open();
await expect(catalog.heading).toBeVisible();
await catalog.filter("Rust");
await catalog.add("rustc");
await shelf.open();
await expect(page.getByRole("cell", { name: "rustc" })).toBeVisible();
await checkout.open();
await checkout.place("Arun", "arun@example.com", "lab order");
await expect(page.getByText("BN-ARUN")).toBeVisible();
```

`filter` and `add` and `place` are the gestures. The expectations stay in the test so a reader sees the contract without opening the class. `place` fills the labels and clicks. It does not assert the order id, because a second test might `place` a name that should fail validation.

Keep locators public and `readonly` when tests need them for assertions, as `catalog.heading` does. Keep incidental locators private. Do not return `this.page` from every method. The test already has `page`.

Inheritance is usually a trap: a `BasePage` with a click helper nobody can find. Composition is enough. The capstone has four small classes, not a hierarchy.

:::callout compare
A facade over a driver
You would wrap a C++ driver API in a type that speaks the device's operations, not `ioctl` numbers. A page object speaks "add rustc," not "click the third button." The locators inside are the ioctl numbers, contained.
:::

## What does not belong

Sleeps. Routes that only one test needs: keep the `page.route` in that test so the mock is visible. Storage state: that is `test.use` or a fixture, not `CatalogPage`. A page object that logs in inside `open()` mixes two pages and surprises the catalog tests.

The auth guide's multi-role fixture constructs page objects around pages it created. That is the right meeting point: the fixture builds the authenticated page, the page object wraps it. `projects/capstone/bench.spec.ts` builds the objects in the test because the flow is the story. A longer suite would move `new CatalogPage` into a fixture.

1.65 also waits for non-inert targets. A page object method does not get a special exemption. If `save()` clicks an inert button, it times out. Fix the product or open the panel in the method before the click, explicitly.

:::exercise
### Move a locator into the constructor

You inherited this class. Make it safe under `useDefineForClassFields` without changing the behavior.

```ts
class CheckoutPage {
  readonly order = this.page.getByRole("button", { name: "Place bench order" });
  constructor(private readonly page: Page) {}
}
```

:::hint
Declare the fields, assign `this.page` first, then assign `this.order`.
:::

:::solution
```ts
class CheckoutPage {
  readonly page: Page;
  readonly order: Locator;

  constructor(page: Page) {
    this.page = page;
    this.order = page.getByRole("button", { name: "Place bench order" });
  }
}
```
:::
:::

:::exercise
### Pull an assertion back out

`add()` currently asserts that the status says the tool was added, and the test asserts it again. Where should the assertion live, and what should `add()` do?

:::hint
The method can wait for the status so the gesture is complete, or it can return and let the test assert. Doing both hides which layer owns the contract. The capstone waits inside `add` so the click's effect has landed before the next navigation, and the test asserts the shelf cell.
:::

:::solution
Keep the wait inside `add` so the shelf write has happened before `shelf.open()`. Keep the user-visible assertion, the cell named rustc, in the test. Delete a duplicate status assertion from the test if `add` already waited for it. One contract each.
:::
:::

:::quiz
Why do 1.65 page objects assign locators in the constructor body?
- `getByRole` became async
+ Class field initializers run before parameter properties exist when define-for-class-fields is on
- Constructors cannot call `getByRole`
- Locators must be created after the first click
The release notes show the `TypeError` on `this.page` inside a field initializer.
:::

:::quiz
Assertions belong primarily in:
- The constructor
+ The test, with methods that perform gestures and may wait until the gesture is complete
- A global afterEach that always passes
- The reporter
The test reads as the specification. The page object is the vocabulary.
:::

:::quiz
A `BasePage` with a generic `click(css)` method is:
- Required by the POM guide
+ A way to sneak CSS locators back into every call site
- The exclusive lock
- Needed for storage state
If the base class takes a CSS string, you have lost the role locators the rest of the course argued for.
:::
