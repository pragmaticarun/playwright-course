---
number: 7
slug: config-and-projects
title: Configuration, projects, and the three browsers
module: Setup
minutes: 40
summary: One playwright.config.ts, a base URL, a webServer, and projects that share a setup dependency.
source: Configuration | https://playwright.dev/docs/test-configuration
source: Projects | https://playwright.dev/docs/test-projects
source: Test web server | https://playwright.dev/docs/test-webserver
source: Emulation devices | https://playwright.dev/docs/emulation
---

## Intuition

`playwright.config.ts` is the makefile for the suite. It says where tests live, which browsers exist, how long to wait, and how to boot the app. Scattering that across shell aliases means the CI job and your laptop disagree. One config file is the contract.

A project is a named configuration slice: a browser, a grep, a dependency. This repo has four. `setup` runs `tests/auth.setup.ts` and writes `playwright/.auth/maintainer.json`. `chromium` depends on `setup` and runs every spec. `firefox` and `webkit` depend on `setup`, and their `grep` is `/@cross/`, so they run the tagged subset rather than the visual baseline. The baseline image is Linux Chromium. Running it on WebKit would fail for font reasons, not for product reasons.

`use.baseURL` is `http://127.0.0.1:4471` unless `BENCH_URL` overrides it. Tests call `page.goto("/")` and the runner joins the base. `webServer` starts `node practice-app/server.js` and waits until `/health` returns. `reuseExistingServer` is true outside CI so a server you already started for clicking around is left alone. In CI it is false, so the job owns the process.

`fullyParallel: true` lets tests in one file run together. That is safe here because Workshop Bench does not keep a server-side cart. The shelf is per browser context. If you add a global counter on the server, you will have to revisit this flag.

## Worked example

The shape, cut down from the real file:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/**/*.spec.ts", "projects/**/*.spec.ts"],
  use: { baseURL: "http://127.0.0.1:4471", trace: "on-first-retry" },
  webServer: {
    command: "node practice-app/server.js",
    url: "http://127.0.0.1:4471/health",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

`devices["Desktop Chrome"]` fills viewport, user agent, and `defaultBrowserType`. Spreading it into `use` is the documented way to describe a desktop browser. It does not download Chrome the product. It drives the Chromium build Playwright installed. A channel build, `channel: "chrome"`, is a separate choice when you need the branded browser. This course does not require it.

Retries are 0 locally and 2 when `CI` is set. A retry that passes is a flake, and the report says so. Do not hide a race by setting retries to 2 on your laptop. Fix the wait.

Timeouts: the test timeout is 30 seconds, the expect timeout is 5 seconds. A single `toBeVisible` gives up after 5 seconds, not 30. The test timeout is the budget for the whole body. The inert example uses a shorter timeout on a trial click so the expected failure stays near one second.

:::callout compare
CMake presets versus Playwright projects
A CMake preset pins a compiler and flags. A Playwright project pins a browser and a grep. You do not copy the test to run it on Firefox. You add a project. The test body stays one copy, which is the only way the three browsers stay honest.
:::

## Commands you will actually type

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox --project=webkit
npx playwright test tests/api.spec.ts --project=chromium
```

`--project` selects by name. Passing two projects runs both. The setup project runs because of `dependencies`, even when you did not name it, as long as the selected project depends on it.

1.65 changes one sharding default you should know before CI: a sharded run fails with "No tests found" if no shard has tests. An empty individual shard still passes when some other shard has tests. `--pass-with-no-tests` opts into the old loose behavior. This course does not shard by default. The parallelism lesson shows the flag.

:::exercise
### Point a test at the lab without a hard-coded host

Write a `goto` that opens the toolchain form using the configured base URL. Then say which config field you would change to move the whole suite to port 4472.

:::hint
`goto` accepts a path. The port lives in one place.
:::

:::solution
```ts
await page.goto("/forms");
```
Change `use.baseURL` and `webServer.url`, and the server's `PORT` if you also change `practice-app/server.js`. `BENCH_URL` overrides the base URL in this repo's config if you only need the client side pointed elsewhere.
:::
:::

:::exercise
### Why the screenshot project is Chromium-only

`tests/visual.spec.ts` calls `test.skip(browserName !== "chromium", ...)`. The Firefox project also greps for `@cross`, and this test has no such tag. Name both reasons it does not run on Firefox.

:::hint
One reason is the tag filter. The other is inside the test, in case someone runs it with a browser name anyway.
:::

:::solution
The Firefox project `grep` is `/@cross/`, and the visual test title has no `@cross` tag, so the project never schedules it. If it did run, `test.skip` would skip whenever `browserName` is not `chromium`, because the committed PNG is a Linux Chromium baseline.
:::
:::

:::quiz
What does `webServer` wait for before tests start?
- Any open TCP port
+ The `url` you configured, here `/health` returning success
- The string "Workshop Bench" in a log file
- A human to press Enter
The runner polls that URL. `/health` answers `ok` with status 200.
:::

:::quiz
A project `dependencies` array means what?
- Those projects run in parallel with this one
+ Those projects finish before this project's tests start
- npm installs those package names
- The tests are skipped
`setup` writes the storage state. Chromium tests that read the file would race if setup were not a dependency.
:::

:::quiz
`devices["Desktop Chrome"]` selects which browser build?
- Installed Google Chrome, always
+ Playwright's Chromium, with a desktop Chrome-like profile
- Firefox, with a Chrome user agent only
- WebKit
The device descriptor sets `defaultBrowserType` to chromium along with viewport and user agent. Branded Chrome is `channel: "chrome"`.
:::
