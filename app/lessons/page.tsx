import Link from "next/link";
import type { Metadata } from "next";
import { getLessons, modulesOf } from "@/lib/lessons";

export const metadata: Metadata = { title: "Lessons" };

export default function LessonsPage() {
  const modules = modulesOf(getLessons());
  return (
    <div className="frame">
      <p className="eyebrow">Syllabus</p>
      <h1 className="page-title">Thirty-eight lessons, each with a lab move.</h1>
      <p className="lede">Read the intuition, run the worked example against Workshop Bench, then open the hint only after you have tried the exercise.</p>
      {modules.map((module) => (
        <section key={module.name}>
          <h2>{module.name}</h2>
          <ol className="lesson-list">
            {module.lessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link href={`/lessons/${lesson.slug}`}>
                  <span>{String(lesson.number).padStart(2, "0")}</span>
                  <strong>{lesson.title}</strong>
                  <span />
                  <small className="muted">{lesson.summary}</small>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
