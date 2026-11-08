---
number: 4
slug: async-javascript
title: Async JavaScript without the mystery
module: Prerequisites
minutes: 40
summary: Promises, the event loop, and why await is not a blocked thread. Every Playwright call you care about returns a promise.
source: Promises | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
source: async function | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
source: The event loop | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
source: Playwright page | https://playwright.dev/docs/pages
---

## Intuition

Node runs your test on one JavaScript thread. `await` does not block that thread the way a C++ `recv` blocks an OS thread. It pauses the async function and lets the event loop run other work: timers, I/O callbacks, and the other tests Playwright scheduled on other workers. Those other workers are other processes, which you will meet later. Inside one test, `await` is "continue this function when the promise settles."

A promise is a value that is already finished or will finish. It settles by fulfilling with a result or rejecting with an error. `page.goto("/forms")` returns a promise. If you forget `await`, the function races on and clicks a form that is not there yet. The click returns its own promise. That promise rejects, often with a timeout, and if you also forgot to await the click, the rejection may surface as an unhandled rejection instead of a clean test failure. Await both.

`async` marks a function that returns a promise. `async ({ page }) => { ... }` is the test body. Thrown errors inside it reject that promise. Playwright turns the rejection into a failed test. You do not need `.catch` on every line. You need `await`, and you let the failure propagate.

Promise combinators matter when work is independent. `Promise.all` waits for every promise and rejects if one rejects. Use it for two downloads you really can start together. Do not use it to click and assert the same button in a made-up parallel pair. Most UI steps are ordered: fill, then click, then expect. Sequential `await` is the honest model.

`page.waitForEvent("dialog")` and `page.waitForEvent("popup")` are promises that must be created before the click that opens the dialog or popup. The event can fire in the same turn as the click. If you click first and then wait, you can miss it. That is a race, the same family as reading a socket before you have registered the callback. The frames lesson shows the pattern. The rule belongs here because it is an async rule, not a dialog rule.

## Worked example

The delayed shelf sets its text after 500 milliseconds. The test does not sleep.

```ts
await page.goto("/delayed");
await expect(page.getByText("Shelf ready")).toBeVisible();
```

`goto` fulfills when the navigation reaches the load state Playwright is using. The timer in the page has been scheduled. The assertion polls until the text is visible or the expect timeout hits. You did not write `setTimeout` in the test. Polling belongs inside `expect`, which is the next cluster of lessons. The async fact is: the assertion's promise stays pending while the event loop lets the page's timer run.

A dialog needs the waiter first:

```ts
const dialogPromise = page.waitForEvent("dialog");
await page.getByRole("button", { name: "Show shelf alert" }).click();
const dialog = await dialogPromise;
await dialog.accept();
```

`waitForEvent` registers immediately and returns a promise. The click is awaited next. Then you await the dialog promise, which may already be fulfilled. Awaiting a fulfilled promise continues on a later microtask. That is fine.

:::callout compare
Threads versus the event loop
A blocked C++ thread waits inside the kernel. An async JavaScript function waits in userland, and the thread keeps draining the queue. CPU-bound work in the test process, such as a huge synchronous loop, stalls every promise in that worker. Keep tests awaiting I/O. Leave heavy compiles to cargo and cmake, outside the test.
:::

## Mistakes that look like product bugs

Forgetting `await` on `page.goto` is the classic. The second is awaiting a locator property that is not a promise. `page.getByRole("button")` returns a locator now, synchronously. The click is the promise. The third is wrapping a timeout around a click "to be safe." A fixed sleep hides a race until the CI machine is slower. Wait for a condition: a URL, a role, a response. The waiting lessons show the built-in way.

`void page.click(...)` on purpose is almost never what you want in a test. If you see a floating promise, await it.

:::exercise
### Order the popup

`/popup` has a link named "Open bench note" that opens a tab. Write the three awaits: arm `waitForEvent("popup")`, click the link, then expect the heading "Bench note" on the popup page.

:::hint
Store the promise from `waitForEvent` before the click. The popup page is the value that promise fulfills with.
:::

:::solution
```ts
await page.goto("/popup");
const popupPromise = page.waitForEvent("popup");
await page.getByRole("link", { name: "Open bench note" }).click();
const popup = await popupPromise;
await expect(popup.getByRole("heading", { name: "Bench note" })).toBeVisible();
await popup.close();
```
:::
:::

:::exercise
### Find the missing await

This test fails intermittently. Why?

```ts
test("broken", async ({ page }) => {
  page.goto("/forms");
  await page.getByLabel("Display name").fill("Arun");
});
```

:::hint
`goto` returns a promise. Nothing waits for it. `fill` races the navigation.
:::

:::solution
Await the navigation: `await page.goto("/forms")`. Then fill. The intermittent part is the race: on a warm cache the document can be ready before `fill` runs, and on a cold start it is not.
:::
:::

:::quiz
What does `await` do to the JavaScript thread?
- Blocks the thread in the kernel until the browser replies
+ Pauses that function and lets the event loop run other queued work
- Spawns a worker thread for the rest of the test
- Compiles the next TypeScript file
The thread stays available for I/O and timers. The function resumes when the promise settles.
:::

:::quiz
Why arm `waitForEvent("dialog")` before the click?
- Dialogs only work on WebKit
+ The event can fire before the line after the click runs, so a late waiter misses it
- `click` does not return a promise
- The dialog promise replaces `await`
Register, then act, then await the event. The same order is used for downloads and popups.
:::

:::quiz
`page.getByRole("button", { name: "Save preferences" })` returns what, before you click?
- A promise of a DOM node
+ A locator, synchronously
- The accessible name as a string
- `undefined` until the page loads
The locator is a description. It does not query yet. `click()` and the expect matchers are the calls that return promises and re-query.
:::
