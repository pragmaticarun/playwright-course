---
number: 5
slug: install-on-ubuntu
title: Install Playwright on Ubuntu
module: Setup
minutes: 30
summary: Node 22, the npm packages pinned by this course, and the system libraries WebKit still needs on a fresh Ubuntu box.
source: Installation | https://playwright.dev/docs/intro
source: System requirements and browsers | https://playwright.dev/docs/browsers
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
source: playwright on npm | https://www.npmjs.com/package/playwright
---

## Intuition

Playwright is two downloads. The npm package is the library and the test runner. The browser binaries are a second download, version-locked to that package, stored under the Playwright cache and not inside `node_modules`. Upgrading the package without reinstalling browsers gives you a runner that refuses to launch. That split is why `npm install` is not the whole setup.

This course pins `@playwright/test` at 1.65.0, released 5 November 2026. The npm page for `playwright` shows the same version. 1.65 ships Chromium 158.0.8127.18, Firefox 159.0, and WebKit 27.2, and it was also checked against Google Chrome 157 and Microsoft Edge 156. Those are the browser builds the runner expects. Your distro's `firefox` package is a different binary. Do not point the course tests at it unless you are deliberately testing a channel.

Supported operating systems for 1.65 include Ubuntu 22.04, 24.04, and 26.04 on x86-64 or arm64. Supported Node lines are 22, 24, and 26. Node 20 is no longer in the test matrix. Check both before you debug a test.

## Worked example

From the course repository, with Node 22:

```bash
npm ci
npx playwright install chromium firefox webkit
npx playwright --version
```

`npm ci` installs the lockfile, including `@playwright/test@1.65.0` and `@axe-core/playwright@4.14.0`. `npx playwright install` downloads the three browsers that match 1.65.0. The version command should print `Version 1.65.0`.

WebKit on a minimal Ubuntu image needs system libraries the runner does not vendor: in this environment the launch error named `libxslt1.1`, `libevent-2.1-7t64`, GStreamer, `libavif16`, `libharfbuzz-icu0`, Wayland server, `libmanette`, and `libhyphen`. Chromium and Firefox launched here before those packages were installed. WebKit did not. The official remedy is:

```bash
sudo npx playwright install-deps
```

`sudo` on some machines does not see `npx` because it resets `PATH`. If you get `sudo: npx: command not found`, install the apt packages the error lists, or run `sudo env PATH="$PATH" npx playwright install-deps`. The CI workflow in this repo uses `npx playwright install --with-deps`, which is the right line on GitHub-hosted Ubuntu where sudo works inside the job.

:::callout note
Headless is the default for the test runner
The test runner launches headless browsers. You do not need a desktop session on the lab machine. UI mode and the Inspector do need a display, or a remote one. The debugging lesson covers that. Installing browsers and running `npx playwright test --project=chromium` does not.
:::

## What got installed

`@playwright/test` is the runner: `test`, `expect`, config, reporters. It depends on `playwright`, which is the automation library. You can drive a browser from a plain script with the library and no test runner. This course uses the runner because it gives you isolation, parallel workers, and assertions that retry. The MCP server is a third package, `@playwright/mcp`, pinned in the later lessons at 0.0.84. Do not install it yet. It is not required to run the suite.

The cache lives under `~/.cache/ms-playwright` on Linux. Deleting `node_modules` does not delete browsers. Deleting the cache forces a fresh download, which is the right move when a binary is corrupt, and the wrong move on a metered link.

:::exercise
### Read your own version

On your machine, run `node -v` and `npx playwright --version`. Write down whether Node is 22, 24, or 26, and whether Playwright prints 1.65.0. If Node is 20, install 22 before you continue.

:::hint
`nvm`, `fnm`, or the NodeSource packages can install 22 beside the system Node. The course does not require a particular installer.
:::

:::solution
A passing pair looks like `v22.x` and `Version 1.65.0`. Anything else means you are not on the line this course tested. Match the pin before you compare failures with the lesson text.
:::
:::

:::exercise
### Explain the two downloads

A classmate ran `npm ci` and then `npx playwright test`. Chromium will not launch and the error mentions a missing executable. They did not run one command. Which one?

:::hint
The npm package does not contain the browser binaries.
:::

:::solution
They skipped `npx playwright install`. The runner is present. The browser build that 1.65.0 expects is not in the cache.
:::
:::

:::quiz
Which Node.js versions does Playwright 1.65 list as tested?
- 18 and 20
+ 22, 24, and 26
- 20 and 22 only
- Whatever `apt` calls `nodejs`
The release notes drop Node 20 from the test matrix and point at the system requirements for 22, 24, and 26.
:::

:::quiz
Where do the browser binaries live after `npx playwright install` on Linux?
- Inside `node_modules/playwright`
+ Under the Playwright cache, `~/.cache/ms-playwright`
- In `/usr/bin`, replacing distro Firefox
- Next to each test file
The cache is outside `node_modules`. Reinstall browsers when you change the Playwright version.
:::

:::quiz
Why might WebKit fail to launch after a successful `playwright install`?
- WebKit was removed in 1.65
+ The OS is missing shared libraries such as libxslt and GStreamer
- Firefox must be installed first
- The test file imported `webkit` incorrectly
The browser bits can be present while `ld` still misses system packages. `playwright install-deps` or the apt list in the error is the fix.
:::
