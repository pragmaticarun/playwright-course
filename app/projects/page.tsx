import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

const projects = [
  {
    name: "01 · Locator drill",
    path: "projects/01-locator-drill/locator-drill.spec.ts",
    brief: "Filter Workshop Bench to Android and prove only adb and scrcpy stay visible. Count cards in the DOM, then assert the ones the filter hid.",
  },
  {
    name: "02 · Form suite",
    path: "projects/02-form-suite/form-suite.spec.ts",
    brief: "Save a nightly Android preference set, then try to check out with an empty shelf and read the server's validation list.",
  },
  {
    name: "03 · Auth dashboard",
    path: "projects/03-auth-dashboard/auth-dashboard.spec.ts",
    brief: "Show that a fresh context gets 403 on the signing notes, and that the setup project's storage state opens them without typing the passphrase again.",
  },
  {
    name: "Capstone · Bench order",
    path: "projects/capstone/bench.spec.ts",
    brief: "Using page objects constructed in the constructor, filter to Rust, pin rustc, check out as Arun, and expect order BN-ARUN. A second test scans the catalog with axe. A third reopens the notes from storage state.",
  },
];

export default function ProjectsPage() {
  return (
    <div className="frame">
      <p className="eyebrow">Increasing projects</p>
      <h1 className="page-title">Four runnable projects, ending at the shelf.</h1>
      <p className="lede">
        The reference solutions live in this repository and are part of <code>npx playwright test</code>. Read the brief, hide the spec, write your own, then diff. The practice server is Workshop Bench on 127.0.0.1:4471.
      </p>
      <div className="card-grid">
        {projects.map((project) => (
          <article key={project.name} className="info-card">
            <h2>{project.name}</h2>
            <p>{project.brief}</p>
            <p className="muted"><code>{project.path}</code></p>
          </article>
        ))}
      </div>
    </div>
  );
}
