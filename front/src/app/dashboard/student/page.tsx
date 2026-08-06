import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { AthleteCard } from "@/components/AthleteCard";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { Card } from "@/components/Card";
import { calculateAge } from "@/lib/belt";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/dashboard");

  const profileCard = (
    <Link href="/dashboard/profile" className="block">
      <AthleteCard
        name={user.name}
        avatarUrl={user.avatarUrl}
        age={user.birthDate ? calculateAge(user.birthDate) : null}
        belt={user.belt}
        blackBeltDegree={user.blackBeltDegree}
      />
    </Link>
  );

  if (!user.coachId) {
    return (
      <div className="flex flex-col gap-6">
        {profileCard}
        <Card>
          <p className="text-sm text-muted">
            К вам пока не привязан тренер, поэтому список тренировок пуст.
            Попросите тренера добавить вас или обратитесь к администратору.
          </p>
        </Card>
      </div>
    );
  }

  const trainings = await prisma.training.findMany({
    where: { coachId: user.coachId },
    orderBy: { date: "desc" },
    include: {
      attendances: { where: { studentId: user.id } },
      coach: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {profileCard}

      <div>
        <h1 className="text-xl font-semibold text-foreground">Мои тренировки</h1>
        <p className="text-sm text-muted">
          Тренер: {trainings[0]?.coach.name ?? "—"}
        </p>
      </div>

      <Card>
        {trainings.length === 0 ? (
          <p className="text-sm text-muted">Тренировок пока нет.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {trainings.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-sm text-muted">
                    {formatDateTime(t.date)}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                  {t.attendances[0]?.comment && (
                    <p className="mt-1 text-sm text-foreground/70">
                      {t.attendances[0].comment}
                    </p>
                  )}
                </div>
                <AttendanceBadge attended={t.attendances[0]?.attended ?? null} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
