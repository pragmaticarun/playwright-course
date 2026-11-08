"use client";

import { useState } from "react";
import { useSyncExternalStore } from "react";
import type { Quiz } from "@/lib/lessons";
import { parseProgress, progressSnapshot, subscribeProgress, writeProgress } from "@/lib/progress";

export function QuizCard({ quiz, index }: { quiz: Quiz; index: number }) {
  const raw = useSyncExternalStore(subscribeProgress, progressSnapshot, () => "");
  const saved = parseProgress(raw).quizzes[quiz.id];
  const [draft, setDraft] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const savedChoice = typeof saved === "number" ? saved : null;
  const choice = editing ? draft : savedChoice;
  const checked = !editing && savedChoice !== null;
  const correct = choice === quiz.answer;

  return (
    <fieldset className="quiz">
      <legend>
        Quiz {index}. {quiz.question}
      </legend>
      {quiz.choices.map((option, optionIndex) => {
        const id = `${quiz.id}-${optionIndex}`;
        return (
          <label key={id} htmlFor={id} className="quiz-option">
            <input
              id={id}
              type="radio"
              name={quiz.id}
              checked={choice === optionIndex}
              onChange={() => {
                setDraft(optionIndex);
                setEditing(true);
              }}
            />
            <span>{option}</span>
          </label>
        );
      })}
      <button
        type="button"
        className="quiz-check"
        onClick={() => {
          if (choice === null) return;
          const progress = parseProgress(progressSnapshot());
          writeProgress({ ...progress, quizzes: { ...progress.quizzes, [quiz.id]: choice } });
          setEditing(false);
        }}
      >
        Check answer
      </button>
      {checked && choice !== null ? (
        <p className={correct ? "quiz-good" : "quiz-bad"} role="status">
          {correct ? "Correct." : "Not this one."} {quiz.explanation}
        </p>
      ) : null}
    </fieldset>
  );
}
