"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function KnowledgeSectionNavigation() {
  const pathname = usePathname();
  const supplementsIsActive = pathname.startsWith("/dashboard/knowledge/supplements");

  return (
    <nav
      aria-label="Разделы базы знаний"
      className="relative grid w-full max-w-md grid-cols-2 rounded-xl border border-border/70 bg-surface-muted p-1 shadow-sm"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${
          supplementsIsActive ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <Link
        href="/dashboard/knowledge"
        aria-current={!supplementsIsActive ? "page" : undefined}
        className={`relative z-10 flex min-h-10 items-center justify-center rounded-lg px-2 py-2 text-center text-xs transition-colors duration-200 ease-out sm:px-4 sm:text-sm ${
          !supplementsIsActive ? "font-semibold text-foreground" : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
        }`}
      >
        Правила соревнований
      </Link>
      <Link
        href="/dashboard/knowledge/supplements"
        aria-current={supplementsIsActive ? "page" : undefined}
        className={`relative z-10 flex min-h-10 items-center justify-center rounded-lg px-2 py-2 text-center text-xs transition-colors duration-200 ease-out sm:px-4 sm:text-sm ${
          supplementsIsActive ? "font-semibold text-foreground" : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
        }`}
      >
        Добавки
      </Link>
    </nav>
  );
}
