---
number: 16
slug: timeouts-and-soft
title: Timeouts, polling, and soft assertions
module: Waiting
minutes: 35
summary: Test timeout versus expect timeout, test.slow, test.skip with a description, and expect.soft when you want every failure.
source: Timeouts | https://playwright.dev/docs/test-timeouts
source: Annotations | https://playwright.dev/docs/test-annotations
source: test.skip | https://playwright.dev/docs/api/class-test#test-skip
source: expect.soft | https://playwright.dev/docs/test-assertions#soft-assertions
---

## Intuition

Three clocks run during a test. The test timeout bounds the whole body, 30 seconds in this repo. The expect timeout bounds one locator assertion, 5 seconds. The action timeout bounds one click or fill, and it falls back to the same default timeout as other page operations unless you set `actionTimeout` in the config. A hung click burns the action timeout. A hung assertion burns the expect timeout. A test that does twenty slow things burns the test timeout even if each assertion would have passed alone.

`test.slow()` triples the test timeout and marks the test slow in the report. Use it for a case you know is heavy, such as a long trace, not for a case you have not understood. `test.setTimeout(1_000)` sets the budget for the rest of that test. The inert trial click passes a timeout to one call instead, which is more precise.

`expect.soft(locator).toHaveText("x")` records a failure and continues. At the end of the test, any soft failure fails the test. The HTML report lists each one. That is what you want on a dashboard with six independent headings: one bug should not hide the other five. It is not what you want on a login flow, where step two is nonsense if step one failed. Use soft assertions for independent checks.

## Skip, fixme, fail

The annotations page and the 1.65 notes agree on the in-test form:

```ts
test("upload a file", async () => {
  test.skip("Not implemented yet");
});
```

Inside a running test, `test.skip(description)` stops the test and records the description as an annotation. The conditional form is still in the type definitions and the annotations guide:

```ts
test("poster", async ({ browserName }) => {
  test.skip(browserName !== "chromium", "The committed baseline is Linux Chromium.");
});
```

The test is skipped when the condition is true. The description shows up in the report. `test.skip(title, body)` at declaration time never runs the body. Prefer that when the whole test is inapplicable, and prefer the condition form when only one browser is inapplicable. `test.fixme` marks a known broken test and does not run it. `test.fail` runs it and requires it to fail. Use `fail` when you are pinning a bug you expect. Use `fixme` when running the test would crash the worker.

1.65 also adds `lock: "-exclusive-"` on a test, which pauses other tests in the worker set while this one runs. The parallelism lesson uses it. It is not a timeout feature, but it is a knob you reach for when a test cannot share the machine, which is a cousin of "this test needs more time."

## Worked example

Soft checks on the echo page, independent cells:

```ts
await expect.soft(page.locator("dd").nth(0)).toHaveText("Arun");
await expect.soft(page.locator("dd").nth(1)).toHaveText("beta");
await expect.soft(page.locator("dd").nth(2)).toHaveText("rust");
```

If the channel comes back `stable`, you still learn whether the name and the tool were saved. A hard `expect` on the first mismatch would stop the test there.

`expect.poll` for a non-DOM condition:

```ts
await expect.poll(async () => {
  const body = await (await page.request.get("/api/status")).json();
  return body.message;
}, { timeout: 3_000 }).toBe("bench ok");
```

The callback runs until the timeout. Intervals are automatic. Do not put a sleep inside the callback.

:::callout note
Retries are not timeouts
A project `retries: 2` runs the whole test again after a failure. It does not extend a single expect. A flaky timeout that passes on the retry is still a race. The report marks it flaky. Treat flaky as failed until you can explain it.
:::

## Configuration reference

In `playwright.config.ts` the clocks are `timeout` and `expect.timeout`. You can also set `use.actionTimeout` and `use.navigationTimeout`. Navigation timeout covers `goto` and `waitForURL`. This repo leaves navigation on the default and keeps `goto` paths on a local server, so they return in milliseconds. A navigation timeout matters when the base URL is a remote staging host.

`test.info().timeout` tells you the current test budget, including `test.slow`. You can log it while you learn. You do not need it in a normal assertion.

:::exercise
### Skip the poster on Firefox

Write the body line that skips when `browserName` is not chromium, with a description a report can show. The fixture argument must include `browserName`.

:::hint
`test.skip(condition, description)` skips when the condition is true.
:::

:::solution
```ts
test("poster", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "The committed baseline is Linux Chromium.");
  await page.goto("/visual");
});
```
:::
:::

:::exercise
### Choose soft or hard

You assert that the order heading is "Order placed" and then that the id is `BN-ARUN`. Should the id check be `expect.soft`? Why or why not?

:::hint
If the heading is wrong, you are not on the confirmation page. The id locator may not exist for a meaningful reason.
:::

:::solution
Use a hard expect for the heading, then a hard expect for the id. The second depends on the first. Soft assertions fit independent fields on a page you already know you reached.
:::
:::

:::quiz
`test.slow()` does what to the test timeout?
- It removes the timeout
+ It triples the test timeout and annotates the test
- It triples only the expect timeout
- It enables retries
The annotation is visible in the report so a slow test is a decision, not an accident.
:::

:::quiz
Inside a test, `test.skip("Not implemented yet")` does what on 1.65?
- Deletes the test file
+ Stops the test and records the description as an annotation
- Fails the test
- Skips only on WebKit
The release notes show this description-only in-test call. The condition form remains for browser-specific cases.
:::

:::quiz
`expect.soft` fails the test when?
- Immediately, like a hard expect
+ At the end, if any soft assertion failed, after continuing the body
- Never; it only logs
- Only in CI
You get every independent failure in one run. Dependent steps should stay hard.
:::
