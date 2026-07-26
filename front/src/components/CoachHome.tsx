import { AddTrainingButton } from "@/components/AddTrainingButton";
import { Avatar } from "@/components/Avatar";
import { Belt } from "@/components/Belt";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { BELT_LABELS } from "@/lib/belt";
import { prisma } from "@/lib/db";

export async function CoachHome({
  coachId,
  coachName,
}: {
  coachId: string;
  coachName: string;
}) {
  const [students, trainings] = await Promise.all([
    prisma.user.findMany({
      where: { coachId },
      orderBy: { name: "asc" },
    }),
    prisma.training.findMany({
      where: { coachId },
      orderBy: { date: "desc" },
    }),
  ]);

  const calendarTrainings = trainings.map((training) => ({
    id: training.id,
    title: training.title,
    date: training.date.toISOString(),
  }));

  return (
    <main className="w-full flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-accent">Главная · Календарь</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
              Добро пожаловать, тренер! <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              {coachName}, выберите дату, чтобы запланировать тренировку или посмотреть темы.
            </p>
          </div>
          <AddTrainingButton />
        </section>

        <TrainingCalendar trainings={calendarTrainings} />

        <section id="students" className="scroll-mt-8 pt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-accent">Команда</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                Мои ученики
              </h2>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-foreground">
              {students.length}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="calendar-shadow rounded-[1.6rem] border border-white bg-white/90 px-5 py-7">
              <p className="font-medium text-foreground">Список пока пуст</p>
              <p className="mt-1 text-sm text-muted">
                Здесь появятся ученики, прикреплённые к вашему аккаунту.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {students.map((student) => (
                <li key={student.id} className="calendar-shadow flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white bg-white/90 p-4">
                  <Avatar src={student.avatarUrl} name={student.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
                    <p className="truncate text-xs text-muted">{student.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center">
                    <Belt
                      belt={student.belt ?? "WHITE"}
                      stripes={student.belt === "BLACK" ? student.blackBeltDegree ?? 0 : student.stripes ?? 0}
                      size="xs"
                    />
                    <span className="mt-0.5 text-[10px] text-muted">
                      {BELT_LABELS[student.belt ?? "WHITE"]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
