import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AthleteCard } from "@/components/AthleteCard";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import { Avatar } from "@/components/Avatar";
import { Belt } from "@/components/Belt";
import { Card } from "@/components/Card";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { BELT_LABELS, calculateAge } from "@/lib/belt";
import { flagEmoji, getCountryName } from "@/lib/countries";
import { formatDateTime } from "@/lib/format";

export default async function CoachDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") redirect("/dashboard");

  const [students, trainings] = await Promise.all([
    prisma.user.findMany({
      where: { coachId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.training.findMany({
      where: { coachId: user.id },
      orderBy: { date: "desc" },
      include: { attendances: true },
    }),
  ]);

  const calendarTrainings = trainings.map((t) => ({
    id: t.id,
    title: t.title,
    date: t.date.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/profile" className="block">
        <AthleteCard
          name={user.name}
          avatarUrl={user.avatarUrl}
          flagEmoji={flagEmoji(user.countryCode)}
          countryName={getCountryName(user.countryCode)}
          age={user.birthDate ? calculateAge(user.birthDate) : null}
          belt={user.belt}
          stripes={user.stripes}
          blackBeltDegree={user.blackBeltDegree}
        />
      </Link>

      <Card title="Новая тренировка">
        <CreateTrainingForm />
      </Card>

      <Card title={`Мои ученики (${students.length})`}>
        {students.length === 0 ? (
          <p className="text-sm text-muted">
            Пока нет учеников, привязанных к вам. Ученики выбирают тренера при
            регистрации.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {students.map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-sm text-foreground">
                <Avatar src={s.avatarUrl} name={s.name} size={28} />
                <span>
                  {s.name} <span className="text-muted">({s.email})</span>
                </span>
                {s.belt && (
                  <span className="ml-auto flex items-center gap-2">
                    <Belt
                      belt={s.belt}
                      stripes={s.belt === "BLACK" ? s.blackBeltDegree ?? 0 : s.stripes ?? 0}
                      size="sm"
                    />
                    <span className="text-xs text-muted">{BELT_LABELS[s.belt]}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Тренировки">
        <p className="mb-3 text-xs text-muted">
          Кликните на число, чтобы открыть расписание дня и добавить тренировку.
        </p>
        <TrainingCalendar trainings={calendarTrainings} />

        {trainings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Тренировок пока нет.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {trainings.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-sm text-muted">
                    {formatDateTime(t.date)}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                </div>
                <Link
                  href={`/dashboard/coach/trainings/${t.id}`}
                  className="text-sm font-medium text-accent hover:text-accent-hover hover:underline"
                >
                  Отметить посещаемость
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
