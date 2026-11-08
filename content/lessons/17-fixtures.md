---
number: 17
slug: fixtures
title: Fixtures and the use contract
module: Fixtures and config
minutes: 40
summary: The runner calls your fixture, you call use, and the code after use is teardown. Worker scope versus test scope.
source: Fixtures | https://playwright.dev/docs/test-fixtures
source: test.extend | https://playwright.dev/docs/api/class-test#test-extend
source: Worker-scoped fixtures | https://playwright.dev/docs/test-fixtures#worker-scoped-fixtures
---

## Intuition

A fixture is a value the runner builds for a test and then tears down. `page` is a fixture. `request` is a fixture. `browser` is a fixture. You can add your own with `test.extend`. The shape is always the same: an async function that receives other fixtures and a `use` callback. Code before `use` is setup. `await use(value)` runs the test. Code after `use` is teardown, and it runs even when the test fails. That is RAII for JavaScript. The `use` call is the scope.

```ts
export const test = base.extend<{ catalog: CatalogPage }>({
  catalog: async ({ page }, use) => {
    const catalog = new CatalogPage(page);
    await catalog.open();
    await use(catalog);
  },
});
```

Tests that ask for `{ catalog }` get a page already sitting on the catalog. Tests that do not ask for it pay nothing. Fixtures are lazy. This is different from `beforeEach`, which runs for every test in the file whether the test needs the work or not.

The first type parameter of `extend` is the test-scoped fixtures. The second is worker-scoped. A worker-scoped fixture is created once per worker process and shared by tests that run on that worker. The auth guide uses one to log in once per worker when tests mutate server state and need distinct accounts. A worker fixture must not hold a `page` from a single test. Pages are test-scoped and die with the test. The worker fixture can hold a storage path, a database connection, or an account id.

Teardown after `use` is the right place to close a context you opened. If you return early before `use`, the test does not run and you have a bug. If you forget the code after `use`, you leak. Always structure the function as setup, `await use(...)`, teardown, with no conditional return that skips `use`.

## Worked example

A small fixture for the notes page that fails clearly when the cookie is missing:

```ts
import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

type Notes = { notes: Page };

export const test = base.extend<Notes>({
  notes: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/maintainer.json",
    });
    const page = await context.newPage();
    await page.goto("/maintainer");
    await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
    await use(page);
    await context.close();
  },
});

export { expect };
```

Re-export `expect` from the same module so call sites import `test` and `expect` from one place. If they import `test` from your file and `expect` from `@playwright/test`, that still works, but one module is harder to mix up.

The fixture depends on `browser`, not on `page`. It builds a context with storage state so it does not disturb the default `page` fixture. Closing the context is the teardown. The heading assertion during setup means a bad cookie fails in the fixture, with a clear timeout, before the test body runs.

:::callout compare
RAII and use()
In C++ the destructor runs at scope exit. In Rust, `Drop` runs at scope exit. A fixture has no destructor. The lines after `await use` are the drop. They run on failure because the runner awaits your fixture in a `finally` sense: your function continues when the test's promise settles, including rejection. Do not put the close before `use`.
:::

## Overrides

`test.use({ storageState: "..." })` overrides a fixture option for a file or a describe. You did that in the maintainer spec without writing `extend`. Options are fixtures with a default. `storageState`, `viewport`, `colorScheme`, and `baseURL` are options. `test.use` sets them the way a Rust `#[cfg]` would, except it composes with the project config. Project `use` is the base. File `test.use` overrides for that file.

Do not `test.use` inside the test body. It is a declaration-time call, beside `test()` or inside `describe`, not inside the async function.

:::exercise
### Add a catalog fixture

Write an `extend` that provides `catalog: CatalogPage`, constructs it with the `page` fixture, calls `open()`, passes it to `use`, and does not close the page. The runner owns that page.

:::hint
Test-scoped fixtures that only wrap `page` have no teardown of their own.
:::

:::solution
```ts
import { test as base } from "@playwright/test";
import { CatalogPage } from "../projects/capstone/pages";

export const test = base.extend<{ catalog: CatalogPage }>({
  catalog: async ({ page }, use) => {
    const catalog = new CatalogPage(page);
    await catalog.open();
    await use(catalog);
  },
});
```
:::
:::

:::exercise
### Spot the leak

```ts
notes: async ({ browser }, use) => {
  const context = await browser.newContext();
  await use(await context.newPage());
}
```

What is missing, and when does it hurt?

:::hint
`newContext` allocates a profile. Nothing closes it.
:::

:::solution
Add `await context.close()` after `use`. Without it, every test that requests `notes` leaves a context open until the worker exits. A long file exhausts memory or file descriptors.
:::
:::

:::quiz
When does fixture code after `await use` run?
- Only when the test passes
+ After the test body settles, including a failure
- Before the test, a second time
- Never, because `use` returns immediately
Teardown is the rest of the function. The runner resumes it when the test finishes.
:::

:::quiz
A worker-scoped fixture is created how often?
- Once per test
+ Once per worker process
- Once per file, even if several workers load the file
- Once per expect
Workers are processes. The fixture is shared by tests scheduled on that worker, so it must be safe to share.
:::

:::quiz
Why are fixtures lazy?
- The runner cannot see them
+ A test pays for a fixture only when it asks for it in the argument list
- `beforeEach` is illegal
- TypeScript erases them
`beforeEach` runs for every test in scope. A fixture runs for tests that list it.
:::
