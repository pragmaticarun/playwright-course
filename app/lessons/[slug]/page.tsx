import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompleteButton } from "@/components/complete-button";
import { LessonBody } from "@/components/lesson-body";
import { Badge } from "@/components/ui/badge";
import { getLesson, getLessons } from "@/lib/lessons";

export function generateStaticParams() {
  return getLessons().map((lesson) => ({ slug: lesson.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return { title: lesson ? `${lesson.number}. ${lesson.title}` : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lessons = getLessons();
  const lesson = lessons.find((item) => item.slug === slug);
  if (!lesson) notFound();
  const index = lessons.findIndex((item) => item.slug === slug);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const headings = lesson.blocks.flatMap((block) => {
    if (block.type !== "markdown") return [];
    return block.text
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.slice(3));
  });

  return (
    <div className="lesson-layout">
      <div className="frame">
        <header className="lesson-head">
          <p className="eyebrow">Lesson {String(lesson.number).padStart(2, "0")} · {lesson.module}</p>
          <h1>{lesson.title}</h1>
          <p className="lede">{lesson.summary}</p>
          <div className="lesson-meta">
            <Badge variant="outline">{lesson.minutes} min</Badge>
            <Badge variant="outline">{lesson.quizzes.length} quiz questions</Badge>
            <CompleteButton slug={lesson.slug} />
          </div>
        </header>
        <LessonBody lesson={lesson} />
        <section>
          <h2>Primary sources</h2>
          <ul className="sources">
            {lesson.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
              </li>
            ))}
          </ul>
        </section>
        <nav className="pager" aria-label="Lesson">
          {previous ? <Link href={`/lessons/${previous.slug}`}>Previous: {previous.title}</Link> : <span />}
          {next ? <Link href={`/lessons/${next.slug}`}>Next: {next.title}</Link> : <span />}
        </nav>
      </div>
      <aside className="outline-rail">
        <p className="eyebrow">On this page</p>
        <ul className="outline">
          {headings.map((heading) => (
            <li key={heading}>
              <a href={`#${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}>{heading}</a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
