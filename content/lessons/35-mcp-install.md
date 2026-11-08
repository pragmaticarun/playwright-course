---
number: 35
slug: mcp-install
title: The official Playwright MCP server
module: Playwright MCP
minutes: 45
summary: Install @playwright/mcp 0.0.84 from Microsoft, wire it into a client, and choose stdio or a port.
source: Playwright MCP README | https://github.com/microsoft/playwright-mcp/blob/main/README.md
source: @playwright/mcp on npm | https://www.npmjs.com/package/@playwright/mcp
source: Playwright installation | https://playwright.dev/docs/intro
---

## Intuition

Playwright MCP is an official server, published by Microsoft as `@playwright/mcp`, that lets an agent drive a browser through the Model Context Protocol. It is not a third-party wrapper and it is not the test runner. The test runner executes files you committed. The MCP server executes tool calls an agent chooses at runtime. That difference is the whole rest of this module.

The npm page checked for this course shows version **0.0.84**, updated 3 November 2026, with `playwright` on the 1.65 line. The README in that release is the source for the flags and tool names below. The getting-started snippet in the README uses `@playwright/mcp@latest`. Pin `0.0.84` in anything you share, the same way this course pins `@playwright/test@1.65.0`. `@latest` moves.

The README also distinguishes MCP from Playwright CLI plus skills. CLI invocations stay smaller in the model's context. MCP keeps a live browser and a rich snapshot, which suits exploration. Use the test runner for the suite you want to stay green. Use MCP to look at a page and draft a test. Do not replace the suite with a chat transcript.

## Worked example

The standard client config from the README, pinned:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@0.0.84", "--headless"]
    }
  }
}
```

By default the server runs **headed**. `--headless` is the flag you want on a machine without a display. The environment variable is `PLAYWRIGHT_MCP_HEADLESS`. Node 18 or newer is the README's requirement for the server. This course's test runner is stricter, Node 22 or newer, and using 22 for both keeps one toolchain.

Stdio is the default: the client spawns `npx` and speaks MCP on stdin and stdout. No port is open. That is the right default on a laptop.

A standalone server for a client that wants a URL:

```bash
npx @playwright/mcp@0.0.84 --headless --port 8931
```

The README's client snippet then uses `"url": "http://localhost:8931/mcp"`. The server binds localhost unless you pass `--host`. `--host 0.0.0.0` listens on every interface. Do not do that on a shared network. The `--allowed-hosts` list is DNS-rebinding protection, not a general firewall. The README says the allowed-origins list is **not** a security boundary and does not affect redirects. Treat those flags as foot-guns reducers, and keep the process on localhost.

A JSON config file merges the same options:

```bash
npx @playwright/mcp@0.0.84 --config playwright.mcp.json
```

The README's config type includes `browser`, `server`, `capabilities`, `secrets`, `network`, `timeouts`, and `imageResponses`. You will meet capabilities and secrets in the next two lessons. Start with the default capability set and headless localhost.

:::callout note
Profiles on disk
The default profile is persistent, under `~/.cache/ms-playwright/mcp-{channel}-{workspace-hash}` on Linux. A persistent profile keeps logins. That is convenient and dangerous. `--isolated` keeps the profile in memory and drops it when the browser closes. Use isolated mode for this course. Pass `--storage-state` only when you mean to load the lab's `maintainer.json`, and never a production jar.
:::

## What you should see

A client that supports MCP tools will list names such as `browser_navigate`, `browser_snapshot`, and `browser_click`. If the list is empty, the client did not spawn the server: check the `npx` path, the pin, and whether the client expects `command` or `url`. The README has per-client snippets for a long list of tools. The shape is the same JSON.

You do not need the MCP server to run `npx playwright test`. Installing it is optional. The tests in this repo do not talk to it. The lessons exist so that when you do wire an agent, you wire the official server and you know what it can call.

`createConnection` from `@playwright/mcp` is mentioned in the README for embedding. The Playwright team has described that entry as experimental. Prefer the CLI in the client config unless you are embedding on purpose.

:::exercise
### Write a pinned config

Write a stdio config that runs `@playwright/mcp@0.0.84` headless and isolated.

:::hint
Flags go in `args` after the package name. Isolated mode is `--isolated`.
:::

:::solution
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@0.0.84", "--headless", "--isolated"]
    }
  }
}
```
:::
:::

:::exercise
### Choose a transport

You are on a laptop, one client, one repo. A teammate suggests `--host 0.0.0.0 --port 8931` so "other machines can help." What do you run instead, and why?

:::hint
Stdio does not open a port. The allowed-hosts check is not a product firewall.
:::

:::solution
Use the stdio config with no `--port` and no `--host`. The client spawns the server itself. A listener on every interface exposes a browser-driving endpoint to the network. The README's allowed-hosts list will not save you from a client that can already reach the port.
:::
:::

:::quiz
Which package is the official MCP server?
- `playwright-core` only
+ `@playwright/mcp`, from Microsoft
- A random `mcp-playwright` mirror
- `@axe-core/playwright`
The npm page and the `microsoft/playwright-mcp` repository are the upstream. Pin 0.0.84 for this course.
:::

:::quiz
The server is headed by default. How do you make it headless?
- It is always headless
+ `--headless` or `PLAYWRIGHT_MCP_HEADLESS`
- `--isolated`
- By installing WebKit only
The README's flag table lists `--headless` as opt-in. The test runner's default is a separate question.
:::

:::quiz
`--allowed-origins` is:
- A security boundary that blocks redirects
+ Documented as not a security boundary and not a redirect control
- The same as `--isolated`
- Required for stdio
The README says this plainly. Do not describe the flag as an authorization system.
:::
