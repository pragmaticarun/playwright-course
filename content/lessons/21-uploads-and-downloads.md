---
number: 21
slug: uploads-and-downloads
title: File uploads and downloads
module: Interactions
minutes: 35
summary: setInputFiles with an in-memory buffer, and waitForEvent("download") armed before the click.
source: Downloads | https://playwright.dev/docs/downloads
source: File upload | https://playwright.dev/docs/input#upload-files
source: Download class | https://playwright.dev/docs/api/class-download
---

## Intuition

File inputs and downloads are both races if you treat them like ordinary clicks. The upload side is a control that the browser will not let page JavaScript point at an arbitrary path. Playwright sets the file from the test process, which is outside the page. The download side is an event that can fire as soon as the click starts the navigation. You arm `waitForEvent("download")` before the click, the same way you arm a dialog waiter.

`setInputFiles` accepts a path or a payload `{ name, mimeType, buffer }`. Prefer the payload in this course. A path in the test would depend on the machine's disk layout. A buffer is the bytes you mean. The lab's upload test sends `Buffer.from("rustc\n")` named `pins.txt` and expects the echo `Received pins.txt (6 bytes).` The server parses multipart just enough to read the filename and the length. It does not write the file into the repo. That keeps parallel tests from colliding on `pins.txt` on disk.

Downloads land in a temporary directory the runner manages. `download.suggestedFilename()` is the name the server offered, here `bench-notes.txt`, from `Content-Disposition` and the `download` attribute. `download.path()` is the temp file, available because the browser runs locally. `download.saveAs` copies it somewhere you choose. Use `testInfo.outputPath` if you need to keep it. Do not save downloads into the working tree on every run.

The lab file is a fixture, not a secret. Do not point `setInputFiles` at `~/.ssh` or at a real keystore to "see if upload works." Use a buffer. The safe-automation lesson is the policy. This lesson is the API.

## Worked example

```ts
await page.goto("/upload");
await page.getByLabel("Manifest").setInputFiles({
  name: "pins.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("rustc\n"),
});
await page.getByRole("button", { name: "Upload manifest" }).click();
await expect(page.getByText("Received pins.txt (6 bytes).")).toBeVisible();
```

`getByLabel("Manifest")` is the file input. `setInputFiles` does not submit the form. The button does. If you forget the click, the server never sees the multipart body.

```ts
await page.goto("/download");
const downloadPromise = page.waitForEvent("download");
await page.getByRole("link", { name: "Download bench notes" }).click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toBe("bench-notes.txt");
expect(await download.path()).toBeTruthy();
```

`suggestedFilename()` is synchronous. `path()` is async and returns `null` if you configured a remote browser that deletes the download. Local browsers return a path. Read it with `fs` if you need the bytes:

```ts
import fs from "node:fs";
const text = fs.readFileSync(await download.path() as string, "utf8");
expect(text).toContain("Workshop Bench notes");
```

The `as string` is because the type includes `null`. Throw if it is null rather than asserting on a missing file.

:::callout warn
Do not upload real credentials
A file input will happily send a private key if you hand it the path. Tests should construct the smallest buffer that exercises the parser. The lab never needs your Android keystore.
:::

## Multiple files and clearing

`setInputFiles` with an array uploads several files when the input has `multiple`. The lab input does not. Calling `setInputFiles([])` clears the choice. A test that asserts the required-field error can clear the input and submit. The lab responds with "Manifest file is required" when the part is missing.

Large files: the server rejects bodies over 2 megabytes with status 413. You do not need a 2 megabyte fixture to prove the happy path. A six-byte buffer is the contract of the example test.

Download events also fire for attachments triggered by script, not only by a link. The waiter is the same. If a download never comes, you waited for the wrong action or the server returned a normal page. Assert the response content type while you debug, then put the assertion back on the filename the user sees.

:::exercise
### Upload cargo instead

Send a buffer whose text is `cargo\n` and whose filename is `crates.txt`. Compute the byte length and write the assertion text.

:::hint
`cargo\n` is 6 bytes as well. The echo format is `Received NAME (N bytes).`
:::

:::solution
```ts
await page.getByLabel("Manifest").setInputFiles({
  name: "crates.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("cargo\n"),
});
await page.getByRole("button", { name: "Upload manifest" }).click();
await expect(page.getByText("Received crates.txt (6 bytes).")).toBeVisible();
```
:::
:::

:::exercise
### Arm the download late

A test clicks "Download bench notes" and then calls `waitForEvent("download")`. It flakes. Rewrite the order.

:::hint
The download event can fire before the next line. The promise must exist first.
:::

:::solution
```ts
const downloadPromise = page.waitForEvent("download");
await page.getByRole("link", { name: "Download bench notes" }).click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toBe("bench-notes.txt");
```
:::
:::

:::quiz
Why prefer a buffer over a path in `setInputFiles` for this course?
- Buffers are slower, which tests timeouts
+ The bytes live in the test, so the suite does not depend on a machine path or a secret on disk
- Paths were removed in 1.65
- The lab server only accepts memory files
A path works. It also tempts you to point at a real file. The example uses a buffer of `rustc\n`.
:::

:::quiz
`download.path()` returns null when?
- The filename is wrong
+ The download is not available locally, such as some remote browser setups
- You forgot `suggestedFilename`
- The file is empty
Local runs in this repo return a path. Do not assume a remote grid does.
:::

:::quiz
The lab upload echo includes the byte length so that:
- The test can sleep that many milliseconds
+ A wrong buffer fails the assertion even if the filename is right
- Multipart boundaries stay secret
- Playwright computes the length for you
`pins.txt` of a different body would show a different length. The assertion locks both.
:::
