# Versions and what was actually executed

Checked against the published packages and the Playwright release notes on 8 November 2026.

| Package | Pin |
| --- | --- |
| `@playwright/test` | 1.65.0 |
| `playwright` (dependency of the test runner) | 1.65.0 |
| `@playwright/mcp` (taught, not a runtime dependency of this repo) | 0.0.84 |
| `@axe-core/playwright` | 4.14.0 |
| `next` | 16.4.5 |
| `react` / `react-dom` | 19.3.0 |
| Node used for the local run | 22.23.4 |

Playwright 1.65.0 ships Chromium 158.0.8127.18, Firefox 159.0, and WebKit 27.2. The browser builds installed for the local run are the Playwright cache revisions `chromium-1254`, `firefox-1572`, and `webkit-2388`.

Primary sources for those numbers:

- https://playwright.dev/docs/release-notes
- https://github.com/microsoft/playwright/releases/tag/v1.65.0
- https://www.npmjs.com/package/@playwright/mcp
- https://github.com/microsoft/playwright-mcp/blob/main/README.md

## Local test run

Command: `npx playwright test`

Result: **130 passed, 0 failed**, 17.0s, on this Ubuntu machine.

| Project | Tests | What ran |
| --- | --- | --- |
| setup | 1 | `tests/auth.setup.ts` signs in as `maintainer` and writes storage state |
| chromium | 49 | Every example spec and every project spec, including the visual baseline and the axe scans |
| firefox | 40 | Specs tagged `@cross` |
| webkit | 40 | The same `@cross` specs |

Chromium-only specs, because they depend on a Linux screenshot, a download, a route, or a storage-state file that the cross projects do not reload:

- `tests/uploads.spec.ts` — upload buffer and download
- `tests/network.spec.ts` — `page.route` fulfills a down mirror (the unmocked status test is `@cross` and did run on Firefox and WebKit)
- `tests/maintainer.spec.ts` — storage state
- `tests/waiting.spec.ts` — the inert panel (the delayed-text test is `@cross`)
- `tests/a11y.spec.ts` — the broken page (the clean page is `@cross`)
- `tests/visual.spec.ts` — `bench-poster.png`, skipped unless the project name is `chromium`
- `projects/capstone/bench.spec.ts` — the axe scan and the authenticated notes describe (the order flow is `@cross`)

WebKit needed the system libraries named in the Playwright install-deps list (`libxslt1.1`, `libevent-2.1-7t64`, GStreamer, `libavif16`, `libharfbuzz-icu0`, `libwayland-server0`, `libmanette-0.2-0`, `libhyphen0`). After those packages were installed, the WebKit project passed. An earlier attempt failed at `browserType.launch` before those libraries existed. That earlier failure is not the result above.

The course-site checks are a separate command, `npm run test:site`, against the dev server on `http://127.0.0.1:43123`. That run used Chromium only: **3 passed, 0 failed**. It searched for a nonsense string and for "prompt injection", opened lesson 38, copied a code block, opened a hint and a solution, checked a quiz answer, marked the lesson complete, toggled dark mode, reloaded, and confirmed `localStorage` on the progress page. A second test requested an unknown lesson and got 404. A third test used a 390×844 viewport, opened the lesson menu, and landed on lesson 01. Screenshots from that run are in the artifacts directory.
