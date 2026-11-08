---
number: 25
slug: network-mocks
title: Routing, mocking, and HAR
module: Network
minutes: 40
summary: page.route fulfills a response before it hits the lab. HAR is the recording, not the first tool.
source: Network mocking | https://playwright.dev/docs/mock
source: page.route | https://playwright.dev/docs/api/class-page#page-route
source: HAR routing | https://playwright.dev/docs/mock#mocking-with-har
---

## Intuition

The browser's network stack is a seam you can intercept. `page.route` registers a handler for a URL pattern. When a request matches, your handler calls `route.fulfill`, `route.continue`, or `route.abort`. The page sees a normal response. The lab server may never see the request.

This is a test double at the socket, not a change to Workshop Bench. The status page fetches `/api/status` and writes `bench ok` when `ok` is true, otherwise the `message`. A test that needs the down-mirror copy fulfills the response itself:

```ts
await page.route("**/api/status", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ service: "bench", ok: false, message: "mirror down" }),
  }),
);
await page.goto("/status");
await expect(page.getByRole("status")).toHaveText("mirror down");
```

Register the route before the navigation that triggers the fetch. A route added after `goto` misses the first request. The pattern `**/api/status` matches any host. On this lab there is one host. The glob is still the habit you want, because `baseURL` can move.

`route.continue()` sends the request on, optionally with different headers or post data. `route.abort()` fails it. Abort is how you simulate a dropped connection. Fulfill is how you simulate a payload. Continue is how you observe or tweak a real request. Prefer fulfill when the test's subject is the UI's reaction to a payload. Prefer the real server when the test's subject is the server.

HAR files record traffic and replay it. `page.routeFromHAR` is documented in the mock guide. A HAR is useful when a third-party host is flaky and the response is large. It is a poor first tool for one JSON object you can write in five lines. A HAR also goes stale when the product changes, and it can capture tokens. Do not commit a HAR from a logged-in production session. This course does not ship one.

## Worked example

The unmocked twin proves the lab itself returns the happy payload:

```ts
await page.goto("/status");
await expect(page.getByRole("status")).toHaveText("bench ok");
```

If both tests run in parallel, they do not interfere. Each has its own context and its own route table. Routing in test A does not fulfill test B's fetch. That is context isolation applied to the network stack.

Fulfill can set status 500. The status page's `catch` writes "status request failed" only when `fetch` rejects. A 500 with a JSON body still resolves `fetch` and then `response.json()` may throw if the body is not JSON. Know which failure you simulated. For this lab, a 200 with `ok: false` is the branch the UI actually renders as `message`. Test the branch the product has, not a branch you wish it had.

`page.unroute` removes a handler. You rarely need it. The context dies with the test. `page.route` inside a fixture is how you mock for many tests. Keep it in the test until more than one test wants the same fulfill.

:::callout compare
A fake adb versus a route
You sometimes wrap `adb` in a script that returns canned devices. `page.route` is that wrapper for HTTP. The real device, or the real lab server, stays available for the tests that should use it. Do not mock the server in a test whose job is to notice the server is wrong.
:::

## Request inspection

`route.request()` is the request. You can branch:

```ts
await page.route("**/api/packages", async (route) => {
  if (route.request().method() === "POST") {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ name: "ninja", version: "bench-1", persisted: false }),
    });
    return;
  }
  await route.continue();
});
```

GET falls through to Workshop Bench. POST never hits it. The API lesson uses the real POST. A UI test that should not create anything uses the fulfill. Branching on method keeps one pattern from swallowing traffic you meant to keep real.

`waitForRequest` and `waitForResponse` observe without mocking. Arm them before the action. They answer "did the page call the endpoint," which is a different question from "what does the page do when the endpoint says no."

:::exercise
### Mock a down mirror

Write the route and the assertion so `/status` shows `mirror down`. Do not change the server.

:::hint
Fulfill JSON with `ok: false` and `message: "mirror down"`. Register the route first.
:::

:::solution
```ts
await page.route("**/api/status", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ service: "bench", ok: false, message: "mirror down" }),
  }),
);
await page.goto("/status");
await expect(page.getByRole("status")).toHaveText("mirror down");
```
:::
:::

:::exercise
### Decide not to mock

The capstone places a real order and expects `BN-ARUN`. Why is `page.route` the wrong tool for that assertion?

:::hint
The order id is computed by the server from the posted name.
:::

:::solution
A fulfill would let the test invent `BN-ARUN` without the server. The capstone's subject is that the lab computes the id. Let the POST hit `practice-app/server.js`.
:::
:::

:::quiz
A route handler runs where?
- Inside the page, as `fetch` middleware you shipped
+ In the test process, intercepting the browser's request
- Only in the setup project
- After the response reaches the page
The page sees whatever you fulfill. The lab is unaware.
:::

:::quiz
HAR replay is a poor fit when?
- The payload is one small JSON object you can write in the test
- You might record a production token
+ Both: small payloads should be explicit, and recorded secrets should not be committed
- You are on Firefox
Write the JSON in the test. Leave HAR for large third-party captures you have reviewed.
:::

:::quiz
Routes registered on a page affect other tests when?
- Always, because the browser process is shared
+ They do not; each test's context has its own routes
- Only if the URL glob starts with `**`
- When `fullyParallel` is false
Isolation includes the route table. Mock in the test that needs the mock.
:::
