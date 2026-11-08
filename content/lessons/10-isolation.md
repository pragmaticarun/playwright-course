---
number: 10
slug: isolation
title: Isolation is a fresh profile, not a polite convention
module: Pages and contexts
minutes: 30
summary: What the runner resets for you, what localStorage still shares inside one context, and how to stop tests from coupling.
source: Browser contexts | https://playwright.dev/docs/browser-contexts
source: Best practices, isolation | https://playwright.dev/docs/best-practices
source: Parallelism | https://playwright.dev/docs/test-parallel
---

## Intuition

Isolation is the property that lets you run test 30 without remembering test 2. Playwright buys it with a new context per test. Cookies, local storage, session storage, and permissions start empty. Service workers registered in that context go away with it. You do not "clean up" the previous test's login unless you deliberately loaded storage state.

Isolation does not cover the server. If two tests POST a row into a shared database, the context boundary does not save you. Workshop Bench was built so that this does not happen. `POST /api/packages` echoes `{ persisted: false }` and the next GET still returns six pins. The shelf is `localStorage`, which is inside the context. The order id is computed from the name you typed, not from a counter. That is why `fullyParallel: true` is honest here.

If you later point the suite at a real staging server, ask one question before you parallelize: can two tests mutate the same account at the same time? If yes, give each worker its own account. Playwright's auth guide shows a worker-scoped fixture that logs in once per worker using `testInfo.parallelIndex`. That is the moderate strategy. The basic strategy, one shared account, is only safe when tests do not step on each other's server state.

## Worked example

The negative maintainer test and the positive one do not interfere, even in one file, because the positive test loads a storage file into its own context.

```ts
test.use({ storageState: "playwright/.auth/maintainer.json" });

test("storage state opens signing notes", async ({ page }) => {
  await page.goto("/maintainer");
  await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
});
```

`test.use` in a file applies to the tests in that file. It does not leak into `tests/isolation.spec.ts`, which expects 403. The setup project creates the file before either runs, because both browser projects depend on `setup`. The file is gitignored. It contains a cookie that can impersonate the fixture user on the lab origin. Do not commit it. The auth lesson repeats this because the official docs put a warning box on it.

A worker is a process. `fullyParallel` may put two tests from one file on different workers, each with a browser. They still cannot see each other's cookies. They can both hit the same port on `127.0.0.1`. The server must tolerate that. Ours does.

:::callout compare
Rust tests versus Playwright tests
`cargo test` runs functions that share a process and will race on a global `Mutex` if you let them. Playwright tests share nothing in the browser unless you opt in with storage state or a sloppy server. Treat a passing parallel run as evidence the server is stateless, not as evidence your assertions are good.
:::

## Coupling to avoid

Order dependence: test 2 assumes test 1 clicked "Add rustc". That passes in a serial run and fails when the runner shuffles. Each test should build the shelf it needs.

Shared files: two tests writing `output.txt` in the repo. Use `testInfo.outputPath` if you need a scratch file. The runner gives each test a directory.

`test.describe.configure({ mode: "serial" })` forces order inside a group and stops the group when one test fails. Use it when you are honestly testing a sequence that cannot be split, not as a way to avoid writing setup. This course's suite does not need serial mode.

:::exercise
### Design a stateless check

You want a test that creates a package named `ninja` through `POST /api/packages` and a second test that lists packages. Why is it safe that both run at once against Workshop Bench? What would you change if POST inserted into a real database?

:::hint
Read the POST handler. `persisted` is false, and the GET list is the static catalog.
:::

:::solution
The POST does not store `ninja`, so the list test still sees six pins. Against a real database you would use a unique name per test, or a private account per worker, or reset the row in a fixture. You would not share one writable row across parallel tests.
:::
:::

:::exercise
### Find the leak

Someone stores the signed-in `page` on a module-level variable and reuses it in the next test to skip login. What does the runner do with that page at the end of the first test, and what should they do instead?

:::hint
The fixture teardown closes the context.
:::

:::solution
The next test's call on that page throws because the context is closed. Save storage state from the setup project and load it with `test.use` or with `browser.newContext({ storageState })`. Each test still gets a living context.
:::
:::

:::quiz
What does a new context reset?
- Rows your test inserted in a shared database
+ Cookies, web storage, and permissions for that profile
- The Playwright version
- The `baseURL`
Server state is yours to isolate. Browser state is the runner's job.
:::

:::quiz
`test.use({ storageState })` in one file affects which tests?
- Every file in the project
+ The tests in that file, or in the describe where you called it
- Only the setup project
- Tests whose title contains "auth"
It is scoped. The locked-notes test lives in a file that does not opt in, so it still sees an empty jar.
:::

:::quiz
Why is Workshop Bench's order id derived from the customer name?
- So the id can be stored in a process-wide counter
+ So two parallel checkouts do not race on a shared sequence
- Because cookies cannot store numbers
- Playwright requires ids to be names
`BN-ARUN` is a pure function of the input. Parallel tests can both place an order and expect their own id.
:::
