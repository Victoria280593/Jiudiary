import { TrainingCalendar } from "@/components/TrainingCalendar";
import { getSession } from "@/lib/auth";
import { getBackendTrainings } from "@/lib/backend-auth";
import { getMonthGridRange } from "@/lib/calendar";

export async function CoachHome({
  firstName,
  middleName,
}: {
  firstName: string;
  middleName: string | null;
}) {
  const session = await getSession();
  const today = new Date();
  const initialRange = getMonthGridRange(today.getFullYear(), today.getMonth() + 1);
  const calendarData = session ? await getBackendTrainings(session.accessToken, [], initialRange.fromDate, initialRange.toDate) : null;
  const coachName = [firstName, middleName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  const calendarTrainings = (calendarData?.trainings ?? []).map((training) => ({
    id: training.id,
    groupId: training.groupId,
    title: training.description ?? "",
    date: training.startTime,
    endDate: training.endTime,
    groupName: training.groupName,
    groupColorName: training.groupColorName,
    clientTraining: training.clientTraining,
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
              {coachName}, выберите дату, чтобы посмотреть список тренировок или добавить новую.
            </p>
          </div>
        </section>

        <TrainingCalendar
          key={calendarTrainings.map((training) => training.id).join(",")}
          trainings={calendarTrainings}
          notes={calendarData?.notes ?? []}
          linkBase=""
          showGroupFilter
        />
      </div>
    </main>
  );
}
