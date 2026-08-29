import { redirect } from "next/navigation";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { getSession } from "@/lib/auth";
import { getBackendTrainings } from "@/lib/backend-auth";

export default async function StudentDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/dashboard");

  const trainings = await getBackendTrainings(session.accessToken);
  const calendarTrainings = (trainings ?? []).map((training) => ({
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
    <div className="relative left-1/2 flex w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 flex-col gap-6 sm:w-[calc(100vw-3rem)] xl:w-[calc(100vw-4rem)]">
      <section>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
          Мои тренировки
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          В календаре отображаются только тренировки групп, в которые вас добавили тренеры.
        </p>
      </section>

      {trainings === null ? (
        <div className="rounded-2xl border border-border bg-white px-5 py-10 text-center text-sm text-danger">
          Не удалось загрузить тренировки.
        </div>
      ) : (
        <TrainingCalendar
          key={calendarTrainings.map((training) => training.id).join(",")}
          trainings={calendarTrainings}
          linkBase=""
          showCreateForm={false}
          showGroupFilter
        />
      )}
    </div>
  );
}
