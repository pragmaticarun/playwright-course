import { Exercise } from "@/components/exercise";
import { Markdown } from "@/components/markdown";
import { QuizCard } from "@/components/quiz-card";
import type { Block, Lesson } from "@/lib/lessons";

function numberedBlocks(blocks: Block[]) {
  let exerciseNumber = 0;
  let quizNumber = 0;
  return blocks.map((block) => {
    if (block.type === "exercise") {
      exerciseNumber += 1;
      return { block, exerciseNumber, quizNumber: 0 };
    }
    if (block.type === "quiz") {
      quizNumber += 1;
      return { block, exerciseNumber: 0, quizNumber };
    }
    return { block, exerciseNumber: 0, quizNumber: 0 };
  });
}

export function LessonBody({ lesson }: { lesson: Lesson }) {
  return (
    <article className="lesson-body">
      {numberedBlocks(lesson.blocks).map(({ block, exerciseNumber, quizNumber }, index) => {
        if (block.type === "markdown") return <Markdown key={index} text={block.text} />;
        if (block.type === "callout") {
          return (
            <aside key={index} className={`callout callout-${block.callout.tone}`}>
              <p className="callout-title">{block.callout.title}</p>
              <Markdown text={block.callout.body} />
            </aside>
          );
        }
        if (block.type === "exercise") {
          return (
            <Exercise
              key={index}
              number={exerciseNumber}
              title={block.exercise.title}
              prompt={<Markdown text={block.exercise.prompt} />}
              hint={<Markdown text={block.exercise.hint} />}
              solution={<Markdown text={block.exercise.solution} />}
            />
          );
        }
        return <QuizCard key={block.quiz.id} quiz={block.quiz} index={quizNumber} />;
      })}
    </article>
  );
}
