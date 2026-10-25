import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atmos — Workplace Environment & Employee Performance Research",
  description:
    "An empirical study and analytics platform measuring the impact of physical, social, and psychological workplace factors on employee performance (GE3751 Principles of Management).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-slate-900 flex flex-col justify-between">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white font-semibold text-sm tracking-tight shadow-sm transition-transform group-hover:scale-[1.02]">
                <svg
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  ATMOS
                </span>
                <span className="hidden sm:inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Research Platform
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="flex items-center gap-1 text-sm font-medium">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                >
                  Overview
                </Link>
                <Link
                  href="/survey"
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                >
                  Survey
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                >
                  Dashboard
                </Link>
              </nav>

              <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200 text-xs text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Study</span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 flex-1">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">ATMOS</span>
              <span>·</span>
              <span>GE3751 Principles of Management Mini Project</span>
            </div>
            <div className="text-center sm:text-right text-slate-400">
              Department of Management Studies · Anonymous Academic Survey Suite
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
