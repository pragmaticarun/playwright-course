---
number: 36
slug: mcp-tools-and-snapshots
title: MCP tools, capabilities, and snapshots versus screenshots
module: Playwright MCP
minutes: 45
summary: The 0.0.84 tool list, opt-in capability groups, and why browser_snapshot is the action surface.
source: Playwright MCP README, tools | https://github.com/microsoft/playwright-mcp/blob/main/README.md
source: @playwright/mcp 0.0.84 | https://www.npmjs.com/package/@playwright/mcp
source: Aria snapshots | https://playwright.dev/docs/aria-snapshots
source: Locators | https://playwright.dev/docs/locators
---

## Intuition

The MCP server exposes tools. Each tool has a name, a description, and parameters. The model picks a tool. The server runs the corresponding Playwright call and returns text, usually an accessibility snapshot. That snapshot is the same idea as lesson 3: roles and names, not pixels. The README's opening line says the server uses structured accessibility snapshots so it does not need a screenshot or a vision model.

`browser_snapshot` is titled "Page snapshot" and its description says to capture the accessibility snapshot, and that this is better than a screenshot. `browser_take_screenshot` says you cannot perform actions based on the screenshot and to use `browser_snapshot` for actions. Screenshots are for you, and for cases the accessibility tree cannot see, such as a canvas. They are not the coordinate system for clicks in the default tool set.

Clicks take a `target` that is an element reference from the snapshot, or a unique selector, plus an optional human-readable `element` string used to obtain permission to interact. The model should quote the ref from the snapshot it just received. A selector written from memory is how it clicks the wrong node. `browser_find` searches the snapshot for text or a regex and returns small slices with their path. The README describes it as cheaper than shipping the whole tree when you only need one node.

## Capability groups in 0.0.84

The README's tool list marks opt-in groups. The default core set includes navigation, snapshot, screenshot, click, type, fill form, dialogs, tabs, file upload, console, network listing, resize, and `browser_run_code_unsafe`. You will leave that last one off in the next lesson's policy even though it is present. These groups are explicit:

- `--caps=config` adds `browser_get_config`.
- `--caps=network` adds routing and offline mode: `browser_route`, `browser_unroute`, `browser_network_state_set`, and the route list.
- `--caps=storage` adds cookie and storage tools, including `browser_storage_state` and `browser_set_storage_state`.
- `--caps=devtools` adds highlight, tracing, and video tools.
- `--caps=vision` adds coordinate mouse tools such as `browser_mouse_click_xy`.
- The config type and the `--caps` flag also name `pdf` for PDF generation.

`--caps` is a comma-separated list. The environment variable is `PLAYWRIGHT_MCP_CAPS`. Enable a group when the task needs it. Vision tools click raw coordinates and miss the accessibility story this course spent ten lessons on. Leave them off unless the tree genuinely has no node, and even then prefer to fix the tree.

`browser_tabs` can open a tab in a named isolated context. Tabs in one isolated context share cookies. Tabs in different contexts do not. That is the context model from lesson 8, exposed as a parameter.

## Worked example

A careful sequence against the lab, as an agent would be instructed, not as a replacement test:

1. `browser_navigate` to `http://127.0.0.1:4471/`.
2. `browser_snapshot`.
3. Find the button whose name is "Rust" in the snapshot and `browser_click` its `target` ref.
4. Snapshot again and confirm the adb link is gone and rustc remains.

The deterministic version of that sequence is `tests/locators.spec.ts`. Keep the spec. Use the agent when you are lost in an unfamiliar UI and you want a draft.

`browser_fill_form` takes an array of fields. It is the batch form of fill. The toolchain form is still clearer as a committed test with `getByLabel`. The tool is for exploration.

`browser_network_requests` lists requests since navigation. `browser_network_request` takes the 1-based index and returns headers and body. That body can contain a session token. The secrets lesson is about redacting it. Do not enable network detail tools and paste the result into a public chat.

:::callout compare
Snapshot versus framebuffer
`adb exec-out screencap` is a framebuffer. You can look at it. You cannot ask it for the accessible name. An accessibility snapshot is the tree TalkBack would walk. `browser_snapshot` returns that tree. `browser_take_screenshot` returns the framebuffer. Act on the tree.
:::

## Refs go stale

A snapshot ref names a node in that snapshot. After a click, the page may have rendered new nodes. Take another snapshot before the next click. Reusing a ref across navigations is the MCP version of a dangling pointer. The server may recover by selector. Do not count on it.

`browser_wait_for` waits for text to appear or disappear, or for a number of seconds capped at 30. Prefer waiting for text. A fixed time is the sleep you already learned to avoid, with a cap so the model cannot ask for an hour.

`browser_evaluate` runs a function in the page. It is powerful and it is page script, not Node. `browser_run_code_unsafe` runs Playwright code in the server process and the README calls it RCE-equivalent. The next lesson refuses it for untrusted pages.

:::exercise
### Map a tool to an API

Which MCP tool corresponds to each committed test idea? 1) Open `/status`. 2) Read the accessibility tree. 3) Press "Unlock notes" using a ref from the tree.

:::hint
The names are `browser_navigate`, `browser_snapshot`, and `browser_click`.
:::

:::solution
1. `browser_navigate` with the lab URL. 2. `browser_snapshot`. 3. `browser_click` with the `target` ref of the button named "Unlock notes" from the latest snapshot.
:::
:::

:::exercise
### Leave a capability off

You want the agent to check the catalog heading. A config enables `vision`, `storage`, and `devtools`. Which of those does the task need?

:::hint
The heading is in the accessibility tree. Core tools already include snapshot and navigate.
:::

:::solution
None. Core navigation and `browser_snapshot` are enough. Vision clicks coordinates. Storage reads cookies. DevTools starts traces and video. Extra capabilities are extra data leaving the browser. Enable them for a task that names them.
:::
:::

:::quiz
The README tells the model to act using which tool?
- `browser_take_screenshot` coordinates
+ `browser_snapshot`, because actions should use the accessibility snapshot
- `browser_mouse_click_xy` by default
- `browser_run_code_unsafe` for every click
The screenshot tool's own description points back to the snapshot for actions.
:::

:::quiz
`--caps=vision` adds tools that:
- Read axe violations
+ Click and move by coordinates
- Replace the test runner
- Disable snapshots
Coordinate tools are opt-in because they bypass the tree. Keep them off when the tree has the node.
:::

:::quiz
`browser_find` exists to:
- Download a HAR
+ Search the accessibility snapshot and return small matches instead of the whole tree
- Run axe
- Install browsers
The README describes it as a cheaper way to locate one node and its ref.
:::
