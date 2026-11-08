---
number: 24
slug: cookies-and-web-storage
title: Cookies, localStorage, and sessionStorage
module: Authentication
minutes: 35
summary: Where the lab keeps the session, where it keeps the shelf, and the 1.65 cookie matching rules.
source: Authentication, session storage | https://playwright.dev/docs/auth
source: BrowserContext.cookies | https://playwright.dev/docs/api/class-browsercontext#browser-context-cookies
source: BrowserContext.addCookies | https://playwright.dev/docs/api/class-browsercontext#browser-context-add-cookies
source: RFC 6265 | https://www.rfc-editor.org/rfc/rfc6265
---

## Intuition

Three stores, three lifetimes.

**Cookies** go to the server. Workshop Bench sets `bench_session=maintainer; HttpOnly; Path=/; SameSite=Lax` after a good login. HttpOnly means page JavaScript cannot read it. Your test still can, through the context API, because the test is outside the page. That is a power the page does not have. Do not "verify HttpOnly" by evaluating `document.cookie` and expecting to see the session. `document.cookie` should not show it. `context.cookies()` should.

**localStorage** stays in the page origin and survives reloads. The shelf key is `bench-shelf`. It is not sent to the server. Checkout's script copies it into a hidden form field at load. That is why the order test adds rustc, then navigates to checkout, and the server sees `rustc:1`. The server never read `localStorage` itself.

**sessionStorage** lasts for the top-level browsing session and is not in `storageState`. The lab does not use it. If you meet it, the auth guide's init script copies keys in before the page loads. An init script is early enough that the app sees the values on first paint.

Playwright 1.65 matches cookies the way RFC 6265 describes. With a URL filter, `context.cookies(url)` no longer returns a host-only cookie for a subdomain it does not belong to, and a `Path=/api` cookie does not match `/apiv2`. A `Path=/foo/` cookie does not match `/foo`. If a cookie assertion got looser or stricter after the upgrade, this is why. The lab's cookie path is `/`, so `/maintainer` and `/` both see it.

APIRequestContext learned the same matching rules. A nameless cookie is sent as `Cookie: x` rather than `Cookie: =x`. You will not hit that on the lab. You will hit it if you replay a captured jar from a quirky backend.

## Worked example

Read the cookie after setup, in a test that loaded storage state:

```ts
test("session cookie is httpOnly", async ({ page, context }) => {
  await page.goto("/maintainer");
  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name === "bench_session");
  expect(session?.value).toBe("maintainer");
  expect(session?.httpOnly).toBe(true);
  const fromPage = await page.evaluate(() => document.cookie);
  expect(fromPage).not.toContain("bench_session");
});
```

Add a cookie without the UI, when you are testing the gate and not the form:

```ts
await context.addCookies([{
  name: "bench_session",
  value: "maintainer",
  url: "http://127.0.0.1:4471",
}]);
await page.goto("/maintainer");
```

`url` lets Playwright fill domain and path. This bypasses the login form. Use it only in a test whose subject is the gate, not the form. The setup project remains the place that proves the form works.

Clear storage from a test:

```ts
await context.clearCookies();
await page.evaluate(() => localStorage.clear());
```

`clearCookies` is the context. `localStorage.clear` is the page, and only for the origin of the current document. Navigate first, then clear, if you need the shelf gone mid-test. A new context is cleaner than clearing. Clear only when the test's subject is "logging out."

:::callout compare
SharedPreferences versus localStorage
Android `SharedPreferences` is a file your process owns. `localStorage` is a file the browser owns per origin. Neither is a secret store. Do not put a signing key in the shelf JSON. The notes page says to rotate the lab key before you share traces, because traces can contain storage.
:::

## SameSite and localhost

`SameSite=Lax` sends the cookie on top-level navigations and not on cross-site subrequests. The lab is one origin. You will not see a cross-site bug here. You will see one the day the app and the API are different sites. When a cookie "disappears" on a POST from another site, check `SameSite` before you blame `storageState`.

Secure cookies require HTTPS. The lab is HTTP on localhost. Do not mark the fixture cookie `Secure` or the browser will drop it on `http://127.0.0.1`. A production cookie should be `Secure`. The lab is not production.

:::exercise
### Prove HttpOnly

Using the snippet above as the shape, explain why `document.cookie` failing to show `bench_session` is a pass, not a bug.

:::hint
HttpOnly is exactly the flag that hides the cookie from page script.
:::

:::solution
The browser withholds HttpOnly cookies from JavaScript. `context.cookies()` reads them from the network stack via Playwright. Seeing the cookie in `document.cookie` would mean the flag was lost. The assertion `not.toContain("bench_session")` is the security check.
:::
:::

:::exercise
### Shelf is not a cookie

After adding rustc, name the API that should see `bench-shelf`, and the API that should not.

:::hint
The shelf is `localStorage`. Cookies are the other jar.
:::

:::solution
`page.evaluate(() => localStorage.getItem("bench-shelf"))` returns the JSON. `context.cookies()` does not contain the shelf. The server sees the shelf only because checkout copies it into the form body.
:::
:::

:::quiz
Playwright 1.65 cookie URL matching follows which document?
- A Playwright-only prefix rule
+ RFC 6265
- The HTML living standard's cookie section only, ignoring paths
- `localStorage` rules
Path and domain matching got stricter. A `/api` cookie no longer leaks to `/apiv2`.
:::

:::quiz
HttpOnly means:
- The cookie is encrypted
+ Page JavaScript cannot read the cookie, and Playwright's context API still can
- The cookie is skipped by `storageState`
- The cookie lives in sessionStorage
`storageState` includes it. `document.cookie` does not.
:::

:::quiz
Why is the lab cookie not marked Secure?
- Secure was removed in 1.65
+ The lab is served over HTTP on localhost, and Secure cookies are not stored there
- HttpOnly and Secure conflict
- The setup project deletes Secure cookies
Production cookies should be Secure because production is HTTPS. Copying that flag onto this HTTP fixture would drop the session.
:::
