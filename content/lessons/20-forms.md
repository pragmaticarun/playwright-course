---
number: 20
slug: forms
title: Forms: fill, check, select, press
module: Interactions
minutes: 40
summary: Fill versus type, checkboxes, radios, native selects, and why the lab echoes values instead of trusting the DOM.
source: Input | https://playwright.dev/docs/input
source: Actions | https://playwright.dev/docs/input#text-input
source: Locators | https://playwright.dev/docs/locators
---

## Intuition

Forms are where locators, actionability, and assertions meet. The lab's toolchain form is a normal browser form: GET-less POST, urlencoded body, server-rendered echo. There is no client framework to desync. If the echo is wrong, the submission was wrong.

`fill` sets the value of an input or textarea. It clears the previous value and fires the input events the browser expects. It does not type key by key. `pressSequentially` types key by key, which you need only when the page listens to keydown, such as a search box that filters on each letter. The catalog filter is a button, not a typing filter. Use `fill` for the lab forms.

`check` and `uncheck` are for checkboxes and radios. They wait until the control is actionable and then set the checked state. Calling `check` on an already checked box succeeds. `click` on a checkbox toggles, which is a worse contract: the test's result depends on the start state. `selectOption` picks an `<option>` by value, label, or index. The toolchain channel uses values `stable`, `beta`, and `nightly`. `selectOption("beta")` matches the value.

`press` sends a key to the focused element. `Enter` inside a form can submit. Prefer clicking the submit button by name so the test does not depend on which control is focused. Use `press` when the product's contract is the key, such as a slash that focuses search on the course site.

Disabled and `readonly` controls fail actionability. Inert controls fail it too, since 1.65. A required field does not block `fill`. The browser's constraint validation blocks the actual submission. The lab's checkout requires a name, an email, and the agreement checkbox on the server, not only in the browser. Test the server's error page. Client-only validation disappears when someone curls the form.

## Worked example

```ts
await page.goto("/forms");
await page.getByLabel("Display name").fill("Arun");
await page.getByLabel("Channel").selectOption("beta");
await page.getByRole("radio", { name: "Rust" }).check();
await page.getByRole("checkbox", { name: "Email the build log" }).check();
await page.getByLabel("Notes").fill("nightly only on the lab machine");
await page.getByRole("button", { name: "Save preferences" }).click();
await expect(page.getByRole("heading", { name: "Preferences saved" })).toBeVisible();
await expect(page.locator("dd").nth(2)).toHaveText("rust");
```

The radio value is `rust`, the label is `Rust`. `selectOption` and the echo speak the value. The accessible name speaks the label. Assert the value the server stored, and target the control by the name the user sees.

The XSS check in `tests/forms.spec.ts` fills a display name of `<script>alert(1)</script>` and expects the echo page to show that string as text, with zero `script` elements. The server escapes. The test is a regression test for the escape, not an exploit to reuse elsewhere. It belongs here because forms are the door user text walks through.

Empty shelf checkout:

```ts
await page.goto("/checkout");
await page.getByLabel("Your name").fill("Arun");
await page.getByLabel("Email").fill("arun@example.com");
await page.getByRole("checkbox", { name: "I am testing this local bench" }).check();
await page.getByRole("button", { name: "Place bench order" }).click();
await expect(page.getByText("The shelf is empty.")).toBeVisible();
```

The hidden `items` field is filled by `checkout.js` from `localStorage`. An empty shelf sends an empty items value. The server returns 400 and a list. The test reads the list. It does not assert the HTTP status unless it captured the navigation response. Asserting the heading the human sees is enough.

:::callout compare
adb input versus fill
`adb shell input text` types into the focused view and fights the IME. `fill` sets the DOM value. It is closer to assigning the `EditText` content in a unit test than to poking the touchscreen. Use `pressSequentially` when the IME, or a key listener, is the thing under test.
:::

## Files are not fill

`<input type="file">` ignores `fill`. The next lesson uses `setInputFiles`. Do not type a path into a file input. Browsers refuse, and Playwright will not pretend.

Content editable regions and ProseMirror-like widgets sometimes ignore `fill`. You do not have one on the lab. If you meet one, `pressSequentially` or the locator's `fill` on a true input inside the widget is the first try. A test id on the real input beats a pile of key events.

:::exercise
### Save Android nightly

Fill display name `Arunkumar`, channel `nightly`, radio Android, leave the email checkbox unchecked, notes `adb over usb`. Assert the five echo cells.

:::hint
Unchecked checkboxes are absent from the POST body. The server prints `no`.
:::

:::solution
```ts
await page.goto("/forms");
await page.getByLabel("Display name").fill("Arunkumar");
await page.getByLabel("Channel").selectOption("nightly");
await page.getByRole("radio", { name: "Android" }).check();
await page.getByLabel("Notes").fill("adb over usb");
await page.getByRole("button", { name: "Save preferences" }).click();
await expect(page.locator("dd").nth(0)).toHaveText("Arunkumar");
await expect(page.locator("dd").nth(1)).toHaveText("nightly");
await expect(page.locator("dd").nth(2)).toHaveText("android");
await expect(page.locator("dd").nth(3)).toHaveText("no");
await expect(page.locator("dd").nth(4)).toHaveText("adb over usb");
```
:::
:::

:::exercise
### fill versus pressSequentially

The channel control is a `<select>`. A colleague calls `pressSequentially("beta")` on it. What should they call instead, and why?

:::hint
Selects are not typed. They have options.
:::

:::solution
`await page.getByLabel("Channel").selectOption("beta")`. `pressSequentially` is for text fields whose key handlers matter. A select needs its option chosen.
:::
:::

:::quiz
`check` on a checkbox differs from `click` because:
- `check` is faster and skips events
+ `check` sets the checked state instead of toggling whatever the state already is
- `click` cannot target checkboxes
- `check` bypasses actionability
Tests should say "this box is checked," not "this box was clicked an unknown number of times."
:::

:::quiz
The lab echoes `<script>` as text because:
- Playwright strips tags
+ The server escapes HTML before it writes the page
- Browsers do not parse the result
- `fill` encodes entities
The form test asserts there is no `script` element. Escaping is the server's job. The test locks it in.
:::

:::quiz
A file input should be set with:
- `fill("/etc/passwd")`
+ `setInputFiles`, covered in the next lesson
- `pressSequentially`
- `selectOption`
Browsers do not let page script assign a file path. Playwright's file API is the supported path, and you will point it at a buffer, not at a secret on disk.
:::
