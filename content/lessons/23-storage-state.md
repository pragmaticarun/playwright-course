---
number: 23
slug: storage-state
title: Storage state and the setup project
module: Authentication
minutes: 40
summary: Log in once, save cookies and localStorage, and load them with test.use. Do not commit the file.
source: Authentication | https://playwright.dev/docs/auth
source: BrowserContext.storageState | https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state
source: Projects | https://playwright.dev/docs/test-projects
---

## Intuition

Logging in through the UI on every test is slow and noisy. Playwright's answer is storage state: a JSON file of cookies and origins' local storage. You create it once in a setup project. You load it with `storageState` in the config or with `test.use`. Each test still gets a new context. The new context starts from the file, like restoring a profile snapshot, not like sharing a live context.

The official guide asks you to put the file in `playwright/.auth` and gitignore it. The file can impersonate the user. On this lab the user is a fixture, and the file is still gitignored, because the habit is the point. The guide's warning is not limited to production cookies.

IndexedDB is not in the snapshot unless you pass `indexedDB: true`. Session storage is not in the snapshot at all. The auth guide shows a small `addInitScript` pattern if a real app keeps the token in `sessionStorage`. Workshop Bench uses an HttpOnly cookie, `bench_session=maintainer`, which storage state does capture. You do not need the IndexedDB flag here.

UI mode does not run the setup project by default. If the notes test fails only in UI mode, run `auth.setup.ts` once from the UI filter, then run the notes test again.

## Worked example

`tests/auth.setup.ts`:

```ts
import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(__dirname, "../playwright/.auth/maintainer.json");

setup("authenticate as maintainer", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.goto("/login");
  await page.getByLabel("Name").fill("maintainer");
  await page.getByLabel("Passphrase").fill("shelf-note");
  await page.getByRole("button", { name: "Unlock notes" }).click();
  await page.waitForURL("**/maintainer");
  await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
```

`setup` is `test` renamed so the file reads as a setup. The project `testMatch` selects it. The browser projects depend on that project.

A test file opts in:

```ts
test.use({ storageState: "playwright/.auth/maintainer.json" });

test("storage state opens signing notes", async ({ page }) => {
  await page.goto("/maintainer");
  await expect(page.getByText("rotate the local bench key")).toBeVisible();
});
```

The passphrase does not appear in the test. It appears in the setup file, as a lab fixture, next to the server constant. A real project reads the password from an environment variable that CI injects, not from the repository. This course keeps the fixture visible because hiding `shelf-note` would pretend the lab has a secret worth stealing. Do not copy that visibility into a staging password.

Resetting for one test:

```ts
test.use({ storageState: { cookies: [], origins: [] } });
```

The auth guide uses that to opt out when the project-wide default is authenticated. This repo does the opposite: the default is empty, and the notes tests opt in. Either way is fine if it is explicit.

:::callout warn
The cookie is a key
Anyone with `maintainer.json` can open `/maintainer` on a server that accepts that cookie. The lab binds to localhost and the cookie is not a production session. The file is gitignored anyway. If you point the same pattern at a real site, treat the JSON like a password manager export.
:::

## Multiple roles

The guide's advanced section writes `admin.json` and `user.json` from two setup tests, then `test.use` picks a file per describe. Two roles in one test means two contexts:

```ts
const admin = await browser.newContext({ storageState: "playwright/.auth/admin.json" });
const user = await browser.newContext({ storageState: "playwright/.auth/user.json" });
```

Close both. The lab has one role. The capstone's authenticated describe loads the one file and opens the notes. The order test in the capstone does not load it, and it does not need to: ordering is anonymous.

API login is the other advanced path: `request.post` the credential endpoint, then `request.storageState({ path })`. Use it when the product has a real token endpoint. The lab's login is a form. The setup project uses the form so the test covers the form.

:::exercise
### Opt in without retyping

Write the two lines a new spec needs, besides the import, to open `/maintainer` already signed in. Assume setup has run.

:::hint
`test.use` is outside the test body. `goto` is inside.
:::

:::solution
```ts
test.use({ storageState: "playwright/.auth/maintainer.json" });

test("notes", async ({ page }) => {
  await page.goto("/maintainer");
  await expect(page.getByRole("heading", { name: "Signing notes" })).toBeVisible();
});
```
:::
:::

:::exercise
### Why wait for the URL

The setup clicks "Unlock notes" and immediately calls `storageState` with no `waitForURL`. The file sometimes has no cookie. Why?

:::hint
The cookie is set on the redirect response. Saving too early captures the pre-login jar.
:::

:::solution
`storageState` writes the jar at that moment. Without `waitForURL("**/maintainer")` or a heading assertion, you can save the context before the 303 is applied. Wait until the notes page is visible, then save.
:::
:::

:::quiz
Storage state restores what by default?
- Session storage and IndexedDB
+ Cookies and localStorage for the saved origins
- The browser binary
- Server-side rows
Pass `indexedDB: true` only when you need IndexedDB. Session storage needs an init script. The lab cookie is included.
:::

:::quiz
Where does this course put the auth file?
- `tests/auth.setup.ts`, committed
+ `playwright/.auth/maintainer.json`, gitignored
- Inside the HTML report
- `localStorage` of the setup project's machine, only
The setup test writes the JSON. Git ignores the directory. CI recreates it every run.
:::

:::quiz
`dependencies: ["setup"]` exists so that:
- Every test logs in through the UI
+ The storage file is written before browser projects read it
- Firefox can skip Chromium
- `test.use` is unnecessary
The dependency edge is the order. The file is the payload.
:::
