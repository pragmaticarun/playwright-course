import type { Metadata } from "next";
import { ProgressBoard } from "@/components/progress-board";
import { getLessons } from "@/lib/lessons";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  const lessons = getLessons().map((lesson) => ({
    number: lesson.number,
    slug: lesson.slug,
    title: lesson.title,
    module: lesson.module,
    quizzes: lesson.quizzes.map((quiz) => ({ id: quiz.id })),
  }));
  return <ProgressBoard lessons={lessons} />;
}
