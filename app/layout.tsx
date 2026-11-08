import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { getLessons } from "@/lib/lessons";
import "./globals.css";

const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

const themeScript = `(function(){try{var stored=localStorage.getItem('bench-theme');var dark=stored==='dark'||(!stored&&matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: { default: "Playwright Bench", template: "%s · Playwright Bench" },
  description: "A hands-on Playwright course for an Ubuntu developer who already writes C++, Rust, and Android code.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const lessons = getLessons().map(({ number, slug, title, module, summary }) => ({
    number,
    slug,
    title,
    module,
    summary,
  }));

  return (
    <html lang="en" className={`${source.variable} ${newsreader.variable} ${plex.variable} h-full antialiased`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader lessons={lessons} />
        <div className="shell">
          <aside className="sidebar">
            <SidebarNav lessons={lessons} />
          </aside>
          <div className="content" id="main">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
