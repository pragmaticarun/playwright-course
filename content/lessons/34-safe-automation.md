---
number: 34
slug: safe-automation
title: Safe automation
module: Structure
minutes: 35
summary: Automate your lab and your own sites. Do not automate other people's accounts, inboxes, or paywalls. Leave a trace you can explain.
source: Best practices | https://playwright.dev/docs/best-practices
source: Authentication warning | https://playwright.dev/docs/auth
source: Browser contexts | https://playwright.dev/docs/browser-contexts
---

## Intuition

Playwright will drive any site the browser can open. That is the same power as a person at the keyboard, executed faster and without shame. The limit is not a missing API. The limit is what you point it at.

Automate applications you or your team own, local fixtures like Workshop Bench, and third parties where you have a written agreement or a documented test account. Do not automate a login against a bank, a school, a mailbox, or a social network to "save time." Do not scrape a site that told you not to, and do not bypass a paywall, a captcha, or an access-control check. A test that exists to defeat a control is not a test. It is the control's threat model.

The lab is designed so you can practice every API in this course without leaving `127.0.0.1`. The fixture passphrase `shelf-note` is not a password you reuse. The signing-notes page is not a place to paste a real key. The upload lesson uses a buffer of the word `rustc` because a file input pointed at `~/.ssh` would be a bug in the test, not a feature.

Speed is part of safety. A tight loop of navigations against a host you do not own is a denial of service with extra steps. Parallel workers multiply that. Point load at a server you are allowed to load, or at the lab.

## Worked example

A boundary you can put in code is the base URL. This suite only calls `baseURL` on the lab. A test that `goto`s an absolute `https://` URL to somewhere else is a test that left the fixture. Review those in code review the way you would review a shell script that `curl`s an internal admin port.

Storage state is the other boundary. The auth guide tells you the file can impersonate the user and must not be committed. Traces and videos can contain the same cookies and the text of the page. The HTML report artifact is a zip of that. Do not upload a trace of a production admin session to a public bucket. The lab trace is fine. A trace of your real mail is not.

```ts
test.use({
  baseURL: "http://127.0.0.1:4471",
  trace: "on-first-retry",
});
```

If `baseURL` is production, `trace: "on"` is a decision you make with your security team, not a default you copy from a tutorial.

The MCP server, in the next lessons, can navigate anywhere the model asks. That is a larger blast radius than a committed spec, because the target is chosen at runtime by text. The rules in this lesson apply there with less mercy: isolated profile, no real cookies, no `browser_run_code_unsafe` on a page you do not trust, secrets out of the prompt.

:::callout warn
What this course will not teach
It will not teach you to evade bot detection, solve captchas, take over an account, or hide automation from a site that refused it. Those are bypasses. The APIs you have are for apps you are allowed to drive.
:::

## A checklist before a suite leaves your laptop

1. The base URL is a host you own or a local fixture.
2. Credentials come from the environment on CI, and the workflow does not echo them.
3. `playwright/.auth` is gitignored. You grepped the diff for `storageState` JSON.
4. Uploads use buffers or files created in `testInfo.outputPath`.
5. Parallel workers are not aimed at a shared production account.
6. Traces of sensitive pages stay in a private artifact store.
7. Axe and the keyboard pass are part of "done," not a follow-up that never happens.
8. You can explain every `route.fulfill` as a test double, not as a way to skip an authorization check in the product.

If a product bug is "the authorization check fails open," write a test that expects the denial. Do not route around the check so the rest of the test can proceed, and then ship that route in the suite forever. A mock that skips auth becomes the suite's reality.

:::exercise
### Classify three ideas

Say which of these belong in this repo and which do not. 1) A test that logs into Workshop Bench as `maintainer`. 2) A test that logs into your personal bank to download a statement. 3) A `setInputFiles` of a buffer named `pins.txt`.

:::hint
Ownership and the shape of the data both matter.
:::

:::solution
1 belongs: it is the lab fixture. 2 does not: it is your bank, and a test is the wrong place for that credential. 3 belongs: it is synthetic bytes. A path to a real keystore would not.
:::
:::

:::exercise
### Review a trace upload

CI uploads `playwright-report/` on every run. The suite starts logging into a staging admin that shows customer names. What do you change before the next run?

:::hint
The report can contain snapshots, cookies, and the customer names.
:::

:::solution
Stop tracing that project by default, or keep the artifact in a private store with a short retention and a restricted ACL. Do not publish the report next to a public Pages site. Prefer synthetic customers in the fixture data so a leaked trace is boring.
:::
:::

:::quiz
The lab passphrase is in the repo because:
- Production secrets belong in git
+ It is a localhost fixture with no power outside this process, and a real secret must not be copied the same way
- Playwright requires the password in the spec
- HttpOnly cookies cannot be set otherwise
The setup file and the server share `shelf-note`. A staging password belongs in a secret store.
:::

:::quiz
A `page.route` that returns 200 for an admin API the test's user should not call is:
- A good isolation strategy
+ A mock that hides an authorization bug, and it should not be the suite's default
- Required by axe
- The exclusive lock
Test the denial. Mock payloads the UI must render, not permissions you wish the user had.
:::

:::quiz
Parallel workers against a production account are risky because:
- Workers cannot send cookies
+ They multiply traffic and share server-side state you may not own safely
- Firefox ignores robots rules
- `baseURL` is ignored
Even a polite test becomes a load test at `workers: 8`. Aim that at the lab or at a capacity plan.
:::
