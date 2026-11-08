"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { LessonSearch, type SearchLesson } from "@/components/lesson-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/sidebar-nav";

export function SiteHeader({ lessons }: { lessons: SearchLesson[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return (
    <header className="site-header">
      <div className="header-row">
        <div className="flex items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="menu-button" aria-label="Open lesson menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Lessons</SheetTitle>
              <SheetDescription>Jump to a lesson.</SheetDescription>
              <SidebarNav lessons={lessons} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link href="/" className="brand">
            Playwright Bench
          </Link>
        </div>
        <LessonSearch lessons={lessons} />
        <nav className="header-links" aria-label="Course">
          <Link href="/lessons">Lessons</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/lab">Lab</Link>
          <Link href="/progress">Progress</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
