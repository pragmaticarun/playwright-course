import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lab" };

export default function LabPage() {
  return (
    <div className="frame">
      <p className="eyebrow">Workshop Bench</p>
      <h1 className="page-title">A deterministic app on localhost.</h1>
      <p className="lede">
        Every worked example that drives a browser targets this process. It binds to 127.0.0.1 only, keeps no database, and resets when the process restarts. The shelf lives in localStorage for the current browser context.
      </p>
      <h2>Run it</h2>
      <pre><code>npm run practice</code></pre>
      <p>The test runner starts the same server for you through <code>webServer</code> in <code>playwright.config.ts</code>. You do not need a second terminal unless you want to click around.</p>
      <h2>Fixture account</h2>
      <p>Name <code>maintainer</code>, passphrase <code>shelf-note</code>. The cookie is <code>bench_session</code>. It is a lab fixture, not a credential for any other host. Do not reuse it anywhere else, and do not commit <code>playwright/.auth</code>.</p>
      <h2>Routes the lessons use</h2>
      <ul>
        <li><code>/</code> catalog with toolchain filters and shelf buttons</li>
        <li><code>/pkg/rustc</code> one tool</li>
        <li><code>/shelf</code> and <code>/checkout</code> local shelf, then a posted order whose id is <code>BN-</code> plus the letters of the name</li>
        <li><code>/forms</code>, <code>/upload</code>, <code>/download</code></li>
        <li><code>/frames</code>, <code>/dialogs</code>, <code>/popup</code></li>
        <li><code>/login</code> and <code>/maintainer</code></li>
        <li><code>/status</code> fetches <code>/api/status</code></li>
        <li><code>/delayed</code> and <code>/inert</code></li>
        <li><code>/a11y</code> and <code>/a11y/broken</code></li>
        <li><code>/visual</code> poster used by the Chromium screenshot baseline</li>
        <li><code>/api/packages</code> JSON catalog. POST echoes and does not persist</li>
      </ul>
    </div>
  );
}
