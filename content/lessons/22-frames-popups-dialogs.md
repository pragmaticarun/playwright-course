---
number: 22
slug: frames-popups-dialogs
title: Frames, popups, and native dialogs
module: Interactions
minutes: 40
summary: frameLocator for iframes, waitForEvent for popups and dialogs, and why the parent page cannot see the frame's text.
source: Frames | https://playwright.dev/docs/frames
source: Dialogs | https://playwright.dev/docs/dialogs
source: Pages, popups | https://playwright.dev/docs/pages#handling-popups
---

## Intuition

Three kinds of "another document" show up in browser tests, and they are not the same object.

An **iframe** is a document inside the page. Locators on `page` do not cross into it. `frameLocator` returns a locator scoped to that frame. You pick the frame by a user-facing hook, usually the iframe's `title` or a test id. Workshop Bench's frame is `iframe[title="Release notes"]` because the title is the accessible name of the frame. Inside it, roles work as usual.

A **popup** is another page in the same context, opened by `window.open` or `target="_blank"`. It is not a frame. `waitForEvent("popup")` yields a `Page`. You assert on that page and close it.

A **dialog** is the browser's modal `alert`, `confirm`, or `prompt`. It is not a DOM node. There is no role to click. The page's JavaScript is blocked until the dialog is accepted or dismissed. If your test never handles it, the click that triggered it hangs until timeout. You must register `page.on("dialog")` or `page.once` before the trigger. Playwright has a default handler that dismisses unexpected dialogs in some versions' configurations; do not rely on a default when the dialog's text is the assertion. Handle it yourself so the choice is visible.

## Worked example

Frame:

```ts
await page.goto("/frames");
const notes = page.frameLocator('iframe[title="Release notes"]');
await notes.getByRole("button", { name: "Acknowledge" }).click();
await expect(notes.getByText("Acknowledged")).toBeVisible();
await expect(page.getByText("Acknowledged")).toHaveCount(0);
```

The last line is the lesson. The parent document does not contain that word. A locator on `page` that happens to pass would be matching something else. `toHaveCount(0)` fails if the word leaks into the parent.

Dialogs, in order, from `tests/frames.spec.ts`:

```ts
page.once("dialog", (dialog) => {
  expect(dialog.message()).toBe("Shelf is locked");
  return dialog.accept();
});
await page.getByRole("button", { name: "Show shelf alert" }).click();
await expect(page.getByText("Alert closed")).toBeVisible();
```

`dialog.accept()` for a prompt can take the text: `dialog.accept("cargo")`. `dialog.dismiss()` is the confirm's cancel path. The lab maps those to "Named cargo" and "Kept". Assert the page text after the dialog, because that is what the user has left.

Popup:

```ts
const popupPromise = page.waitForEvent("popup");
await page.getByRole("link", { name: "Open bench note" }).click();
const popup = await popupPromise;
await expect(popup.getByRole("heading", { name: "Bench note" })).toBeVisible();
await popup.close();
```

Closing the popup is polite. The context teardown would close it anyway. Close it in the test so a later step on `page` is obviously the original tab.

:::callout compare
WebView versus iframe
An Android WebView is a separate view you drive with another API. An iframe is still the same browser, a nested document. `frameLocator` is the bridge. You do not launch a second browser to read a frame. You do use a second `Page` for a popup, because a popup is a tab.
:::

## Frame locators are lazy too

`frameLocator` does not wait by itself. The action inside the frame waits until the frame and the button are ready. If the frame's `src` is slow, the click's timeout covers it. If you need to assert the frame arrived before acting, `expect(notes.getByRole("heading", { name: "Release notes" })).toBeVisible()` is the condition.

Do not use `page.frames()` and an index unless you are debugging. Indexes shift when an extension injects a frame. The title is the contract.

Multiple dialogs: `once` handles one. Register the next `once` after the first dialog finishes, which is what the lab test does. A single `page.on("dialog")` that branches on `dialog.message()` also works when the sequence is fixed. Accept or dismiss exactly once per dialog. Accepting twice throws.

:::exercise
### Dismiss the confirm

On `/dialogs`, dismiss "Discard the shelf?" and assert the result text is "Kept".

:::hint
`dialog.dismiss()` is cancel. The page sets the result in the click handler after `confirm` returns.
:::

:::solution
```ts
await page.goto("/dialogs");
page.once("dialog", (dialog) => dialog.dismiss());
await page.getByRole("button", { name: "Confirm discard" }).click();
await expect(page.getByText("Kept")).toBeVisible();
```
:::
:::

:::exercise
### Name the frame without CSS

The frame element has title "Release notes". Write a `frameLocator` that does not use a CSS attribute selector if you can use a user-facing locator. Playwright accepts `page.frameLocator` with a selector. The accessible way to point at the frame element first is `getByTitle` on the iframe.

:::hint
`page.frameLocator` takes a selector string in the common examples. `locator(...).contentFrame()` is the locator-based API if you want to start from `getByTitle`.
:::

:::solution
```ts
const notes = page.getByTitle("Release notes").contentFrame();
await notes.getByRole("button", { name: "Acknowledge" }).click();
```
`contentFrame()` turns the iframe locator into a frame locator. The title is the accessible name.
:::
:::

:::quiz
Why does `page.getByRole("button", { name: "Acknowledge" })` fail on `/frames`?
- The button is inert
+ The button is inside an iframe, and page locators do not enter frames
- The button is a dialog
- Strict mode hides frame buttons
Use `frameLocator` or `contentFrame()`, then `getByRole` inside it.
:::

:::quiz
A `prompt` is handled by:
- Clicking the OK button via `getByRole` in the page DOM
+ `dialog.accept(text)` on the dialog event, which is not a DOM node
- `page.keyboard`
- Filling an input named "prompt"
Native dialogs are browser UI. The DOM is frozen until you accept or dismiss.
:::

:::quiz
A `target="_blank"` link yields a popup that:
- Lives in a new browser context with empty cookies
+ Is a Page in the same context, returned by `waitForEvent("popup")`
- Is a frame locator
- Cannot be closed
Same profile, different page. Close it when the test is done with it.
:::
