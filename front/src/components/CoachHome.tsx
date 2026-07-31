import { TrainingCalendar } from "@/components/TrainingCalendar";
import { getSession } from "@/lib/auth";
import { getBackendTrainings } from "@/lib/backend-auth";

export async function CoachHome({
  coachName,
}: {
  coachName: string;
}) {
  const session = await getSession();
  const trainings = session ? await getBackendTrainings(session.accessToken) : null;

  const calendarTrainings = (trainings ?? []).map((training) => ({
    id: training.id,
    title: training.description || `Тренировка · ${training.groupName}`,
    date: training.time,
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

        <TrainingCalendar trainings={calendarTrainings} linkBase="" showGroupFilter />
      </div>
    </main>
  );
}
