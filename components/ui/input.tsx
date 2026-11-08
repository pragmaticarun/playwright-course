import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--ink)] shadow-none outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--moss)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
