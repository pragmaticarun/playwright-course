---
number: 37
slug: ai-workflows-versus-tests
title: AI-driven workflows versus deterministic tests
module: Playwright MCP
minutes: 40
summary: An agent explores. A spec locks the behavior. Keep both, and do not let a transcript become the regression suite.
source: Playwright MCP README | https://github.com/microsoft/playwright-mcp/blob/main/README.md
source: Best practices | https://playwright.dev/docs/best-practices
source: Codegen | https://playwright.dev/docs/codegen
source: Trace viewer | https://playwright.dev/docs/trace-viewer
---

## Intuition

A deterministic test is a function. Given the lab and the pin of Playwright 1.65.0, `tests/locators.spec.ts` either passes or fails. You can run it on CI without a model. You can read it in review. You can blame a line.

An MCP session is a conversation. The model chooses tools based on the snapshot and the prompt. The next session may choose a different ref, a different order, or a different assertion. That is useful when you do not yet know the page. It is a bad regression test, because a green chat is not reproducible and a red chat is not a diff.

The README makes the split in its comparison with CLI skills: MCP keeps a live browser and rich introspection for exploratory and long-running loops. The test runner is the place where "this must keep working" lives. Codegen sits in between. It watches you click and writes a draft spec. You edit the draft into role locators and commit it. The committed file is the test. The chat that produced the draft is not.

Use an agent to: map an unfamiliar settings page, suggest a locator, explain a trace, draft a page object you then correct for the 1.65 constructor rule. Do not use an agent as the only check that checkout still returns `BN-ARUN`. Call `npx playwright test projects/capstone/bench.spec.ts` for that.

## Worked example

A loop that stays honest:

1. Start the lab: `npm run practice` or let the test runner's `webServer` do it.
2. Ask the agent, with the official MCP server in isolated headless mode, to snapshot `http://127.0.0.1:4471/forms` and list the accessible names of the controls.
3. Compare the list with `tests/forms.spec.ts`. If the agent found "Display name", "Channel", "Notes", and "Save preferences", the spec and the tree agree.
4. If the agent proposes `page.locator("#channel")`, reject it and keep `getByLabel("Channel")`.
5. Run the spec. The spec is the result. The transcript is a notebook.

WebMCP, from the Playwright 1.64 notes, is a different door: a page can register tools the browser exposes, and Playwright can call them with `page.webmcp` when the browser is launched with the experimental feature. Playwright MCP collects those tools by default as `webmcp_<name>` and you can pass `--no-webmcp` to opt out. That is the page offering an API to the agent. It is still not a substitute for a spec. A page can register a tool that lies. Your spec clicks the button and asserts the echo.

The failures worth turning into tests are the ones you can state as an assertion. "The status text becomes mirror down when `/api/status` returns `ok: false`" is a test. You already have it, with `page.route`, and it does not call a model. "The page feels confusing" is a prompt for a redesign, not a `test()` block.

:::callout compare
A flaky chat versus a flaky test
A flaky test is a defect you can retry, trace, and quarantine with `test.fixme`. A flaky chat is a model that sometimes picks the wrong button. You do not fix that by running the chat on every pull request and hoping. You fix it by committing the right locator.
:::

## What to paste back into the repo

Paste locators, not screenshots of the chat. Paste a page-object method that assigns locators in the constructor. Paste an axe scan if the agent noticed a missing label, then confirm with `@axe-core/playwright` so the check survives after the agent is gone.

Do not paste `browser_run_code_unsafe` snippets into the suite. The test file can do the same thing with `page.getByRole` more clearly, and the unsafe tool is a privilege you do not need in CI.

Do not paste storage-state JSON the agent saved from a real site. The lab's setup project writes the only auth file this course trusts, and it is gitignored.

When the agent and the spec disagree, believe the spec if it passes against the lab, then read the snapshot. The agent may have seen a different profile, a persistent login, or a stale ref. Isolated mode and a fresh lab process remove two of those.

:::exercise
### Turn a transcript into a test

The agent reports: on `/dialogs`, accepting the prompt with `cargo` leaves the text "Named cargo". Write the deterministic steps. Do not call MCP from the test.

:::hint
`page.once("dialog")` before the click. This is `tests/frames.spec.ts`.
:::

:::solution
```ts
await page.goto("/dialogs");
page.once("dialog", (dialog) => dialog.accept("cargo"));
await page.getByRole("button", { name: "Name the pin" }).click();
await expect(page.getByText("Named cargo")).toBeVisible();
```
:::
:::

:::exercise
### Reject a suite

A teammate wants CI to be "ask the agent to test the bench and pass if it says yes." Name two reasons that fails the course's bar, and the command to run instead.

:::hint
Reproducibility and the absence of a diff.
:::

:::solution
The agent's path can change between runs, and a yes in prose is not an assertion with a locator and a timeout. Run `npx playwright test`. Keep the agent in the authoring loop, not in the merge gate.
:::
:::

:::quiz
The regression suite should be:
- The longest MCP transcript that passed once
+ Committed Playwright tests that run without a model
- A folder of screenshots from the agent
- `browser_run_code_unsafe` calls checked into CI
Transcripts drift. Specs do not, until the product changes, which is when you want a failure.
:::

:::quiz
Codegen's role relative to MCP is:
- It replaces both the runner and the server
+ It records your clicks as a draft spec you edit and commit
- It only works with vision capabilities
- It writes storage state
You stay in the loop with codegen. The committed file is what CI runs.
:::

:::quiz
`--no-webmcp` does what?
- Disables accessibility snapshots
+ Opts out of exposing tools the page registered through the experimental WebMCP API
- Uninstalls `@playwright/mcp`
- Turns on vision clicks
Page-registered tools are on by default in the MCP server. Opt out when you do not want the page to hand the model extra tools.
:::
