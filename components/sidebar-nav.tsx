"use client";

import { ProgressLink, type SearchLesson } from "@/components/lesson-search";

export function SidebarNav({ lessons, onNavigate }: { lessons: SearchLesson[]; onNavigate?: () => void }) {
  const modules: { name: string; lessons: SearchLesson[] }[] = [];
  for (const lesson of lessons) {
    const current = modules.at(-1);
    if (!current || current.name !== lesson.module) modules.push({ name: lesson.module, lessons: [lesson] });
    else current.lessons.push(lesson);
  }

  return (
    <nav className="sidebar-nav" aria-label="Lessons">
      {modules.map((module) => (
        <section key={module.name}>
          <h2>{module.name}</h2>
          {module.lessons.map((lesson) => (
            <ProgressLink key={lesson.slug} slug={lesson.slug} title={lesson.title} number={lesson.number} onNavigate={onNavigate} />
          ))}
        </section>
      ))}
    </nav>
  );
}
