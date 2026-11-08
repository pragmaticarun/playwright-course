---
number: 26
slug: api-tests
title: API tests with APIRequestContext
module: Network
minutes: 35
summary: The request fixture talks HTTP without a browser. Params append in 1.65. The lab's POST does not persist.
source: API testing | https://playwright.dev/docs/api-testing
source: APIRequestContext | https://playwright.dev/docs/api/class-apirequestcontext
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
---

## Intuition

A large part of a backend does not need Chromium. `APIRequestContext` sends HTTP from the test process. The `request` fixture is one, already pointed at `baseURL`, isolated per test, and disposed afterward. Use it for status codes and JSON. Use a `page` when the subject is what the browser renders.

`request.get("/api/packages")` returns a response. `ok()` is true for 2xx. `json()` parses the body. `status()` is the code. These are values. `expect(response.ok()).toBeTruthy()` does not retry. If the server is still booting, the `webServer` gate already waited for `/health`. You do not poll a local handler that is up.

POST with `data` sends JSON and sets the content type:

```ts
const created = await request.post("/api/packages", {
  data: { name: "ninja", version: "bench-1" },
});
expect(created.status()).toBe(201);
expect(await created.json()).toEqual({
  name: "ninja",
  version: "bench-1",
  persisted: false,
});
```

The lab answers 400 when `name` or `version` is missing. The next GET still returns the six static pins. The test asserts both, so a future change that starts persisting `ninja` fails the length check. That assertion is the isolation contract from the server's side.

## The 1.65 params change

`params` on a request used to replace the query string. In 1.65, string and `URLSearchParams` values are appended to the query the URL already has. `request.get("/api/packages?kind=rust", { params: { pin: "bench-2026.11" } })` keeps `kind` and adds `pin`. Code that passed `params` to wipe the URL's query will now send both. The lab ignores extra query keys. Your API might not. Read the release note before you upgrade a suite that builds queries twice.

Cookie matching on `apiRequestContext.cookies(url)` follows RFC 6265, the same change as browser contexts. Proxy credentials in the config are no longer sent onward to websites. They answer proxy challenges only. A site login belongs in `httpCredentials` or in a real login request, not in the proxy password.

## Worked example

The whole GET test:

```ts
test("GET /api/packages returns the six pins @cross", async ({ request }) => {
  const response = await request.get("/api/packages");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.packages.map((item: { id: string }) => item.id)).toEqual([
    "build-essential",
    "cmake",
    "rustc",
    "cargo",
    "adb",
    "scrcpy",
  ]);
});
```

The order is the catalog order. If you sort the array in the server, update the test on purpose. An order-insensitive assertion would be `expect(ids).toEqual(expect.arrayContaining(["rustc"]))`, which does not lock the full list. The course locks the full list because the catalog is a fixture with a known order.

`request` shares storage state when the test's context does. A file with `test.use({ storageState })` gives `request` the cookies too, so an API call can be authenticated. The lab's package API does not check the cookie. The notes page is HTML, not JSON. You can still `request.get("/maintainer")` and assert status 403 or 200. That is a fast gate check. It does not prove the heading is visible. Keep one browser test for the heading.

:::callout note
fetch in the test process
Node 22 has `fetch`. You could call it directly. The `request` fixture is still the one to use: it applies `baseURL`, storage state, and the test's tracing. A bare `fetch` forgets all three.
:::

## When the API test is the wrong layer

Visual layout, focus, and accessible names need a browser. A 200 from `/` does not mean the heading exists. The smoke tests use `request.get` to check that routes respond. The locator tests use a page to check that the routes mean something. Keep both. Do not delete the browser test because the API test is faster.

Form posts through `request.post` with `form` send urlencoded bodies. You can hit `/forms` that way and skip the browser. Do that for a parser unit you want to hammer. Do the happy path through the UI as well, once, so the labels stay wired. This course's form tests go through the UI.

:::exercise
### Reject an empty POST

Assert that `POST /api/packages` with `data: {}` returns 400 and a JSON `error` string.

:::hint
`status()` is 400. `json()` includes `error`.
:::

:::solution
```ts
const missing = await request.post("/api/packages", { data: {} });
expect(missing.status()).toBe(400);
expect(await missing.json()).toEqual({ error: "name and version are required" });
```
:::
:::

:::exercise
### Explain appended params

You call `request.get("/api/status?ok=1", { params: { ok: "0" } })` on Playwright 1.65. Which query does the server see?

:::hint
1.65 appends. It does not replace.
:::

:::solution
Both keys are present: `ok=1` from the URL and `ok=0` from `params`. Duplicate keys are a product question. Do not assume `params` wipes the URL anymore.
:::
:::

:::quiz
`request.get` runs where?
- In the page, via `fetch`
+ In the test process, via APIRequestContext
- In the setup browser only
- In WebKit even when the project is Chromium
No browser paint is required. The fixture still uses `baseURL`.
:::

:::quiz
Why does the POST test GET the list afterward?
- To warm the cache
+ To prove the echo was not persisted into the catalog
- Because GET is mandatory after every POST in Playwright
- To refresh storage state
`persisted: false` is the body's claim. The list length is the proof.
:::

:::quiz
1.65 `params` behavior is:
- Ignored
+ Appended to the query string already on the URL
- A replacement of the existing query
- Limited to POST
If you meant to replace, build one URL or one params object, not both with conflicting keys.
:::
