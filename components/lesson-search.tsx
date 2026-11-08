"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { readProgress } from "@/lib/progress";

export type SearchLesson = {
  number: number;
  slug: string;
  title: string;
  module: string;
  summary: string;
};

export function LessonSearch({ lessons }: { lessons: SearchLesson[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        document.getElementById("lesson-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return lessons
      .map((lesson) => {
        const haystack = `${lesson.title} ${lesson.module} ${lesson.summary}`.toLowerCase();
        const titleHit = lesson.title.toLowerCase().includes(needle);
        return { lesson, score: titleHit ? 2 : haystack.includes(needle) ? 1 : 0 };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.lesson.number - b.lesson.number)
      .slice(0, 8);
  }, [lessons, query]);

  return (
    <div className="search-wrap">
      <label className="sr-only" htmlFor="lesson-search">
        Search lessons
      </label>
      <Input
        id="lesson-search"
        value={query}
        placeholder="Search lessons"
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() ? (
        <div className="search-results" role="listbox" aria-label="Search results">
          {results.length === 0 ? <p className="search-empty">No lesson matches that.</p> : null}
          {results.map(({ lesson }) => (
            <Link key={lesson.slug} href={`/lessons/${lesson.slug}`} onClick={() => setOpen(false)}>
              <span>{String(lesson.number).padStart(2, "0")}</span>
              {lesson.title}
              <small>{lesson.module}</small>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProgressLink({
  slug,
  title,
  number,
  onNavigate,
}: {
  slug: string;
  title: string;
  number: number;
  onNavigate?: () => void;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const sync = () => setDone(readProgress().completed.includes(slug));
    sync();
    window.addEventListener("bench-progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bench-progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  return (
    <Link href={`/lessons/${slug}`} className="nav-lesson" data-done={done ? "true" : "false"} onClick={onNavigate}>
      <span>{String(number).padStart(2, "0")}</span>
      {title}
    </Link>
  );
}
