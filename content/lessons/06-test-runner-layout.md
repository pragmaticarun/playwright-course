---
number: 6
slug: test-runner-layout
title: The runner, the files, and your first expect
module: Setup
minutes: 35
summary: How a test file is discovered, what test and expect actually do, and the first assertion against Workshop Bench.
source: Getting started | https://playwright.dev/docs/intro
source: Running tests | https://playwright.dev/docs/running-tests
source: Assertions | https://playwright.dev/docs/test-assertions
source: Writing tests | https://playwright.dev/docs/writing-tests
---

## Intuition

`@playwright/test` is a test runner that knows how to launch browsers. A file full of `test(...)` calls is not executed by the browser. The runner, in Node, loads the file, launches a browser, and hands your function a `page`. The page is a remote control. The assertions run in Node and ask the browser questions until they pass or time out.

Discovery is by file name. This repo sets `testMatch` to `tests/**/*.spec.ts` and `projects/**/*.spec.ts`. `tests/auth.setup.ts` is not a spec. A separate project picks it up by a different pattern. If you name a file `notes.ts`, the runner ignores it. If you name it `notes.spec.ts` under `tests/`, it runs.

`test("name", async ({ page }) => { ... })` registers a case. The name is the only label you get in the report, so write the behavior, not "test 1". The argument in braces is a fixture. `page` is the one you want first. Fixtures are created for the test and torn down after it. You do not call `chromium.launch` in a normal test. The runner did that.

`expect(locator).toBeVisible()` returns a promise and retries. `expect(number).toBe(6)` does not retry. It checks once. The difference is the web-first assertion lesson. For this lesson, remember that locator assertions are the ones that wait, and value assertions are ordinary checks.

## Worked example

This is `tests/locators.spec.ts`, trimmed to the first assertion.

```ts
import { test, expect } from "@playwright/test";

test("role locators filter the catalog @cross", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Workshop Bench" })).toBeVisible();
});
```

`goto("/")` uses `baseURL` from the config, `http://127.0.0.1:4471`. The heading assertion retries until the h1 is visible. Run just this file:

```bash
npx playwright test tests/locators.spec.ts --project=chromium
```

The `@cross` tag in the title is how the Firefox and WebKit projects in this repo select a subset. `--grep @cross` does the same filter by hand. Tags are annotations the runner already understands. They are documented with the other annotations, and a later lesson uses them on purpose.

A failing assertion prints the locator, the timeout, and a snippet of the page. Read that before you add a sleep. If the heading text changed, the locator is wrong or the product is wrong. Both are useful outcomes. A sleep would only make the failure slower.

:::callout note
`test.only` is a local hammer
`test.only` runs one case and skips the rest. The config sets `forbidOnly` when `CI` is set, so a committed `test.only` fails the job instead of hiding the suite. Take it out before you push.
:::

## The report

The config writes a list reporter to the terminal and an HTML report to `playwright-report/`. The HTML report does not open by itself here (`open: "never"`) because a lab server has no reason to launch a browser window. Open it on your desktop with `npx playwright show-report` after a local run. The 1.65 `onlyFailures` option can keep that HTML report to unexpected results. This course leaves the full report on so you can see passes while you learn.

## A test that uses the request fixture

Not every check needs a page. `tests/api.spec.ts` asks `request.get("/api/packages")` and reads JSON. `request` is an API fixture, isolated like a page, with no browser paint. The API lesson goes deeper. The layout lesson is: fixtures arrive as arguments. You do not construct them with `new`.

:::exercise
### Run one file

From the repo root, run only `tests/smoke.spec.ts` on Chromium. How many tests ran, and did the web server start without a separate terminal?

:::hint
`webServer` in `playwright.config.ts` runs `node practice-app/server.js` when the port is down.
:::

:::solution
The command is `npx playwright test tests/smoke.spec.ts --project=chromium`. The runner starts Workshop Bench, hits `/health`, then runs the smoke cases. You should see the setup project first if the Chromium project depends on it, then the smoke tests. You did not need `npm run practice` in another shell.
:::
:::

:::exercise
### Name a test so the report is useful

Rewrite the title `"test 1"` for a case that opens `/forms`, fills Display name with "Arun", and expects the saved heading. Keep the title under one line.

:::hint
Say the behavior and the page. A tag is optional.
:::

:::solution
`saves a display name on the toolchain form` is enough. The file path already says `forms`. The report line should tell you what broke without opening the file.
:::
:::

:::quiz
Who launches the browser for a normal `test()` body?
- The first line of your test, always
+ The Playwright test runner, before your function runs
- The page, by downloading Chromium
- `npm start`
You receive `page` already pointed at a fresh context. Library-style `chromium.launch` is for scripts outside the runner.
:::

:::quiz
Which assertion retries until the timeout?
- `expect(2 + 2).toBe(4)`
+ `expect(page.getByRole("heading", { name: "Workshop Bench" })).toBeVisible()`
- `expect(response.status()).toBe(200)` after you already awaited the response
- A bare `if` statement
Locator matchers are web-first and retry. A number you already hold is checked once.
:::

:::quiz
Why does this repo fail CI when a file contains `test.only`?
- `only` was removed in 1.65
+ `forbidOnly` is set when `CI` is present, so a focused run cannot hide the suite
- The HTML reporter rejects it
- Tags and `only` conflict
`forbidOnly` is the guard. Locally, without `CI`, `test.only` still focuses the run, which is handy and dangerous.
:::
