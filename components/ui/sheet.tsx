"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

function Sheet(props: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col gap-4 border-r border-[var(--line)] bg-[var(--paper)] p-4 shadow-xl",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close className="absolute right-3 top-3 rounded-sm p-1 hover:bg-[var(--ink)]/5" aria-label="Close menu">
          <X className="size-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function SheetTitle(props: React.ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className="font-serif text-lg" {...props} />;
}

function SheetDescription(props: React.ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className="sr-only" {...props} />;
}

export { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
