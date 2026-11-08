---
number: 31
slug: ci-and-reporting
title: CI, reporters, and GitHub Actions
module: Scale
minutes: 40
summary: A GitHub Actions workflow that installs browsers with dependencies, runs the suite, and uploads the HTML report. Plus the Pages workflow beside it.
source: CI | https://playwright.dev/docs/ci
source: GitHub Actions guide | https://playwright.dev/docs/ci-intro
source: Reporters | https://playwright.dev/docs/test-reporters
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
---

## Intuition

CI is the same command as your laptop, on a machine that forgets its disk every run. The workflow must install npm dependencies from the lockfile, install the browser binaries and their system libraries, then run `npx playwright test`. Caching `node_modules` without caching the Playwright browser cache will still download browsers. That is acceptable. Skipping `playwright install` is not.

This repo ships two workflows. `.github/workflows/playwright.yml` runs the tests. `.github/workflows/pages.yml` builds the static course and publishes it with GitHub Pages actions. They are separate because a docs site and a browser suite fail for different reasons. A failed test should not be hidden inside a Pages deploy, and a docs typo should not be the only signal that WebKit is broken.

The HTML reporter writes `playwright-report/`. Upload it as an artifact on failure and on success, with `if: ${{ !cancelled() }}`, so a cancelled job does not bother and a failed job still has the report. Download it from the Actions run and open it locally with `npx playwright show-report` if you need, or just unzip and open `index.html`. Traces inside the report are the replay from the retry.

1.65's `failures` reporter prints failures as they happen, without the progress dots. `onlyFailures: true` on the HTML reporter drops the passed tests from the file. Use that when the artifact is too big. The committed workflow in this course uploads the full report so you can see what did run.

## Worked example

The test job, aligned with Playwright's CI guide and this repo's Node line:

```yaml
name: Playwright tests
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

`npm ci` requires the lockfile. `--with-deps` is the CI form of the apt install you may have done by hand for WebKit. The job timeout is a backstop so a hung browser does not burn the runner for hours. Playwright's own test timeout still fires first for a single case.

`forbidOnly` is on when `CI` is set. GitHub Actions sets `CI`. A `test.only` someone committed fails the job. Retries are 2 when `CI` is set, so the trace-on-first-retry has a second attempt to record.

The Pages workflow builds with `BASE_PATH` set to `/<repository name>`, which is the project-site path `https://<user>.github.io/<repo>/`. A user site whose repository is `<user>.github.io` must build with an empty `BASE_PATH` because it is served from `/`. The deployment doc in `docs/github-pages.md` spells that out. This lesson only needs you to see that the base path is a build-time value. Next inlines it. Changing the repository name means rebuilding.

:::callout note
Do not print secrets in the log
The lab passphrase is a fixture and may appear in `auth.setup.ts`. A real password belongs in an Actions secret, read into the setup step's environment, and must not be echoed. The reporter will also capture it if your test types it and tracing is on. The MCP lesson treats that class of leak in more detail.
:::

## Reporters worth knowing

`list` is the terminal dots and names. `line` is a single updating line, nicer on CI logs that charge by the line. `html` is the artifact. `github` annotates the pull request with failure snippets. `junit` feeds dashboards. You can pass several:

```ts
reporter: process.env.CI
  ? [["github"], ["html", { open: "never" }]]
  : [["list"], ["html", { open: "never" }]],
```

The blob reporter plus `npx playwright merge-reports` combines sharded HTML reports. Use it when you shard and still want one report. 1.65 fixed the blob reporter so it clears its output directory again before writing. Do not store extra files in that directory and expect them to survive.

`PLAYWRIGHT_HTML_REPORT` and the config `outputFolder` choose the directory. This repo uses `playwright-report`. The upload path must match.

:::exercise
### Explain a red job with no browsers

The workflow runs `npm ci` and `npx playwright test` but never `playwright install`. What fails, and which line do you add?

:::hint
The npm package does not contain browser binaries. CI machines have an empty cache.
:::

:::solution
The runner errors because the browser executable is missing. Add `npx playwright install --with-deps` before the test step so Linux libraries and binaries are both present.
:::
:::

:::exercise
### Pick a base path

The repository is `playwright-bench` and the site is a project page, not a user page. What `BASE_PATH` should the Pages build use?

:::hint
Project pages are served under `/<repo>/`.
:::

:::solution
`BASE_PATH=/playwright-bench`. An empty base path would make asset URLs point at the domain root, and the project site would 404 on CSS and JS.
:::
:::

:::quiz
`npx playwright install --with-deps` on CI is for:
- Updating `@playwright/test` to latest
+ Installing browser binaries and the system libraries they need
- Starting UI mode
- Publishing GitHub Pages
The version comes from the lockfile. The install command fetches the matching browsers.
:::

:::quiz
A flaky result in CI means:
- The reporter is broken
+ A retry passed after a failure, and the race is still there
- `forbidOnly` fired
- The shard was empty
Read the trace from the retry. Do not raise the retry count and move on.
:::

:::quiz
GitHub Actions sets `CI`, which this config uses to:
- Skip tests
+ Turn on `forbidOnly` and retries
- Disable traces forever
- Force WebKit only
Local runs stay strict about retries so you see the first failure. CI retries so the artifact has a trace.
:::
