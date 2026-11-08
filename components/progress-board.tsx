"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readProgress, writeProgress } from "@/lib/progress";

export function ProgressBoard({
  lessons,
}: {
  lessons: { number: number; slug: string; title: string; module: string; quizzes: { id: string }[] }[];
}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, number>>({});

  useEffect(() => {
    const sync = () => {
      const progress = readProgress();
      setCompleted(progress.completed);
      setQuizzes(progress.quizzes);
    };
    sync();
    window.addEventListener("bench-progress", sync);
    return () => window.removeEventListener("bench-progress", sync);
  }, []);

  return (
    <div className="frame">
      <p className="eyebrow">This browser only</p>
      <h1 className="page-title">Progress stays in localStorage.</h1>
      <p className="lede">Nothing is sent to a server. There is no sign-in. Clearing site data clears the checkmarks.</p>
      <p>{completed.length} of {lessons.length} lessons marked complete.</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          writeProgress({ completed: [], quizzes: {} });
          setCompleted([]);
          setQuizzes({});
        }}
      >
        Reset this browser
      </Button>
      <table>
        <thead>
          <tr>
            <th>Lesson</th>
            <th>Quiz answers saved</th>
            <th>Complete</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => {
            const saved = lesson.quizzes.filter((quiz) => typeof quizzes[quiz.id] === "number").length;
            return (
              <tr key={lesson.slug}>
                <td><Link href={`/lessons/${lesson.slug}`}>{lesson.number}. {lesson.title}</Link></td>
                <td>{saved} / {lesson.quizzes.length}</td>
                <td>{completed.includes(lesson.slug) ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
