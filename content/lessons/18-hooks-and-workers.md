---
number: 18
slug: hooks-and-workers
title: Hooks, worker scope, and test info
module: Fixtures and config
minutes: 35
summary: beforeEach versus fixtures, worker hooks, and the testInfo object that names output paths.
source: Hooks | https://playwright.dev/docs/api/class-test#test-before-each
source: TestInfo | https://playwright.dev/docs/api/class-testinfo
source: Parallelism and workers | https://playwright.dev/docs/test-parallel
---

## Intuition

Hooks are functions the runner calls around tests. `test.beforeEach` runs before each test in the file or describe. `test.afterEach` runs after, including on failure. `beforeAll` and `afterAll` run once per worker per scope, not once per machine. If four workers each load the file, `beforeAll` runs four times. That surprises people who think "all" means "process." In Playwright, all means "this worker's copy of this suite."

Hooks are the right tool for a side effect every test in a file needs, such as logging the test title. They are the wrong tool for an expensive login that only two tests need. That is a fixture. They are also the wrong tool for cleanup that must be paired with a specific resource. The fixture's code after `use` is paired by construction. An `afterEach` that closes "the" context is easy to get wrong when one test opened two.

`test.info()` returns `TestInfo` for the running test. You can also accept it as a second argument: `async ({ page }, testInfo) =>`. Useful fields: `title`, `outputPath(...)`, `attach`, `project.name`, `retry`, and `parallelIndex`. `outputPath` is a file inside the test's output directory. The runner deletes and recreates that area. Write screenshots and JSON dumps there, not into the repo root.

`testInfo.attach` adds a blob to the report. The accessibility lesson attaches axe JSON this way. Attachments are how you keep evidence without a side channel.

`parallelIndex` is the worker's index, from 0 to workers-minus-one. The auth guide uses it to pick a distinct account per worker. It is stable for the life of the worker, not for the life of one test. Two tests on the same worker see the same index, possibly one after the other.

## Worked example

A beforeEach that fails fast on the wrong project, and an attachment:

```ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "lab", description: "workshop-bench" });
  await page.goto("/");
});

test("catalog heading", async ({ page }, testInfo) => {
  await expect(page.getByRole("heading", { name: "Workshop Bench" })).toBeVisible();
  await testInfo.attach("url", {
    body: page.url(),
    contentType: "text/plain",
  });
});
```

The annotation shows up in the report next to the test. You do not need a custom reporter to see it. `beforeEach` navigating to `/` means each test starts on the catalog. A test that wanted `/forms` would `goto` again. If every test in the file wants a different URL, do not put `goto` in the hook. Let each test say where it starts. Hooks that surprise the reader are worse than repeated `goto` lines.

`test.afterEach` can attach a shelf dump when the test failed:

```ts
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const shelf = await page.evaluate(() => localStorage.getItem("bench-shelf"));
    await testInfo.attach("shelf", { body: shelf ?? "null", contentType: "application/json" });
  }
});
```

`status` versus `expectedStatus` treats an expected failure (`test.fail`) correctly. Attach on unexpected outcomes only, or the report fills with noise.

:::callout note
beforeAll and the server
`beforeAll` shares a worker with the tests that follow it on that worker. It must not leave a page open for them unless you meant to. It also must not assume it is the only `beforeAll` on the machine. Another worker is running the file too when the suite is parallel.
:::

## describe scopes hooks

`test.describe("maintainer", () => { test.use(...); test.beforeEach(...); test("..."); })` limits the hook and the option to that group. The auth dashboard project does this with `test.use` so the locked-out test in the same file does not load the cookie. A `beforeEach` inside that describe would also stay inside it. A `beforeEach` at file scope wraps both.

`test.describe.configure({ mode: "parallel" })` is the default when the config is `fullyParallel`. `mode: "serial"` runs the group in order on one worker and skips the rest after a failure. Use serial for a wizard that cannot be reordered. The lab's tests are independent, so they stay parallel.

:::exercise
### Attach the status text on failure

Write an `afterEach` that, only when the test did not meet its expected status, attaches the text of `[role=status]` as `text/plain`. Ignore pages that lack the node.

:::hint
`textContent` on a missing locator resolves to null if you use a short timeout or count first. A simple `locator.count()` avoids a long wait.
:::

:::solution
```ts
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const status = page.getByRole("status");
  if (await status.count()) {
    await testInfo.attach("status", {
      body: (await status.first().textContent()) ?? "",
      contentType: "text/plain",
    });
  }
});
```
:::
:::

:::exercise
### Worker index

Two workers run the suite. Why is `parallelIndex` a bad unique id for a single test, and a good unique id for an account?

:::hint
The index names the worker, and a worker runs many tests one after another.
:::

:::solution
Many tests share a worker, so they share an index. An account per worker is reused safely only if those tests can share the account. A unique id per test should include `testInfo.testId` or a name you generate inside the test, not the worker index alone.
:::
:::

:::quiz
`beforeAll` runs how often?
- Once on the whole CI machine
+ Once per worker that loads that scope
- Once per expect
- Never under `fullyParallel`
Each worker is a process with its own copy of the hooks.
:::

:::quiz
Where should a test write a scratch JSON file?
- The repository root
+ `testInfo.outputPath("dump.json")`
- `/tmp` with a fixed name shared by all tests
- `playwright/.auth`
`outputPath` is unique to the test run's output directory. A fixed `/tmp` name races under parallel workers.
:::

:::quiz
Hooks versus fixtures: which is lazy?
- `beforeEach`, because it can return early
+ A fixture, because it runs only if the test requests it
- Both are lazy
- Neither; both always run
Declaring `{ page }` requests the page fixture. A custom fixture is requested the same way. `beforeEach` does not look at the argument list.
:::
