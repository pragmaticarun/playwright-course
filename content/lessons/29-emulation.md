---
number: 29
slug: emulation
title: Cross-browser projects, devices, and emulation
module: Scale
minutes: 35
summary: The same test on Chromium, Firefox, and WebKit, plus viewport, color scheme, and geolocation when the product actually branches.
source: Emulation | https://playwright.dev/docs/emulation
source: Browsers | https://playwright.dev/docs/browsers
source: Projects | https://playwright.dev/docs/test-projects
---

## Intuition

Cross-browser testing means one test body and several projects. You already have that. Chromium, Firefox, and WebKit are the three engines. A bug that exists only in WebKit is the reason the third project is not a luxury. A layout that wraps only at 390 pixels is a viewport question, not a browser question. Do not confuse them.

`devices["Desktop Chrome"]` sets a viewport, a user agent, and the chromium browser type. `devices["Pixel 7"]` sets a phone viewport, touch, a mobile user agent, and chromium. `devices["iPhone 14"]` pairs a phone viewport with WebKit. Pick the device that matches the engine. A Pixel device descriptor on the WebKit project is a confused phone.

This course runs the `@cross` subset on Firefox and, when the machine has WebKit's system libraries, on WebKit. The full suite, including upload, download, inert, and the screenshot, runs on Chromium. That split is cost, not a claim that Firefox cannot upload. Extend the tag when you care.

Emulation options you will use rarely and should know:

- `viewport` and `screen` for layout
- `colorScheme: "dark"` for `prefers-color-scheme`
- `geolocation` plus `permissions: ["geolocation"]` when the app reads location
- `locale` and `timezoneId` when formatting depends on them
- `javaScriptEnabled: false` almost never; the lab's shelf needs script

Workshop Bench does not read geolocation. Do not grant the permission "just in case." Permissions are part of the test's claim about the product.

## Worked example

A project, not a copy of the tests:

```ts
{
  name: "firefox",
  dependencies: ["setup"],
  grep: /@cross/,
  use: { ...devices["Desktop Firefox"] },
}
```

A single test with a narrow viewport, still on the current project:

```ts
test.describe("narrow catalog", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("heading remains visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Workshop Bench" })).toBeVisible();
  });
});
```

`test.use` inside `describe` overrides the project viewport for that group. The heading assertion does not prove the layout is good. It proves the page is usable at that size. A visual test would be the pixel proof, and you would keep a separate baseline name per viewport.

Color scheme for a page that themes with CSS:

```ts
test.use({ colorScheme: "dark" });
```

The lab's CSS does not branch on color scheme. The course site does, in the browser, via a class on `html`. Playwright's `colorScheme` option sets the media query. It does not add the class. Know which mechanism the app uses before you emulate it.

:::callout compare
Emulator images versus device descriptors
An Android emulator is a system image and a skin. A Playwright device descriptor is a viewport, a user agent, and touch flags inside a desktop browser engine. It is not an Android WebView and it is not iOS. Use it for responsive layout. Use a device lab when the bug is in the WebView itself.
:::

## Channels

`channel: "chrome"` launches installed Google Chrome. `channel: "msedge"` launches Edge. 1.65 was tested against Chrome 157 and Edge 156 as channels, and against its own Chromium 158.0.8127.18. The bundled Chromium is the reproducible one, because CI does not depend on whatever Chrome the developer installed. Use a channel when you are chasing a bug that only the branded browser shows.

Headless versus headed is orthogonal. The new headless Chromium is the default the runner uses. `--headed` is for your eyes. Do not make CI headed.

:::exercise
### Add a phone project on Chromium

Write a project named `pixel` that uses `devices["Pixel 7"]`, depends on setup, and greps `@cross`. Do not copy spec files.

:::hint
Spread the device into `use`. Keep the dependency so storage state exists for tagged auth tests.
:::

:::solution
```ts
{
  name: "pixel",
  dependencies: ["setup"],
  grep: /@cross/,
  use: { ...devices["Pixel 7"] },
}
```
:::
:::

:::exercise
### Media query versus class

The course site toggles dark mode by adding `class="dark"` on `html`, stored in `localStorage`. Will `test.use({ colorScheme: "dark" })` flip that class? What would?

:::hint
`colorScheme` sets `prefers-color-scheme`. The site also checks that media query only when no `bench-theme` key is stored, and it does so from a small script.
:::

:::solution
It can, on a fresh context, because the theme script honors the media query when `localStorage` has no `bench-theme` key. If a previous step set the key to `light`, the class stays light. Set the key explicitly with `addInitScript`, or clear storage, if the test's subject is the class.
:::
:::

:::quiz
A device descriptor is:
- A full Android emulator
+ A set of Playwright options: viewport, user agent, touch, and browser type
- A screenshot baseline
- A replacement for `getByRole`
It emulates the environment the engine reports. It does not boot another operating system.
:::

:::quiz
Why is the committed suite's broad run on Chromium?
- Firefox cannot run locators
+ Chromium is the reproducible bundled engine for the full set; Firefox and WebKit run the tagged subset when you ask
- WebKit was removed
- Projects cannot share tests
The bodies are shared. The projects choose how much of the set each engine runs.
:::

:::quiz
`channel: "chrome"` differs from the default project because:
- It uses WebKit
+ It launches the installed Google Chrome instead of Playwright's Chromium build
- It disables JavaScript
- It cannot run headless
The pin you can reproduce in CI is the bundled Chromium. The channel is the branded browser.
:::
