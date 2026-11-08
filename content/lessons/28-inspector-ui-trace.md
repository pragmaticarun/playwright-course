---
number: 28
slug: inspector-ui-trace
title: Inspector, UI mode, trace viewer, and codegen
module: Seeing and debugging
minutes: 40
summary: How to watch one test, how to read a trace, and why generated code is a draft you edit into locators.
source: Debugging tests | https://playwright.dev/docs/debug
source: Trace viewer | https://playwright.dev/docs/trace-viewer
source: UI mode | https://playwright.dev/docs/test-ui-mode
source: Codegen | https://playwright.dev/docs/codegen
---

## Intuition

A red assertion tells you the locator and the timeout. Sometimes you need the timeline: what the page looked like, which request returned 500, which click hit a covered node. Playwright records that as a trace. This repo sets `trace: "on-first-retry"`. Locally, retries are 0, so you get a trace only when you ask. In CI, a failure retries and the retry records a trace. That is the expensive artifact, collected when you already know the test is unhappy.

Open a trace with `npx playwright show-trace path/to/trace.zip`. The viewer shows actions, DOM snapshots, network, and console. It is a recording, not a live session. You can scroll time. You cannot click the app inside the viewer. Use it after the run.

UI mode is the live session. `npx playwright test --ui` opens a window that lists tests, watches files, and lets you step. It needs a display. A headless SSH session without `xvfb` cannot open it. On Ubuntu desktop it is the fastest way to learn a failure. UI mode does not run the setup project unless you include it, so an authenticated test can fail in the UI and pass in the terminal. Run the setup test from the UI once if the storage file is missing.

The Inspector is the debugger UI mode uses, and `PWDEBUG=1 npx playwright test tests/forms.spec.ts --project=chromium` opens it for that command. You get a paused page and a locator picker. Pick a locator, copy it, then close the debugger and put the locator in the file. Do not leave `PWDEBUG` set in CI. It pauses.

Codegen records your clicks as a script: `npx playwright codegen http://127.0.0.1:4471/forms`. Start the lab yourself first, because codegen does not read `webServer`. The output is a draft. It often uses roles correctly. It sometimes uses a brittle text locator or a chain you can shorten. Edit it into the style of `tests/forms.spec.ts` before you commit it. Generated code that you do not understand is a flaky test you have not met yet.

## Worked example

Record a trace for one file even though retries are off:

```bash
npx playwright test tests/frames.spec.ts --project=chromium --trace on
npx playwright show-trace test-results/**/trace.zip
```

`--trace on` overrides the config for that command. You will see the dialog accept, the frame click, and the popup. The dialog step is interesting because the dialog is not a DOM node: the trace still lists the action. If a step is missing, the test never got there. The timeout error and the last snapshot agree, or the product navigated somewhere the test did not expect. Believe the snapshot.

Failure screenshots are already on, via `screenshot: "only-on-failure"`. They land in `test-results/` next to the error context. The HTML report links them. Open the report with `npx playwright show-report` when the terminal summary is not enough.

1.65 adds a `failures` reporter that prints failures as they happen, and `onlyFailures` on the HTML reporter. Turn `onlyFailures` on in CI when the full report is too large to read. Leave it off locally while you are learning, so you can see the passes.

```ts
reporter: [["failures"], ["html", { open: "never", onlyFailures: true }]],
```

That pair is a reasonable CI choice. This course's committed config keeps the list reporter and a full HTML report so a local learner sees every case.

:::callout note
Headed mode
`--headed` shows the browser. It is not the debugger. Combine it with `--debug` or with UI mode when you want to pause. A headed run on a server without a display fails to open a window. The default headless run is the one CI uses.
:::

## Codegen and page objects

Codegen does not know about `CatalogPage`. It writes `page.getByRole` calls, which is what you want inside a page object method. Paste the body into `add()` or `place()`, then delete the duplication. The class-field rule from the TypeScript lesson still applies: do not let codegen's selectors become field initializers that touch `this.page` before the constructor assigns it.

The trace picker can also suggest a locator. Prefer `getByRole` suggestions over CSS suggestions. If the picker offers `#save-pin`, that is the inert lesson's choice, not the catalog's.

:::exercise
### Open UI mode on one file

Write the command that opens UI mode for `tests/forms.spec.ts` only.

:::hint
`--ui` is a runner flag. The file path filters the list.
:::

:::solution
```bash
npx playwright test tests/forms.spec.ts --ui
```
You need a display. The setup project will not run unless you select it.
:::
:::

:::exercise
### Edit generated code

Codegen emits `page.getByText("Save preferences").click()` on the toolchain form. What do you change, and why?

:::hint
The control is a button. Text locators are looser than role plus name.
:::

:::solution
```ts
await page.getByRole("button", { name: "Save preferences" }).click();
```
The role pins the control type. The generated text locator can match a paragraph that mentions the same words.
:::
:::

:::quiz
`trace: "on-first-retry"` records a trace when?
- On every passing test
+ On a retry, which this repo's CI does after a failure, and which a local run with retries 0 does not do
- Only in UI mode
- Only for Firefox
Ask for `--trace on` when you want a trace of a first local failure.
:::

:::quiz
UI mode skips which project unless you run it?
- Chromium
+ The setup project
- Every project with a grep
- The one named in `--ui`
Authenticated tests need the storage file. Run the setup test from the UI when it is missing.
:::

:::quiz
Codegen output should be treated as:
- The final suite, committed unchanged
+ A draft to rewrite into role locators and page objects you understand
- A trace file
- A HAR
If you cannot explain the generated line, it is not ready to keep.
:::
