import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { RoleSelectForm } from "@/components/RoleSelectForm";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { BELT_COLORS, BELT_LABELS } from "@/lib/belt";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Админ",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

function isRole(value: string | undefined): value is Role {
  return !!value && value in ROLE_LABELS;
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/dashboard");

  const { role: roleParam } = await searchParams;
  const activeRole = isRole(roleParam) ? roleParam : undefined;

  const [users, trainingCount, attendanceCount, trainings] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        coach: { select: { name: true } },
        _count: { select: { students: true, childrenLinks: true } },
      },
    }),
    prisma.training.count(),
    prisma.attendance.count(),
    prisma.training.findMany({
      orderBy: { date: "desc" },
      take: 15,
      include: { coach: { select: { name: true } } },
    }),
  ]);

  const counts: Record<Role, number> = { ADMIN: 0, COACH: 0, STUDENT: 0, PARENT: 0 };
  for (const u of users) counts[u.role]++;

  const visibleUsers = activeRole ? users.filter((u) => u.role === activeRole) : users;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Администрирование</h1>
          <p className="text-sm text-muted">
            Управление пользователями и обзор всей системы
          </p>
        </div>
        <Link
          href="/dashboard/admin/trainings"
          title="Календарь тренировок"
          aria-label="Календарь тренировок"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-lg hover:bg-surface-muted"
        >
          📅
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const isActive = activeRole === role;
          return (
            <Link
              key={role}
              href={isActive ? "/dashboard/admin" : `/dashboard/admin?role=${role}`}
              className="block"
            >
              <Card
                className={`cursor-pointer transition-colors hover:border-accent ${
                  isActive ? "border-accent bg-accent/5" : ""
                }`}
              >
                <p className="text-2xl font-semibold text-accent">{counts[role]}</p>
                <p className="text-sm text-muted">{ROLE_LABELS[role]}</p>
              </Card>
            </Link>
          );
        })}
      </section>

      <Card
        title={
          activeRole
            ? `${ROLE_LABELS[activeRole]} (${visibleUsers.length})`
            : `Пользователи (${users.length})`
        }
      >
        {activeRole && (
          <Link
            href="/dashboard/admin"
            className="mb-3 inline-block text-sm text-accent hover:underline"
          >
            ← Показать всех
          </Link>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4 font-medium">Имя</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Роль</th>
                <th className="py-2 pr-4 font-medium">Доп. информация</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    <Link
                      href={`/dashboard/admin/users/${u.id}`}
                      className="flex items-center gap-2 hover:text-accent hover:underline"
                    >
                      <Avatar src={u.avatarUrl} name={u.name} size={28} />
                      {u.name}
                      {u.belt && (
                        <span
                          className="inline-block h-2.5 w-5 shrink-0 rounded-sm border border-border/40"
                          style={{
                            background:
                              BELT_COLORS[u.belt].pattern === "split" && BELT_COLORS[u.belt].accent
                                ? `linear-gradient(90deg, ${BELT_COLORS[u.belt].main} 50%, ${BELT_COLORS[u.belt].accent} 50%)`
                                : BELT_COLORS[u.belt].main,
                          }}
                          title={BELT_LABELS[u.belt]}
                        />
                      )}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-muted">{u.email}</td>
                  <td className="py-2 pr-4">
                    <RoleSelectForm
                      userId={u.id}
                      currentRole={u.role}
                      disabled={u.id === currentUser.id}
                    />
                  </td>
                  <td className="py-2 pr-4 text-muted">
                    {u.role === "COACH" && `Учеников: ${u._count.students}`}
                    {u.role === "STUDENT" &&
                      (u.coach ? `Тренер: ${u.coach.name}` : "Без тренера")}
                    {u.role === "PARENT" && `Детей: ${u._count.childrenLinks}`}
                    {u.role === "ADMIN" && "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={`Тренировки в системе (${trainingCount}, отметок посещаемости: ${attendanceCount})`}
      >
        {trainings.length === 0 ? (
          <p className="text-sm text-muted">Тренировок пока нет.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {trainings.map((t) => (
              <li key={t.id} className="py-2">
                <p className="font-medium text-foreground">{t.title}</p>
                <p className="text-sm text-muted">
                  {formatDateTime(t.date)} · Тренер: {t.coach.name}
                  {t.location ? ` · ${t.location}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
