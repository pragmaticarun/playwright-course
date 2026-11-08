---
number: 8
slug: browser-context-page
title: Browser, context, and page
module: Pages and contexts
minutes: 35
summary: Three objects, three lifetimes. The test fixture gives you a page. The browser is the process underneath.
source: Browser contexts | https://playwright.dev/docs/browser-contexts
source: Pages | https://playwright.dev/docs/pages
source: Browser | https://playwright.dev/docs/api/class-browser
source: BrowserContext | https://playwright.dev/docs/api/class-browsercontext
---

## Intuition

Think of three layers, because mixing them up causes the leaks you would never allow between processes.

The **browser** is the OS process: Chromium, Firefox, or WebKit. It is expensive. A worker reuses it across tests.

The **browser context** is an isolated profile inside that process. Cookies, `localStorage`, and permissions set in one context are invisible to another. Playwright's own docs compare it to a fresh browser profile. It is cheaper than launching a second browser. The runner gives every test its own context, then closes it. That is why test A cannot leave a login cookie for test B.

The **page** is a tab in a context. `page` in the test fixture is the first tab of that fresh context. `context.newPage()` opens another tab that shares cookies with the first. `browser.newContext()` opens a profile that shares nothing.

Most tests should touch `page` and stop. Reach for `browser` when you need a second profile in the same test, which is how you prove isolation. Reach for `context` when you need a second tab, storage state, or extra permissions.

## Worked example

`tests/isolation.spec.ts` adds adb on the fixture page, then opens a second context and expects an empty shelf.

```ts
test("shelf state stays inside one context", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add adb to shelf" }).click();
  await expect(page.getByRole("status")).toHaveText("Added adb to the shelf");

  const other = await browser.newContext();
  const fresh = await other.newPage();
  await fresh.goto("/shelf");
  await expect(fresh.getByText("The shelf is empty.")).toBeVisible();
  await other.close();
});
```

`page` and `fresh` are different profiles. `localStorage` for `http://127.0.0.1:4471` was written in the first profile only. Close the extra context. The fixture context closes itself. Leaking contexts in a loop is how a long suite dies of file descriptors.

A second page inside the same context would see the shelf, because `localStorage` is per origin per profile, and both tabs share the profile. Popups work that way: the new tab from `target="_blank"` belongs to the same context as the opener. The popup test uses `waitForEvent("popup")` and gets a `Page` already living in the caller's context.

:::callout compare
Processes versus contexts
Launching Chromium for every test is the expensive isolation, like forking a full Android emulator per case. A new context is the cheap isolation, like a fresh app profile with its own data directory. Use the cheap one unless you truly need a new process. The runner already picked the cheap one for you.
:::

## What you should not cache

Do not store a `page` on a global and reuse it across tests. The runner closes it. Do not store an element handle across a navigation. Locators, later, exist so you do not hold nodes. The browser object from the `browser` fixture is the one you may use during the test to make more contexts. You still do not keep it after the test returns.

Library scripts outside the runner look different:

```ts
import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
```

That is the same three layers, built by hand. Close them in reverse order when the script ends. Tests should stay on the fixtures so the runner can record traces and videos against the right objects.

:::exercise
### Who sees the cookie?

The maintainer login sets `bench_session` on the context that submitted the form. Test A logs in. Test B uses the default `page` fixture and opens `/maintainer`. What status does test B get, and why?

:::hint
Each test has its own context. The cookie is not in the browser process as a global.
:::

:::solution
Test B gets 403 and the "Notes are locked" page. The cookie died with test A's context. Sharing the login is what storage state is for, in a later lesson, and it is explicit.
:::
:::

:::exercise
### Second tab, same shelf

Write the lines that open a second page in the same context as `page`, after `page` has added rustc, and assert the shelf cell is visible there too.

:::hint
`page.context()` is the profile. `newPage()` on it shares storage.
:::

:::solution
```ts
const second = await page.context().newPage();
await second.goto("/shelf");
await expect(second.getByRole("cell", { name: "rustc" })).toBeVisible();
await second.close();
```
:::
:::

:::quiz
Which object owns cookies for a test?
- The browser process, shared by every test in the worker
+ The browser context
- The locator
- The Node process environment
Contexts are the profiles. Tests get a new one so cookies do not leak.
:::

:::quiz
A popup opened with `target="_blank"` lives where?
- In a new browser process
+ In the same browser context as the opener
- In the setup project
- Outside Playwright, so you cannot see it
`waitForEvent("popup")` returns that page. It shares cookies with the opener.
:::

:::quiz
Why does the runner prefer a new context over a new browser per test?
- Contexts are more isolated than processes
+ A context gives profile isolation without paying for another browser process
- Browsers cannot hold more than one page
- Contexts disable JavaScript
You still get a clean cookie jar and storage. You do not pay a full process start each time.
:::
