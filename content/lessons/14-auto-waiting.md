---
number: 14
slug: auto-waiting
title: Auto-waiting and actionability
module: Waiting
minutes: 40
summary: Clicks wait until a control can be clicked. Inert elements, in Playwright 1.65, are not clickable.
source: Actionability | https://playwright.dev/docs/actionability
source: Auto-waiting | https://playwright.dev/docs/actionability#auto-waiting
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
---

## Intuition

You do not wait for a button to exist and then click. The click waits. Playwright calls that actionability. Before `click`, `fill`, `check`, `uncheck`, `selectOption`, `tap`, `hover`, or `press`, the runner waits until the target is attached, visible, stable, receives events, and is enabled. For check and select it also waits until the control is editable where that applies. If the conditions never arrive, the action throws a timeout that lists which check failed.

That list is the debugging tool. "Element is outside of the viewport" means scroll or layout. "Element is not enabled" means the disabled attribute. "Subtree intercepts pointer events" means a modal is covering the target. Screenshot the failure. The runner already attaches one on failure in this repo (`screenshot: "only-on-failure"`).

Stability means the box stopped moving. An animation that slides the button forever will time out. Workshop Bench does not animate. If your app does, wait for the animation to finish by asserting a final state, or mark the element stable by not animating it under test.

Playwright 1.65 adds a check: `click`, `check`, `tap`, `fill`, `clear`, and `selectOption` wait until the element is not inert. An `inert` attribute, or an ancestor with `inert`, used to be a place where hit testing was merely confusing. Now the action times out if the inert state stays. The lab page `/inert` puts "Save pin" inside `<div inert>`. A trial click fails until "Open panel" removes the attribute.

`trial: true` runs the actionability checks and does not perform the click. The waiting test uses it with a one-second timeout so the expected failure is cheap:

```ts
await expect(save.click({ trial: true, timeout: 1_000 })).rejects.toThrow();
```

After the panel opens, a normal `click` succeeds and the status becomes "Pin saved".

## Worked example

The filter click does not need a sleep between navigation and the button. `goto` finishes load. The button is in the first HTML. The click's actionability checks pass immediately. Then the assertion waits for adb to become hidden, which is a DOM update from the click handler, not a navigation.

```ts
await page.goto("/");
await page.getByRole("button", { name: "Rust", exact: true }).click();
await expect(page.getByRole("link", { name: "adb" })).toBeHidden();
```

If the click handler were delayed, `toBeHidden` would poll. The click itself would already have resolved, because actionability is about the click, not about the effect. Effects belong in assertions. This split is the whole design. Actions wait until they can happen. Assertions wait until the outcome is true.

`timeout` on an action overrides the action timeout for that call. The default action timeout comes from the config or from `page.setDefaultTimeout`. This repo sets `expect.timeout` to 5 seconds and the test timeout to 30 seconds. Do not set a 30 second timeout on a single click to hide a bug. Shorten the timeout when you are proving that an action cannot succeed.

:::callout compare
Spinlocks versus actionability
A C++ test that polls a flag with a sleep is a spinlock you wrote by hand. Actionability is the spinlock inside the tool, with a specific list of conditions and an error that names the failed one. You still write the outcome assertion yourself. You stop writing the "is it on screen yet" loop.
:::

## What actionability does not know

It does not know that the click had the effect you wanted. A button can be actionable and the handler can no-op. Assert the status text.

It does not wait for network responses unless the navigation is part of the action. A click that triggers `fetch` returns after the click is delivered. `expect` the status that the fetch fills in. The status page test does that: the paragraph starts as "Checking" and becomes "bench ok".

`force: true` skips the actionability checks. It is how you click a covered node. It is also how you pass a test while the user cannot click. Leave it out unless you are testing a hit-target bug on purpose.

:::exercise
### Open the inert panel

Write the steps that show "Save pin" is not actionable, then open the panel, click save, and expect the status "Pin saved". Use the id `#save-pin` and the button name "Open panel".

:::hint
A trial click with a short timeout should reject while `inert` is present. Remove the guesswork by waiting for `#panel-state`.
:::

:::solution
```ts
await page.goto("/inert");
const save = page.locator("#save-pin");
await expect(save.click({ trial: true, timeout: 1_000 })).rejects.toThrow();
await page.getByRole("button", { name: "Open panel" }).click();
await expect(page.locator("#panel-state")).toHaveText("Panel open");
await save.click();
await expect(page.locator("#panel-state")).toHaveText("Pin saved");
```
:::
:::

:::exercise
### Read a timeout

A click times out and the error says the element is visible, enabled, and "subtree intercepts pointer events." What is on the page, and would `force: true` be the fix?

:::hint
Something transparent or a dialog is covering the target.
:::

:::solution
A overlay is catching the pointer. The user cannot click the target either. Find and dismiss the overlay. `force: true` would make the test click through it and miss the bug.
:::
:::

:::quiz
Playwright 1.65 actions wait until the target is not what?
- `disabled` only
+ `inert`, including an inert ancestor
- `contenteditable`
- inside an iframe
The release notes name `click`, `check`, `tap`, `fill`, `clear`, and `selectOption`. An element that stays inert times out.
:::

:::quiz
Actionability guarantees which outcome?
- The click handler ran the right business logic
+ The click could be delivered to an attached, visible, stable, enabled target that receives events
- The next assertion will pass
- The network is idle
You still assert the effect. Actionability only gets the input to the control.
:::

:::quiz
`trial: true` on `click` does what?
- Double-clicks
+ Runs the actionability checks and does not click
- Disables strict mode
- Turns the click into a hover
The inert test uses a trial click to prove the control is not actionable without sending the click.
:::
