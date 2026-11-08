---
number: 9
slug: navigation-and-load
title: Navigation, URLs, and when a page is ready
module: Pages and contexts
minutes: 35
summary: goto, load states, redirects, and why "the document exists" is not "the shelf text exists".
source: Navigations | https://playwright.dev/docs/navigations
source: Page.goto | https://playwright.dev/docs/api/class-page#page-goto
source: Page.waitForURL | https://playwright.dev/docs/api/class-page#page-wait-for-url
---

## Intuition

`page.goto` starts a navigation and fulfills when the load state you asked for is reached. The default waits for the `load` event. That means the document and its subresources that block load have settled, not that your application has finished its own timers. Workshop Bench's `/delayed` page fires `load`, then half a second later replaces "Loading the shelf" with "Shelf ready". If you assert the ready text with a web-first expect, you are fine. If you read the text once, immediately, you will see the loading copy and blame the app.

`goto` accepts a path when `baseURL` is set. `goto("/forms")` is `http://127.0.0.1:4471/forms`. A full URL ignores the base. Use paths in this course so the port stays in the config.

Redirects count as the navigation. The maintainer login answers `303` to `/maintainer` and sets a cookie. `page.waitForURL("**/maintainer")` waits until the address is the notes page. Waiting for the URL is how you know the redirect finished. The setup project does exactly that before it saves storage state. A click that triggers a redirect can resolve before the new document is the one you meant. Wait for the URL or for a heading that exists only on the destination.

`goBack` and `reload` are navigations too. `reload` keeps the same context, so `localStorage` survives. The isolation test relies on that: add a tool, go to `/shelf` in the same page, and the row is there. A reload in the middle would still show it. A new context would not.

## Worked example

```ts
await page.goto("/delayed");
await expect(page.getByText("Loading the shelf")).toBeVisible();
await expect(page.getByText("Shelf ready")).toBeVisible();
```

The first assertion can pass immediately. The second retries past the timer. You did not configure `waitUntil`. You asserted the condition you care about. That is usually better than `waitUntil: "networkidle"`. Network idle means "no connections for a quiet period." An app with a heartbeat never goes idle. Workshop Bench does not need it. Prefer a heading, a URL, or a response.

When you care about a particular response, you can wait for it:

```ts
const responsePromise = page.waitForResponse("**/api/status");
await page.goto("/status");
const response = await responsePromise;
expect(response.ok()).toBeTruthy();
await expect(page.getByRole("status")).toHaveText("bench ok");
```

Arm the waiter before `goto` if the response might complete during the navigation. The same "register, then act" rule from the async lesson applies.

:::callout warn
`networkidle` is a blunt instrument
Playwright documents it and also warns that it is discouraged for chatty apps. A single analytics socket keeps the test waiting until the test timeout. Assert the text the user waits for.
:::

## History and the base URL

`page.url()` is the full address after redirects. Compare with `expect(page).toHaveURL(/\/maintainer$/)` rather than string-comparing a host you might change. The regex does not pin the port.

Hash URLs and `pushState` are still the same document. Workshop Bench does not use them. If your Android WebView app does, `waitForURL` still sees `pushState` changes, because Playwright watches the history API. A full `goto` is a document load. Know which one your app did before you pick a waiter.

:::exercise
### Wait for the notes page

After clicking "Unlock notes" with the fixture name and passphrase, write the assertion that the address ended at `/maintainer` and the heading is "Signing notes".

:::hint
`toHaveURL` retries. A heading assertion also retries. You can use either or both. The setup project uses `waitForURL`.
:::

:::solution
```ts
await page.getByRole("button", { name: "Unlock notes" }).click();
await page.waitForURL("**/maintainer");
await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
```
:::
:::

:::exercise
### Explain a flake

A test does `await page.goto("/delayed")` and then `expect(await page.locator("#state").textContent()).toBe("Shelf ready")`. It fails on a busy laptop and passes on a fast one. What is the race?

:::hint
`textContent()` resolves once. It does not retry. `goto` did not wait for the 500ms timer.
:::

:::solution
The locator read the node during "Loading the shelf". `expect` compared a string it already had, so it could not wait. Use `await expect(page.locator("#state")).toHaveText("Shelf ready")`, which retries the read.
:::
:::

:::quiz
The default `page.goto` fulfills on which event?
- The first byte of HTML
+ The load event
- The next animation frame
- `networkidle`
Subresources that participate in load are in. Your `setTimeout` is not.
:::

:::quiz
Why is `networkidle` a poor default for a page with a websocket heartbeat?
- It ignores websockets
+ The page never stays quiet, so the waiter runs until timeout
- It only works on Firefox
- It clears cookies
Idle means a quiet network. A heartbeat is not quiet.
:::

:::quiz
`page.goto("/shelf")` with a base URL set goes where?
- `file:///shelf`
+ `baseURL` joined with `/shelf`
- The previous page, reloaded
- `about:blank`
The config owns the origin. The test owns the path.
:::
