"use client";

import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function Exercise({
  number,
  title,
  prompt,
  hint,
  solution,
}: {
  number: number;
  title: string;
  prompt: ReactNode;
  hint: ReactNode;
  solution: ReactNode;
}) {
  return (
    <section className="exercise" aria-labelledby={`exercise-${number}`}>
      <p className="eyebrow">Exercise {number}</p>
      <h3 id={`exercise-${number}`}>{title}</h3>
      {prompt}
      <Accordion type="multiple" className="mt-2">
        <AccordionItem value="hint">
          <AccordionTrigger>Hint</AccordionTrigger>
          <AccordionContent>{hint}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="solution">
          <AccordionTrigger>Solution</AccordionTrigger>
          <AccordionContent>{solution}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
