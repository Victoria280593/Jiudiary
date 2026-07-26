"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 011 1v14H4V6a1 1 0 011-1z" />
      <path strokeLinecap="round" d="M8 13h2m4 0h2m-8 4h2m4 0h2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 20v-1.5A3.5 3.5 0 0012.5 15h-5A3.5 3.5 0 004 18.5V20m13-9a3 3 0 110-6 3 3 0 010 6zM10 11a3 3 0 110-6 3 3 0 010 6zm8.5 4.5A3.5 3.5 0 0122 19" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M5 20a7 7 0 0114 0" />
    </svg>
  );
}

export function SidebarNavigation({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Основная навигация" className="mt-12 flex flex-col gap-2">
      <Link href="/" className={`sidebar-link ${pathname === "/" ? "sidebar-link-active" : ""}`}>
        <CalendarIcon />
        <span>Календарь</span>
      </Link>

      {role === "COACH" && (
        <Link
          href="/students"
          className={`sidebar-link ${pathname === "/students" ? "sidebar-link-active" : ""}`}
        >
          <UsersIcon />
          <span>Ученики</span>
        </Link>
      )}

      <Link
        href="/dashboard/profile"
        className={`sidebar-link ${pathname === "/dashboard/profile" ? "sidebar-link-active" : ""}`}
      >
        <ProfileIcon />
        <span>Мой аккаунт</span>
      </Link>
    </nav>
  );
}

export function MobileNavigation({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Мобильная навигация" className="mt-3 grid w-full grid-cols-3 gap-1">
      <Link
        href="/"
        className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold ${
          pathname === "/" ? "bg-accent-soft text-accent" : "text-muted"
        }`}
      >
        <CalendarIcon />
        <span>Календарь</span>
      </Link>
      {role === "COACH" ? (
        <Link
          href="/students"
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold ${
            pathname === "/students" ? "bg-accent-soft text-accent" : "text-muted"
          }`}
        >
          <UsersIcon />
          <span>Ученики</span>
        </Link>
      ) : (
        <span />
      )}
      <Link
        href="/dashboard/profile"
        className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold ${
          pathname === "/dashboard/profile" ? "bg-accent-soft text-accent" : "text-muted"
        }`}
      >
        <ProfileIcon />
        <span>Аккаунт</span>
      </Link>
    </nav>
  );
}
