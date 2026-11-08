---
number: 19
slug: projects-dependencies-grep
title: Projects, dependencies, tags, and grep
module: Fixtures and config
minutes: 35
summary: The setup project, dependencies, @tags, grep, and the 1.65 exclusive lock.
source: Projects | https://playwright.dev/docs/test-projects
source: Annotations and tags | https://playwright.dev/docs/test-annotations
source: Command line | https://playwright.dev/docs/test-cli
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
---

## Intuition

You already met projects as "Chromium and Firefox." The part that scales a suite is dependencies and filters.

A dependency is a project that must finish first. The setup project logs in and writes storage state. Browser projects list `dependencies: ["setup"]`. The runner will not start Chromium tests until setup has produced the file. Setup is not a `beforeEach`. It does not run inside the browser project. It is its own project with its own workers. UI mode, by default, does not run the setup project every time, so that clicking around stays fast. The auth docs tell you to run the setup test by hand when the saved state expires. On this lab the cookie does not expire. You still should know the UI-mode quirk before you trust a green UI run that never logged in.

Filters select tests inside a project. `grep: /@cross/` on Firefox means the title or the tag must match. A tag is `@` plus a word, either in the title or in `{ tag: "@cross" }`. `--grep @cross` on the CLI does the same. `--grep-invert @slow` excludes. The annotations guide shows an OR as `@fast|@slow` and an AND as a lookahead. You will mostly need OR.

`testIgnore` and `testMatch` on a project narrow files. The setup project's `testMatch` is `/auth\.setup\.ts$/`, so it does not run the specs. The browser projects ignore that file so the login does not run a second time as a normal test.

## Worked example

A second project that only runs smoke, still after setup:

```ts
{
  name: "smoke-chromium",
  dependencies: ["setup"],
  grep: /@cross/,
  testMatch: /smoke\.spec\.ts/,
  use: { ...devices["Desktop Chrome"] },
}
```

You do not have to add it. `npx playwright test tests/smoke.spec.ts --project=chromium` is the same filter without a new project. Add a project when CI should have a named job, or when the `use` options differ, such as a mobile viewport.

The exclusive lock from 1.65:

```ts
test("restart the server", { lock: "-exclusive-" }, async () => {
  // no other test runs while this one runs
});
```

The built-in lock name `-exclusive-` means this test runs alone. Other tests stay parallel with each other. You would use it for a case that restarts Workshop Bench, which this suite does not do because the server is started once by `webServer`. If you add a test that mutates process-wide server state, the lock is the honest annotation. Do not set workers to 1 for the whole suite to protect one test.

Tags in this repo mark the cross-browser subset. The visual test is untagged and also calls `test.skip` for non-Chromium. Defense in depth: the project filter and the skip. If someone runs the file with `--project=firefox` and a looser grep, the skip still holds.

:::callout compare
Make targets versus projects
`make firefox` that duplicates recipes drifts. A Playwright project is a target that shares the test bodies. Dependencies are the order, the way a Make prerequisite is the order. The recipe stays in the spec, not in the shell script.
:::

## Grep is a regex

`grep: /@cross/` matches that substring in the title. A test named "across the catalog" would also match. Tags include the `@` so a normal English word does not collide. Keep tag names ugly on purpose: `@cross`, `@slow`, `@a11y`.

`--grep` and a project grep both apply. A CLI grep intersects the project grep. If Firefox is already `@cross` and you pass `--grep shelf`, you get Firefox tests that are tagged `@cross` and mention shelf.

1.65 sharding note, again, because it bites CI: if you pass `--shard=3/5` and the total suite matches nothing, the run fails with "No tests found." An empty shard is allowed when another shard has tests. Do not "fix" a bad grep by ignoring that error.

:::exercise
### Add a tag

Mark `tests/api.spec.ts`'s GET test so the Firefox project runs it, without adding the test to a new file. The project grep is already `/@cross/`.

:::hint
The title string is the simplest tag location. This repo already did it. Write the title.
:::

:::solution
```ts
test("GET /api/packages returns the six pins @cross", async ({ request }) => {
  // ...
});
```
You can also use `test("...", { tag: "@cross" }, async ({ request }) => {})`.
:::
:::

:::exercise
### Depend on setup

You add a project `webkit-phone` with a mobile device descriptor. Tests in it call `/maintainer` with the saved storage state. What must the project include so the file exists first?

:::hint
The setup project is the only writer of `playwright/.auth/maintainer.json`.
:::

:::solution
`dependencies: ["setup"]` on `webkit-phone`. The storage file is produced by the setup project, not by the phone project itself.
:::
:::

:::quiz
UI mode and the setup project: what is the documented default?
- Setup runs before every UI test automatically
+ UI mode skips the setup project unless you run that test yourself
- Setup cannot be a project
- UI mode ignores dependencies and fails
The auth guide warns about this. Run `auth.setup.ts` from the UI when the saved login expires.
:::

:::quiz
`lock: "-exclusive-"` means what?
- The test is skipped
+ This test runs with no other test running, while the rest stay parallel
- The file is serial forever
- Workers are set to 1 for the whole config
It is a lock around one test, not a global `workers: 1`.
:::

:::quiz
A project `grep` of `/@cross/` and a CLI `--grep shelf` together select tests that:
- Match either pattern
+ Match both patterns
- Match the CLI only
- Ignore tags
The filters intersect. You get the cross-browser shelf cases, not every shelf case and not every cross case.
:::
