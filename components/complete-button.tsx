"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { parseProgress, progressSnapshot, subscribeProgress, writeProgress } from "@/lib/progress";

export function CompleteButton({ slug }: { slug: string }) {
  const raw = useSyncExternalStore(subscribeProgress, progressSnapshot, () => "");
  const done = parseProgress(raw).completed.includes(slug);

  return (
    <Button
      type="button"
      variant={done ? "outline" : "default"}
      onClick={() => {
        const progress = parseProgress(progressSnapshot());
        const completed = progress.completed.includes(slug)
          ? progress.completed.filter((item) => item !== slug)
          : [...progress.completed, slug];
        writeProgress({ ...progress, completed });
      }}
    >
      {done ? "Completed on this browser" : "Mark lesson complete"}
    </Button>
  );
}
