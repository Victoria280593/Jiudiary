import Link from "next/link";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/Avatar";
import { Belt } from "@/components/Belt";
import { getCurrentUser } from "@/lib/auth";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Администратор",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

function Logo({
  belt,
  stripes,
}: {
  belt: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>["belt"];
  stripes: number | null;
}) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Jiu Diary — на главную">
      <span className="font-brand text-[1.65rem] font-semibold tracking-[-0.065em] text-foreground">
        JiuDiary
      </span>
      <Belt
        belt={belt ?? "WHITE"}
        stripes={stripes ?? 0}
        size="xs"
        className="transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
      />
    </Link>
  );
}

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

export async function SiteHeader() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/90 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl">
          <Logo belt={null} stripes={0} />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="font-medium text-muted hover:text-foreground">
              Войти
            </Link>
            <Link href="/register" className="rounded-xl bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover">
              Регистрация
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const beltStripes = user.belt === "BLACK" ? user.blackBeltDegree : user.stripes;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-white/82 px-5 py-7 backdrop-blur-xl lg:flex">
        <Logo belt={user.belt} stripes={beltStripes} />

        <nav aria-label="Основная навигация" className="mt-12 flex flex-col gap-2">
          <Link href="/" className="sidebar-link sidebar-link-active">
            <CalendarIcon />
            <span>Календарь</span>
          </Link>
          {user.role === "COACH" && (
            <Link href="/#students" className="sidebar-link">
              <UsersIcon />
              <span>Ученики</span>
            </Link>
          )}
          <Link href="/dashboard/profile" className="sidebar-link">
            <ProfileIcon />
            <span>Мой аккаунт</span>
          </Link>
        </nav>

        <div className="mt-auto border-t border-border/70 pt-5">
          <Link href="/dashboard/profile" className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-muted">
            <Avatar src={user.avatarUrl} name={user.name} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
              <span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span>
            </span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="mt-2 w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground">
              Выйти из аккаунта
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/70 bg-white/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo belt={user.belt} stripes={beltStripes} />
        <Link href="/dashboard/profile" aria-label="Открыть аккаунт" className="rounded-full ring-4 ring-accent-soft">
          <Avatar src={user.avatarUrl} name={user.name} size={36} />
        </Link>
      </header>
    </>
  );
}
