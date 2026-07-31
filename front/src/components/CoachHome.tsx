import { TrainingCalendar } from "@/components/TrainingCalendar";
import { prisma } from "@/lib/db";

export async function CoachHome({
  coachId,
  coachName,
}: {
  coachId: string;
  coachName: string;
}) {
  const trainings = await prisma.training.findMany({
    where: { coachId },
    orderBy: { date: "desc" },
  });

  const calendarTrainings = trainings.map((training) => ({
    id: training.id,
    title: training.title,
    date: training.date.toISOString(),
  }));

  return (
    <main className="w-full flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-7">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
              Добро пожаловать, тренер!
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              {coachName}, выберите дату, чтобы запланировать тренировку или посмотреть темы.
            </p>
          </div>
        </section>

        <TrainingCalendar trainings={calendarTrainings} showGroupFilter />
      </div>
    </main>
  );
}
