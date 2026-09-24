import Link from "next/link";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/Avatar";
import { TopNavigation } from "@/components/SidebarNavigation";
import { SubmitButton } from "@/components/SubmitButton";
import { UserMenu } from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/auth";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Администратор",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center"
      aria-label="Jiu Diary — на главную"
    >
      <span className="font-brand text-[1.7rem] font-bold tracking-[-0.05em] text-foreground">
        JiuDiary
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const sidebarName = [user.lastName, user.firstName]
    .filter((value) => value.trim())
    .join(" ") || user.name;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-logo"><Logo /></div>
        <TopNavigation role={user.role} />
        <UserMenu>
          <summary aria-label="Открыть меню аккаунта" className="user-menu-summary">
            <Avatar src={user.avatarUrl} name={user.name} size={40} />
            <span className="user-menu-copy">
              <span className="block truncate text-sm font-semibold text-foreground">{sidebarName}</span>
              <span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span>
            </span>
          </summary>
          <div className="user-menu-popover">
            <Link href="/dashboard/profile" className="user-menu-action">Мой профиль</Link>
            <form action={logoutAction}>
              <SubmitButton pendingText="Выходим…" className="user-menu-action w-full text-left disabled:cursor-wait disabled:opacity-60">
                Выйти из аккаунта
              </SubmitButton>
            </form>
          </div>
        </UserMenu>
      </div>
    </header>
  );
}
