import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getLessons, modulesOf } from "@/lib/lessons";

export default function HomePage() {
  const lessons = getLessons();
  const modules = modulesOf(lessons);
  const first = lessons[0];

  return (
    <div className="frame">
      <section className="hero">
        <p className="eyebrow">For Arunkumar · Ubuntu, C++, Rust, Android</p>
        <h1>The browser is another device under test.</h1>
        <p className="lede">
          You already build native code and talk to phones with adb. Playwright is the same kind of work on a different bus: a locator is a query, not a pointer, a browser context is an incognito process, and a trace is the core dump you actually want.
        </p>
        <p>
          {first ? <Link href={`/lessons/${first.slug}`}>Start with lesson 01</Link> : null}
          {" · "}
          <Link href="/lab">Open the local lab</Link>
        </p>
        <div className="version-strip">
          <Badge>Playwright 1.65.0</Badge>
          <Badge variant="outline">@playwright/mcp 0.0.84</Badge>
          <Badge variant="outline">{lessons.length} lessons</Badge>
          <Badge variant="moss">No account</Badge>
        </div>
      </section>
      <section>
        <h2 className="page-title">Modules</h2>
        <div className="module-grid">
          {modules.map((module) => (
            <Link key={module.name} href={`/lessons/${module.lessons[0].slug}`} className="module-card">
              <p className="eyebrow">{module.lessons.length} lessons</p>
              <h2>{module.name}</h2>
              <p className="muted">{module.lessons[0].summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
