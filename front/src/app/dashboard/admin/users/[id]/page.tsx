import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AthleteCard } from "@/components/AthleteCard";
import { BeltSelectForm } from "@/components/BeltSelectForm";
import { Card } from "@/components/Card";
import { BELT_LABELS, beltsForAge, calculateAge } from "@/lib/belt";
import { flagEmoji, getCountryName } from "@/lib/countries";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Belt, Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Админ",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      coach: { select: { name: true } },
      students: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      childrenLinks: {
        select: { student: { select: { id: true, name: true } } },
        orderBy: { student: { name: "asc" } },
      },
      achievements: true,
    },
  });

  if (!user) notFound();

  const availableBelts = user.birthDate
    ? beltsForAge(calculateAge(user.birthDate))
    : (Object.keys(BELT_LABELS) as Belt[]);

  const achievements = [...user.achievements].sort((a, b) => {
    if (a.date && b.date) return b.date.getTime() - a.date.getTime();
    if (a.date) return -1;
    if (b.date) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/admin?role=${user.role}`}
          className="text-sm text-accent hover:text-accent-hover hover:underline"
        >
          ← К списку пользователей
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{user.name}</h1>
        <p className="text-sm text-muted">{ROLE_LABELS[user.role]}</p>
      </div>

      <AthleteCard
        name={user.name}
        avatarUrl={user.avatarUrl}
        flagEmoji={flagEmoji(user.countryCode)}
        countryName={getCountryName(user.countryCode)}
        age={user.birthDate ? calculateAge(user.birthDate) : null}
        belt={user.belt}
        blackBeltDegree={user.blackBeltDegree}
      />

      <Card title="Пояс">
        <BeltSelectForm
          userId={user.id}
          currentBelt={user.belt}
          availableBelts={availableBelts}
        />
        {!user.birthDate && (
          <p className="mt-2 text-xs text-muted">
            Дата рождения не указана — доступны все пояса без возрастного ограничения.
          </p>
        )}
      </Card>

      <Card title="Спортивные достижения">
        {achievements.length === 0 ? (
          <p className="text-sm text-muted">Достижений пока нет.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {achievements.map((a) => (
              <li key={a.id} className="py-3">
                <p className="text-sm text-foreground">{a.description}</p>
                {a.date && (
                  <p className="mt-0.5 text-xs text-muted">{formatDate(a.date)}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Данные аккаунта">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Роль</dt>
            <dd className="text-foreground">{ROLE_LABELS[user.role]}</dd>
          </div>
          {user.role === "STUDENT" && (
            <div className="flex justify-between">
              <dt className="text-muted">Тренер</dt>
              <dd className="text-foreground">{user.coach ? user.coach.name : "Без тренера"}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Зарегистрирован</dt>
            <dd className="text-foreground">{formatDateTime(user.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      {user.role === "COACH" && (
        <Card title={`Ученики (${user.students.length})`}>
          {user.students.length === 0 ? (
            <p className="text-sm text-muted">Учеников пока нет.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {user.students.map((s) => (
                <li key={s.id} className="py-2">
                  <Link
                    href={`/dashboard/admin/users/${s.id}`}
                    className="text-sm text-foreground hover:text-accent hover:underline"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {user.role === "PARENT" && (
        <Card title={`Дети (${user.childrenLinks.length})`}>
          {user.childrenLinks.length === 0 ? (
            <p className="text-sm text-muted">Дети не привязаны.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {user.childrenLinks.map((link) => (
                <li key={link.student.id} className="py-2">
                  <Link
                    href={`/dashboard/admin/users/${link.student.id}`}
                    className="text-sm text-foreground hover:text-accent hover:underline"
                  >
                    {link.student.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
