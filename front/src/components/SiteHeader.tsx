import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/Avatar";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Админ",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-header-border bg-header">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-header-foreground transition-opacity hover:opacity-80"
        >
          <span className="text-xl">🥋</span>
          <span className="font-semibold tracking-tight">Дневник спортсмена</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
            >
              <Avatar src={user.avatarUrl} name={user.name} size={32} />
              <span className="hidden text-sm text-header-muted sm:inline">
                {user.name} · {ROLE_LABELS[user.role]}
              </span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-header-border px-3 py-1.5 text-sm text-header-foreground hover:bg-white/5"
              >
                Выйти
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-header-foreground hover:text-accent">
              Войти
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
