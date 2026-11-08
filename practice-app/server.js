const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { PACKAGES } = require("./catalog");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4471);
const ASSETS = path.join(__dirname, "assets");
const FIXTURE_NAME = "maintainer";
const FIXTURE_PASSPHRASE = "shelf-note";

const ASSET_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout({ title, body, script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · Workshop Bench</title>
  <link rel="stylesheet" href="/assets/bench.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="top">
    <a class="brand" href="/">Workshop Bench</a>
    <nav aria-label="Bench">
      <a href="/">Catalog</a>
      <a href="/shelf">Shelf</a>
      <a href="/checkout">Check out</a>
      <a href="/status">Status</a>
      <a href="/login">Maintainer</a>
      <a href="/map">Practice map</a>
    </nav>
  </header>
  <main id="main">
    ${body}
  </main>
  <footer>
    <p>Local practice app for the Playwright course. The fixture account <code>maintainer</code> / <code>shelf-note</code> exists only in this process and only on localhost.</p>
  </footer>
  ${script ? `<script src="${script}"></script>` : ""}
</body>
</html>`;
}

function send(res, status, body, type = "text/html; charset=utf-8", extra = {}) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  });
  res.end(body);
}

function redirect(res, location, extra = {}) {
  res.writeHead(303, {
    Location: location,
    "Cache-Control": "no-store",
    ...extra,
  });
  res.end();
}

function readBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("body too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function cookiesOf(req) {
  const header = req.headers.cookie || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}

function signedIn(req) {
  return cookiesOf(req).bench_session === FIXTURE_NAME;
}

function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(delimiter);
  if (start < 0) return parts;
  start += delimiter.length;
  while (start < buffer.length) {
    if (buffer.subarray(start, start + 2).toString() === "--") break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const next = buffer.indexOf(delimiter, start);
    if (next < 0) break;
    let chunk = buffer.subarray(start, next);
    if (chunk.length >= 2 && chunk[chunk.length - 2] === 13 && chunk[chunk.length - 1] === 10) {
      chunk = chunk.subarray(0, chunk.length - 2);
    }
    const headerEnd = chunk.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd >= 0) {
      const headerText = chunk.subarray(0, headerEnd).toString("utf8");
      const body = chunk.subarray(headerEnd + 4);
      const nameMatch = /name="([^"]+)"/.exec(headerText);
      const fileMatch = /filename="([^"]*)"/.exec(headerText);
      parts.push({
        name: nameMatch ? nameMatch[1] : "",
        filename: fileMatch ? fileMatch[1] : undefined,
        body,
      });
    }
    start = next + delimiter.length;
  }
  return parts;
}

function packageById(id) {
  return PACKAGES.find((item) => item.id === id);
}

function catalogBody() {
  const cards = PACKAGES.map(
    (item) => `<li class="card" data-card="${item.kind}">
      <h2><a href="/pkg/${item.id}">${escapeHtml(item.name)}</a></h2>
      <p>${escapeHtml(item.blurb)}</p>
      <p>Pin <strong>${escapeHtml(item.pin)}</strong></p>
      <button type="button" data-add="${item.id}" data-name="${escapeHtml(item.name)}" data-pin="${item.pin}">Add ${escapeHtml(item.name)} to shelf</button>
    </li>`,
  ).join("");
  return layout({
    title: "Catalog",
    script: "/assets/catalog.js",
    body: `<h1>Workshop Bench</h1>
      <p class="lede">Pin the tools you already use on Ubuntu, then let a browser test touch the shelf instead of your real machine.</p>
      <div class="filters" role="group" aria-label="Filter by toolchain">
        <button type="button" data-kind="all" aria-pressed="true">All</button>
        <button type="button" data-kind="cpp" aria-pressed="false">C++</button>
        <button type="button" data-kind="rust" aria-pressed="false">Rust</button>
        <button type="button" data-kind="android" aria-pressed="false">Android</button>
      </div>
      <p id="shelf-status" role="status"></p>
      <ul class="cards">${cards}</ul>`,
  });
}

function packageBody(item) {
  return layout({
    title: item.name,
    script: "/assets/catalog.js",
    body: `<p><a href="/">Back to catalog</a></p>
      <h1>${escapeHtml(item.name)}</h1>
      <p>${escapeHtml(item.blurb)}</p>
      <p>Toolchain <strong>${escapeHtml(item.kind)}</strong></p>
      <p>Pin <strong>${escapeHtml(item.pin)}</strong></p>
      <p id="shelf-status" role="status"></p>
      <button type="button" data-add="${item.id}" data-name="${escapeHtml(item.name)}" data-pin="${item.pin}">Add ${escapeHtml(item.name)} to shelf</button>`,
  });
}

function formBody() {
  return layout({
    title: "Toolchain form",
    body: `<h1>Toolchain form</h1>
      <p class="lede">A plain form. No framework, no hidden state, the values you submit come back escaped.</p>
      <form method="post" action="/forms">
        <label for="display-name">Display name</label>
        <input id="display-name" name="displayName" autocomplete="name" required>
        <label for="channel">Channel</label>
        <select id="channel" name="channel">
          <option value="stable">stable</option>
          <option value="beta">beta</option>
          <option value="nightly">nightly</option>
        </select>
        <fieldset>
          <legend>Primary toolchain</legend>
          <label class="choice"><input type="radio" name="tool" value="cpp" checked> C++</label>
          <label class="choice"><input type="radio" name="tool" value="rust"> Rust</label>
          <label class="choice"><input type="radio" name="tool" value="android"> Android</label>
        </fieldset>
        <label class="choice"><input type="checkbox" name="notify" value="yes"> Email the build log</label>
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes"></textarea>
        <button type="submit">Save preferences</button>
      </form>`,
  });
}

function preferencesBody(fields) {
  const rows = [
    ["Display name", fields.displayName || ""],
    ["Channel", fields.channel || ""],
    ["Primary toolchain", fields.tool || ""],
    ["Email the build log", fields.notify === "yes" ? "yes" : "no"],
    ["Notes", fields.notes || ""],
  ]
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
  return layout({
    title: "Preferences saved",
    body: `<h1>Preferences saved</h1><dl>${rows}</dl>`,
  });
}

function loginBody(error) {
  return layout({
    title: "Maintainer login",
    body: `<h1>Maintainer login</h1>
      <p class="lede">This fixture signs a localhost cookie. It is not an account on any other machine.</p>
      ${error ? `<p class="alert" role="alert">${escapeHtml(error)}</p>` : ""}
      <form method="post" action="/login">
        <label for="name">Name</label>
        <input id="name" name="name" autocomplete="username" required>
        <label for="passphrase">Passphrase</label>
        <input id="passphrase" name="passphrase" type="password" autocomplete="current-password" required>
        <button type="submit">Unlock notes</button>
      </form>`,
  });
}

function maintainerBody() {
  return layout({
    title: "Signing notes",
    body: `<h1>Signing notes</h1>
      <p>Internal: rotate the local bench key before sharing traces.</p>
      <p class="muted">You are signed in as ${FIXTURE_NAME}.</p>`,
  });
}

function lockedBody() {
  return layout({
    title: "Notes are locked",
    body: `<h1>Notes are locked</h1>
      <p>The signing notes stay behind the fixture cookie.</p>
      <p><a href="/login">Go to maintainer login</a></p>`,
  });
}

function orderIdFor(name) {
  const cleaned = String(name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return `BN-${cleaned || "GUEST"}`;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${HOST}`);
    const pathname = url.pathname;
    const method = req.method || "GET";

    if (method === "GET" && pathname === "/health") {
      send(res, 200, "ok\n", "text/plain; charset=utf-8");
      return;
    }

    if (method === "GET" && pathname === "/api/packages") {
      send(
        res,
        200,
        JSON.stringify({
          packages: PACKAGES.map(({ id, name, kind, pin }) => ({ id, name, kind, pin })),
        }),
        "application/json; charset=utf-8",
      );
      return;
    }

    if (method === "POST" && pathname === "/api/packages") {
      const raw = (await readBody(req)).toString("utf8");
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        send(res, 400, JSON.stringify({ error: "invalid json" }), "application/json; charset=utf-8");
        return;
      }
      if (!data.name || !data.version) {
        send(
          res,
          400,
          JSON.stringify({ error: "name and version are required" }),
          "application/json; charset=utf-8",
        );
        return;
      }
      send(
        res,
        201,
        JSON.stringify({ name: data.name, version: data.version, persisted: false }),
        "application/json; charset=utf-8",
      );
      return;
    }

    if (method === "GET" && pathname === "/api/status") {
      send(
        res,
        200,
        JSON.stringify({ service: "bench", ok: true, message: "bench ok" }),
        "application/json; charset=utf-8",
      );
      return;
    }

    if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      send(res, 200, catalogBody());
      return;
    }

    if (method === "GET" && pathname.startsWith("/pkg/")) {
      const item = packageById(pathname.slice("/pkg/".length));
      if (!item) {
        send(res, 404, layout({ title: "Not found", body: "<h1>Not found</h1><p>That pin is not on the bench.</p>" }));
        return;
      }
      send(res, 200, packageBody(item));
      return;
    }

    if (method === "GET" && pathname === "/shelf") {
      send(
        res,
        200,
        layout({
          title: "Shelf",
          script: "/assets/shelf.js",
          body: `<h1>Shelf</h1>
            <p id="empty">The shelf is empty.</p>
            <table id="shelf" hidden>
              <caption>Pinned tools</caption>
              <thead><tr><th>Tool</th><th>Pin</th><th>Qty</th></tr></thead>
              <tbody></tbody>
            </table>
            <p><a href="/checkout">Check out</a></p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/checkout") {
      send(
        res,
        200,
        layout({
          title: "Check out",
          script: "/assets/checkout.js",
          body: `<h1>Check out</h1>
            <p id="shelf-summary">Reading the shelf.</p>
            <form method="post" action="/checkout">
              <input type="hidden" name="items" id="items" value="">
              <label for="who">Your name</label>
              <input id="who" name="who" autocomplete="name" required>
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="email" required>
              <label for="ship-channel">Channel</label>
              <select id="ship-channel" name="channel">
                <option value="stable">stable</option>
                <option value="beta">beta</option>
              </select>
              <label for="note">Note</label>
              <textarea id="note" name="note"></textarea>
              <label class="choice"><input type="checkbox" name="agree" value="yes"> I am testing this local bench</label>
              <button type="submit">Place bench order</button>
            </form>`,
        }),
      );
      return;
    }

    if (method === "POST" && pathname === "/checkout") {
      const fields = Object.fromEntries(new URLSearchParams((await readBody(req)).toString("utf8")));
      const errors = [];
      if (!fields.who) errors.push("Name is required.");
      if (!validEmail(fields.email || "")) errors.push("Email must look like a real address.");
      if (fields.agree !== "yes") errors.push("Confirm that you are testing this local bench.");
      if (!fields.items) errors.push("The shelf is empty.");
      if (errors.length) {
        send(
          res,
          400,
          layout({
            title: "Order needs a fix",
            body: `<h1>Order needs a fix</h1><ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul><p><a href="/checkout">Back to check out</a></p>`,
          }),
        );
        return;
      }
      const order = orderIdFor(fields.who);
      send(
        res,
        200,
        layout({
          title: "Order placed",
          body: `<h1>Order placed</h1>
            <p>Order <strong>${escapeHtml(order)}</strong> for ${escapeHtml(fields.who)}.</p>
            <p>Items <span id="ordered-items">${escapeHtml(fields.items)}</span></p>
            <p>Channel ${escapeHtml(fields.channel || "stable")}</p>
            <p>Note ${escapeHtml(fields.note || "")}</p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/forms") {
      send(res, 200, formBody());
      return;
    }

    if (method === "POST" && pathname === "/forms") {
      const fields = Object.fromEntries(new URLSearchParams((await readBody(req)).toString("utf8")));
      if (!fields.displayName) {
        send(res, 400, layout({ title: "Preferences", body: "<h1>Display name is required</h1>" }));
        return;
      }
      send(res, 200, preferencesBody(fields));
      return;
    }

    if (method === "GET" && pathname === "/upload") {
      send(
        res,
        200,
        layout({
          title: "Upload",
          body: `<h1>Upload a manifest</h1>
            <form method="post" action="/upload" enctype="multipart/form-data">
              <label for="manifest">Manifest</label>
              <input id="manifest" name="manifest" type="file" required>
              <button type="submit">Upload manifest</button>
            </form>`,
        }),
      );
      return;
    }

    if (method === "POST" && pathname === "/upload") {
      const type = req.headers["content-type"] || "";
      const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/.exec(type);
      if (!boundaryMatch) {
        send(res, 400, layout({ title: "Upload", body: "<h1>Missing multipart boundary</h1>" }));
        return;
      }
      const parts = parseMultipart(await readBody(req), boundaryMatch[1] || boundaryMatch[2]);
      const file = parts.find((part) => part.name === "manifest" && part.filename);
      if (!file || !file.filename) {
        send(res, 400, layout({ title: "Upload", body: "<h1>Manifest file is required</h1>" }));
        return;
      }
      send(
        res,
        200,
        layout({
          title: "Upload received",
          body: `<h1>Upload received</h1><p>Received ${escapeHtml(file.filename)} (${file.body.length} bytes).</p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/download") {
      send(
        res,
        200,
        layout({
          title: "Download",
          body: `<h1>Download</h1>
            <p><a href="/files/bench-notes.txt" download="bench-notes.txt">Download bench notes</a></p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/files/bench-notes.txt") {
      const file = fs.readFileSync(path.join(ASSETS, "bench-notes.txt"));
      send(res, 200, file, "text/plain; charset=utf-8", {
        "Content-Disposition": 'attachment; filename="bench-notes.txt"',
      });
      return;
    }

    if (method === "GET" && pathname === "/frames") {
      send(
        res,
        200,
        layout({
          title: "Frames",
          body: `<h1>Nested release notes</h1>
            <p>The acknowledgement lives in a frame, not in this document.</p>
            <iframe title="Release notes" src="/frame-notes"></iframe>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/frame-notes") {
      send(
        res,
        200,
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Release notes</title><link rel="stylesheet" href="/assets/bench.css"></head>
         <body><main id="main"><h1>Release notes</h1><button type="button" id="ack">Acknowledge</button><p id="ack-note" hidden></p></main>
         <script src="/assets/frame.js"></script></body></html>`,
      );
      return;
    }

    if (method === "GET" && pathname === "/dialogs") {
      send(
        res,
        200,
        layout({
          title: "Dialogs",
          script: "/assets/dialogs.js",
          body: `<h1>Native dialogs</h1>
            <div class="row">
              <button type="button" id="alert-btn">Show shelf alert</button>
              <button type="button" id="confirm-btn">Confirm discard</button>
              <button type="button" id="prompt-btn">Name the pin</button>
            </div>
            <p id="result">No dialog yet.</p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/popup") {
      send(
        res,
        200,
        layout({
          title: "Popup",
          body: `<h1>Popup</h1><p><a href="/popup-note" target="_blank" rel="noopener">Open bench note</a></p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/popup-note") {
      send(res, 200, layout({ title: "Bench note", body: "<h1>Bench note</h1><p>This tab was opened from the shelf.</p>" }));
      return;
    }

    if (method === "GET" && pathname === "/login") {
      send(res, 200, loginBody());
      return;
    }

    if (method === "POST" && pathname === "/login") {
      const fields = Object.fromEntries(new URLSearchParams((await readBody(req)).toString("utf8")));
      if (fields.name === FIXTURE_NAME && fields.passphrase === FIXTURE_PASSPHRASE) {
        redirect(res, "/maintainer", {
          "Set-Cookie": "bench_session=maintainer; HttpOnly; Path=/; SameSite=Lax",
        });
        return;
      }
      send(res, 401, loginBody("Those credentials do not match the bench fixture."));
      return;
    }

    if (method === "GET" && pathname === "/maintainer") {
      send(res, signedIn(req) ? 200 : 403, signedIn(req) ? maintainerBody() : lockedBody());
      return;
    }

    if (method === "GET" && pathname === "/status") {
      send(
        res,
        200,
        layout({
          title: "Mirror status",
          script: "/assets/status.js",
          body: `<h1>Mirror status</h1><p role="status">Checking</p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/delayed") {
      send(
        res,
        200,
        layout({
          title: "Delayed shelf",
          script: "/assets/delayed.js",
          body: `<h1>Delayed shelf</h1><p id="state">Loading the shelf</p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/inert") {
      send(
        res,
        200,
        layout({
          title: "Inert panel",
          script: "/assets/inert.js",
          body: `<h1>Inert panel</h1>
            <p>The save control sits under the inert attribute until you open it. Playwright 1.65 waits for that.</p>
            <p id="panel-state">Panel locked</p>
            <div id="locked" inert>
              <button type="button" id="save-pin">Save pin</button>
            </div>
            <p><button type="button" id="open-panel">Open panel</button></p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/a11y") {
      send(
        res,
        200,
        layout({
          title: "Accessible bench",
          body: `<h1>Accessible bench</h1>
            <p>This page is the one the axe scan is expected to pass.</p>
            <img src="/assets/mark.svg" width="32" height="32" alt="Workshop Bench mark">
            <form method="get" action="/a11y">
              <label for="query">Find a tool</label>
              <input id="query" name="query">
              <button type="submit">Search tools</button>
            </form>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/a11y/broken") {
      send(
        res,
        200,
        layout({
          title: "Broken scan",
          body: `<h1>Broken scan</h1>
            <img src="/assets/mark.svg" width="32" height="32">
            <button type="button"></button>
            <p class="bad-contrast">Low contrast note</p>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/visual") {
      send(
        res,
        200,
        layout({
          title: "Poster",
          body: `<h1>Visual fixture</h1>
            <div class="poster">
              <p class="kicker">Workshop Bench</p>
              <div class="bar"></div>
              <h1>Pin the shelf</h1>
              <ul>
                <li>rustc bench-2026.11</li>
                <li>adb bench-2026.11</li>
                <li>cmake bench-2026.11</li>
              </ul>
            </div>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/map") {
      const links = [
        ["/", "Catalog"],
        ["/pkg/rustc", "rustc detail"],
        ["/shelf", "Shelf"],
        ["/checkout", "Check out"],
        ["/forms", "Toolchain form"],
        ["/upload", "Upload"],
        ["/download", "Download"],
        ["/frames", "Frames"],
        ["/dialogs", "Dialogs"],
        ["/popup", "Popup"],
        ["/login", "Login"],
        ["/maintainer", "Maintainer notes"],
        ["/status", "Status"],
        ["/delayed", "Delayed text"],
        ["/inert", "Inert panel"],
        ["/a11y", "Accessible page"],
        ["/a11y/broken", "Broken scan"],
        ["/visual", "Visual poster"],
        ["/api/packages", "Packages API"],
        ["/api/status", "Status API"],
      ];
      send(
        res,
        200,
        layout({
          title: "Practice map",
          body: `<h1>Practice map</h1><ul>${links
            .map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`)
            .join("")}</ul>`,
        }),
      );
      return;
    }

    if (method === "GET" && pathname.startsWith("/assets/")) {
      const name = path.basename(pathname);
      if (name !== pathname.slice("/assets/".length) || !/^[a-z0-9.-]+$/.test(name)) {
        send(res, 404, "not found\n", "text/plain; charset=utf-8");
        return;
      }
      const filePath = path.join(ASSETS, name);
      if (!filePath.startsWith(ASSETS) || !fs.existsSync(filePath)) {
        send(res, 404, "not found\n", "text/plain; charset=utf-8");
        return;
      }
      const ext = path.extname(name);
      send(res, 200, fs.readFileSync(filePath), ASSET_TYPES[ext] || "application/octet-stream");
      return;
    }

    send(res, 404, layout({ title: "Not found", body: "<h1>Not found</h1>" }));
  } catch (error) {
    const status = error.status || 500;
    send(res, status, layout({ title: "Bench error", body: `<h1>Bench error</h1><p>${escapeHtml(error.message || "error")}</p>` }));
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Workshop Bench listening on http://${HOST}:${PORT}\n`);
});
