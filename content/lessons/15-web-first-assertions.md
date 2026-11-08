---
number: 15
slug: web-first-assertions
title: Web-first assertions that retry
module: Waiting
minutes: 40
summary: expect(locator) polls. expect(value) does not. Negatives and toPass, and the difference from a sleep.
source: Assertions | https://playwright.dev/docs/test-assertions
source: expect(locator) | https://playwright.dev/docs/api/class-locatorassertions
source: Auto-retrying assertions | https://playwright.dev/docs/test-assertions#auto-retrying-assertions
---

## Intuition

`expect` is two tools under one name. If you pass a locator, the matcher retries until it passes or the expect timeout hits. If you pass a string, a number, or a response you already awaited, the matcher runs once. The retries are how you delete `waitForTimeout`. A sleep waits even when the app was ready, and it still fails when the app was slower than the sleep. A retrying assertion waits only as long as needed and fails with the last observed value.

The matchers you will use every day:

- `toBeVisible`, `toBeHidden`, `toBeEnabled`, `toBeDisabled`, `toBeChecked`
- `toHaveText`, `toContainText`, `toHaveValue`, `toHaveAttribute`, `toHaveCount`
- `toHaveURL`, `toHaveTitle` on the page
- `toBeOK` on a response, which does not retry the network: the response already arrived

`toHaveText` on a single element wants the whole text. `toContainText` wants a substring. The signing notes test uses `toContain` style through `getByText("rotate the local bench key")`, which finds an element containing that string. `getByText` plus `toBeVisible` is the usual pair. `toHaveText` is stricter and better when the whole string is the contract, such as the status line "bench ok".

Negative assertions retry too. `toBeHidden` and `toHaveCount(0)` wait until the element is gone. `not.toBeVisible()` also retries. A common bug is `expect(await locator.isVisible()).toBe(true)`. `isVisible` returns a boolean once. The `expect` then has nothing to retry. You turned a web-first assertion into a snapshot of one moment. Do not await the locator into a boolean before `expect`. Pass the locator in.

## Worked example

The mirror status, unmocked:

```ts
await page.goto("/status");
await expect(page.getByRole("status")).toHaveText("bench ok");
```

The node starts as "Checking". The fetch callback replaces it. `toHaveText` polls. When the test mocks the response, the same assertion expects "mirror down". The assertion does not know about mocks. It knows about text.

The preferences echo:

```ts
await expect(page.locator("dd").nth(0)).toHaveText("Arun");
await expect(page.locator("dd").nth(1)).toHaveText("beta");
```

These pass immediately after navigation to the result page, because the server rendered the values. The retry budget is unused. That is fine. Assertions that sometimes pass on the first try and sometimes on the third are still the right shape.

`expect.poll` and `expect.toPass` retry a callback you write. Use them when the check is not a locator: a value computed in Node, a file size, a JSON field you fetch yourself. For DOM text, the locator matcher is shorter and the error is better.

```ts
await expect.poll(async () => {
  const response = await page.request.get("/api/status");
  return (await response.json()).ok;
}).toBe(true);
```

You rarely need that here, because `request.get` is already the value. `toPass` wraps several expects and retries the whole block. It is for a sequence that should eventually succeed as a unit.

:::callout warn
`waitForTimeout` is a sleep
It is available and it is the wrong tool for app readiness. The only honest use is demonstrating a race in a lesson, or waiting out a bug you do not own while a ticket is open. This suite does not call it.
:::

## Timeouts on a single expect

`await expect(locator).toHaveText("Shelf ready", { timeout: 2_000 })` overrides the expect timeout for that call. The delayed shelf needs about 500 milliseconds. Two seconds is a generous budget that still fails fast if the timer never fires. The global 5 seconds is also fine. Tighten a timeout when a slow failure makes the suite hard to iterate, not to shave a passing test.

Soft assertions, `expect.soft`, collect failures and continue. They are next. They still retry each check. Soft does not mean "check once."

:::exercise
### Rewrite the boolean trap

Replace this with a retrying assertion:

```ts
expect(await page.getByRole("heading", { name: "Workshop Bench" }).isVisible()).toBe(true);
```

:::hint
Pass the locator to `expect`. Do not await `isVisible` first.
:::

:::solution
```ts
await expect(page.getByRole("heading", { name: "Workshop Bench" })).toBeVisible();
```
:::
:::

:::exercise
### Assert the echo

After saving the toolchain form as Arun / beta / Rust, assert the first three definition values. Use `toHaveText`, not `textContent()`.

:::hint
The echo page renders a `dl` in field order: display name, channel, tool.
:::

:::solution
```ts
await expect(page.locator("dd").nth(0)).toHaveText("Arun");
await expect(page.locator("dd").nth(1)).toHaveText("beta");
await expect(page.locator("dd").nth(2)).toHaveText("rust");
```
:::
:::

:::quiz
Which call retries?
+ `await expect(page.getByRole("status")).toHaveText("bench ok")`
- `expect(await page.getByRole("status").textContent()).toBe("bench ok")`
- `expect(6).toBe(6)`
- `expect(response.status()).toBe(200)` after the response is in hand
Only the locator matcher re-reads the page. The others compare values they already have.
:::

:::quiz
`toBeHidden` on a filtered catalog link waits until what?
- The test timeout, always, even if it is already hidden
+ The element is hidden or gone, or the expect timeout expires
- `networkidle`
- The next navigation
Negative matchers retry the condition. They return as soon as it holds.
:::

:::quiz
Why avoid `waitForTimeout` as readiness?
- It was removed in 1.65
+ It waits a fixed time whether the app is ready or not, and still flakes when the app is slower
- It only works in UI mode
- It clears localStorage
A condition retries the right amount. A sleep does not know the condition.
:::
