---
number: 30
slug: parallel-shard-retry
title: Parallelism, sharding, retries, and the exclusive lock
module: Scale
minutes: 35
summary: Workers are processes. Shards split CI machines. Retries classify flakes. The exclusive lock is for the one test that cannot share.
source: Parallelism | https://playwright.dev/docs/test-parallel
source: Sharding | https://playwright.dev/docs/test-sharding
source: Retries | https://playwright.dev/docs/test-retries
source: Release notes 1.65 | https://playwright.dev/docs/release-notes
---

## Intuition

A worker is a Node process with its own browser. `workers` in the config caps how many run at once. The default is a fraction of the CPU count. `fullyParallel: true` allows tests inside one file to occupy different workers. Without it, tests in a file share a worker and run one at a time, while different files still run in parallel.

Parallelism is safe when tests do not share mutable state. Browser state is already isolated. Server state is the risk. Workshop Bench keeps the catalog immutable and the shelf in the context. The suite can run parallel. A test that restarts the server cannot. 1.65's `lock: "-exclusive-"` runs that one test with every other test paused, without setting `workers: 1` for the whole suite.

Sharding splits the set across machines. `--shard=1/3` runs the first third. Each CI job uses a shard index. 1.65 fails the run with "No tests found" if every shard is empty, and still passes an empty shard when some other shard has tests. `--pass-with-no-tests` restores the loose behavior. A typo in `--grep` on a sharded job used to look like a green empty run. The new default is the one you want.

Retries re-run a failed test. `retries: process.env.CI ? 2 : 0` is this repo's choice. A pass on retry is reported as flaky. Flaky is not green in spirit. It means the assertion is racing or the product is racing. Fix it. Retries exist so a known-rare infrastructure blip does not block a release, and so the trace-on-first-retry has a chance to record the second attempt.

## Worked example

Local, one worker, when you are debugging a leak:

```bash
npx playwright test --project=chromium --workers=1
```

CI shard, three machines:

```bash
npx playwright test --shard=$SHARD_INDEX/3
```

The setup project still runs on each machine that needs the storage file, because each shard is a separate runner invocation. They do not share `playwright/.auth`. That is fine: setup is idempotent. They must not share a writable server account. The lab server is started per job by `webServer`, on that job's localhost. Shards do not collide.

An exclusive test:

```ts
test("restart workshop bench", { lock: "-exclusive-" }, async () => {
  // only if you really restart the process
});
```

This course has no such test. The example is the shape from the 1.65 notes. If you add a restart, you also have to coordinate with `webServer`, which expects the port to stay up. An exclusive lock does not stop the web server helper. It stops other tests. Restarting the server under a live `webServer` is a good way to flake the suite. Prefer a server that does not need restarts.

`test.describe.configure({ mode: "serial" })` is the older hammer: the whole group is ordered and a failure skips the rest. Serial is for a multi-step wizard you refuse to split. The exclusive lock is for "everyone else may run, but not during this test."

:::callout compare
make -j versus workers
`make -j8` runs recipes that must not share a writable `build/` without separate directories. Playwright workers are the same. Give each worker its own account, or keep the server stateless. The browser profiles are already separate directories.
:::

## Repeat and order

`--repeat-each=10` runs every test ten times. Use it locally when you suspect a flake and retries are off. If it passes ten times, you do not have a cheap flake. If it fails twice, you do.

The runner does not promise test order across files. Inside a serial describe, it does. Do not encode order by filename and hope. Build the state inside the test.

`maxFailures` stops the run after N failures. CI sometimes sets it so a broken deploy does not burn the whole shard. You lose coverage of later tests. Use it as a cost cap, not as a default on a healthy suite.

:::exercise
### Prove a shard setting

You want job 2 of 4. Write the flag. What does 1.65 do if a bad grep matches zero tests across all four jobs?

:::hint
The index is 1-based in the examples Playwright shows, of the form `i/n`. An entirely empty match is an error in 1.65.
:::

:::solution
`--shard=2/4`. If no shard has any test, the run fails with "No tests found." An empty shard 2 is allowed when the other shards have tests. Fix the grep rather than passing `--pass-with-no-tests` to hide it.
:::
:::

:::exercise
### Choose lock or workers

One test reboots a shared staging database. Fifty others only read. How do you keep the fifty parallel?

:::hint
You do not set global `workers: 1`.
:::

:::solution
Put `lock: "-exclusive-"` on the reboot test. The readers stay parallel with each other and pause only while the reboot runs. Better still, give the reboot its own database so you do not need the lock.
:::
:::

:::quiz
A worker is:
- A browser tab
+ A Node process that runs tests and owns a browser
- A shard index
- An exclusive lock
Tabs are pages. Workers are processes. Shards are separate CI invocations.
:::

:::quiz
A test that passes only on the second retry is:
- A pass you can ignore
+ Flaky, and the report says so
- An exclusive test
- A skipped test
Retries do not make the race go away. They give you a trace and a classification.
:::

:::quiz
1.65 sharding fails the whole run when:
- Any one shard is empty
+ No tests match in any shard
- You use Firefox
- `fullyParallel` is true
Empty shards are fine when sibling shards have work. A grep that matches nothing is a failure.
:::
