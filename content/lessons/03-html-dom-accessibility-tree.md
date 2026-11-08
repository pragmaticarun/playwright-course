---
number: 3
slug: html-dom-accessibility-tree
title: HTML, the DOM, and the accessibility tree
module: Prerequisites
minutes: 40
summary: What the browser builds from HTML, which tree Playwright locators read, and why a div with a click handler is a bad button.
source: HTML living standard, DOM | https://html.spec.whatwg.org/multipage/dom.html
source: Accessibility tree | https://developer.mozilla.org/en-US/docs/Glossary/Accessibility_tree
source: ARIA in HTML | https://www.w3.org/TR/html-aria/
source: Playwright locators | https://playwright.dev/docs/locators
---

## Intuition

HTML is a text format. The parser turns it into the DOM, a tree of nodes. CSS paints boxes from that tree. A second tree, the accessibility tree, is what assistive tech and Playwright's role locators read. It is not the DOM and it is not the pixels.

You already know a tree that is not the bytes on disk. An AST is not your `.rs` file. The accessibility tree is not your `.html` file. A `<button>Unlock notes</button>` becomes a button role whose accessible name is "Unlock notes". `getByRole("button", { name: "Unlock notes" })` looks there. It does not look at the CSS class, and it does not look at the screenshot.

Roles come from the element, unless ARIA overrides them. `<button>` is a button. `<a href="/shelf">` is a link. `<input id="name">` paired with `<label for="name">` gets its name from the label. A `<div onclick>` is a generic group. It has no button role. A person using a keyboard may never reach it. `getByRole("button")` will not find it either. Fix the HTML. Do not paper over it with a CSS locator.

Names are computed. They can come from the text content, from `<label>`, from `aria-label`, or from `aria-labelledby`. Playwright 1.65 tightened one edge: text the browser does not render, such as text that never got assigned to a slot, is no longer part of the accessible name. If a name assertion changed after an upgrade, that release note is the first place to look.

Hiding is also a role question. The `hidden` attribute removes a node from the accessibility tree. `inert` does too, and it makes the subtree non-interactive. A later lesson shows Playwright 1.65 waiting until an element is not inert before it clicks. `display: none` hides as well. A locator that requires the element to be visible will wait.

## Worked example

Workshop Bench's catalog filter is a real button, with `aria-pressed`, inside a group that has a name.

```html
<div class="filters" role="group" aria-label="Filter by toolchain">
  <button type="button" data-kind="rust" aria-pressed="false">Rust</button>
</div>
```

`getByRole("button", { name: "Rust", exact: true })` hits that button because the accessible name is the text "Rust". `exact: true` matters if another control's name merely contains those letters. The group label "Filter by toolchain" is how a screen reader announces the cluster. It is also how you can scope a locator later: `getByRole("group", { name: "Filter by toolchain" }).getByRole("button", { name: "Rust" })`.

The form on `/forms` uses `<label for="display-name">` and an input with that id. `getByLabel("Display name")` is the locator that matches the accessible name of the input. If you delete the `for`/`id` pair and leave a placeholder, the label locator stops working. Placeholders disappear when the user types. They are not names.

:::callout compare
View hierarchy versus accessibility tree
On Android you already distinguish the view tree from what TalkBack announces. The DOM is the view tree. The accessibility tree is the TalkBack tree. Playwright's `getByRole` walks the second one. A pretty view that TalkBack cannot name is a pretty view your test should also refuse to target.
:::

## A bad control, on purpose

`/a11y/broken` includes an empty `<button>` and an `<img>` without `alt`. The empty button has no accessible name. axe reports `button-name`. The image reports `image-alt`. The lesson on accessibility testing runs that scan. The point in this lesson is the tree, not the scanner: if the tree has no name, `getByRole` has nothing stable to say.

The good page `/a11y` gives the image an alt of "Workshop Bench mark" and labels the search input. Same pixels-worth of layout, different tree, tests that can find the controls.

:::exercise
### Name the control

For each snippet, say the role and the accessible name a locator should use. 1) `<a href="/shelf">Shelf</a>`. 2) `<button type="submit">Place bench order</button>`. 3) `<div class="btn" onclick="save()">Save pin</div>`.

:::hint
Anchors with `href` are links. Submit buttons are buttons. A div is not a button unless you add a role and keyboard behavior, which you should not do when a real button exists.
:::

:::solution
1. link, name "Shelf". 2. button, name "Place bench order". 3. no button role. Replace it with `<button type="button">Save pin</button>` before you write a locator.
:::
:::

:::exercise
### Label the manifest input

The upload form uses `<label for="manifest">Manifest</label>` and `<input id="manifest" type="file">`. Write the Playwright locator. Then say what breaks if someone removes the `for` attribute.

:::hint
`getByLabel` reads the accessible name, which the label provides.
:::

:::solution
```ts
await page.getByLabel("Manifest").setInputFiles({
  name: "pins.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("rustc\n"),
});
```
Without `for`, the input's name is empty unless another naming method exists. `getByLabel("Manifest")` stops matching.
:::
:::

:::quiz
Which tree does `getByRole` consult?
- The raw HTML source text
- The CSS box tree
+ The accessibility tree
- The screenshot pixel buffer
Roles and accessible names live in the accessibility tree. The pixels are what a screenshot comparison sees, which is a different tool.
:::

:::quiz
What does the `hidden` attribute do to a catalog card?
- It only changes the color
+ It removes the element from the accessibility tree and from view
- It deletes the DOM node
- It sets `aria-pressed`
Workshop Bench sets the DOM `hidden` property when a filter excludes a card. Role locators that require visibility do not treat it as present.
:::

:::quiz
Playwright 1.65 stopped including which text in accessible names?
- Every `aria-label`
+ Text the browser does not render, such as unassigned slot text
- The contents of `<title>`
- Placeholder text, which was never a name
The release notes call this out because `getByRole` names, `ariaSnapshot`, and `toMatchAriaSnapshot` can change when that text drops out.
:::
