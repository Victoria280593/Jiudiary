import type { ClientTraining } from "@/lib/client-trainings-client";
import type { ClientDayNote } from "@/lib/client-day-notes-client";
import type { CalendarRange } from "@/lib/calendar";

export type CalendarTraining = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  endDate: string;
  groupName: string;
  groupColorName: string;
  clientTraining: ClientTraining | null;
};

type TrainingResponse = {
  id: string;
  groupId: string;
  groupName: string;
  groupColorId: number;
  groupColorName: string;
  description: string | null;
  startTime: string;
  endTime: string;
  clientTraining: ClientTraining | null;
};

type TrainingsResponse = {
  trainings: TrainingResponse[];
  notes: ClientDayNote[];
};

export type CalendarData = {
  trainings: CalendarTraining[];
  notes: ClientDayNote[];
};

export async function getTrainings(groupIds: string[] = [], range?: CalendarRange): Promise<CalendarData> {
  const searchParams = new URLSearchParams();
  groupIds.forEach((groupId) => searchParams.append("groupIds", groupId));
  if (range) {
    searchParams.set("fromDate", range.fromDate);
    searchParams.set("toDate", range.toDate);
  }
  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const response = await fetch(`/api/trainings${query}`, { cache: "no-store" });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось загрузить тренировки.");
  }

  const result = (await response.json()) as TrainingsResponse;
  return {
    trainings: result.trainings.map((training) => ({
      id: training.id,
      groupId: training.groupId,
      title: training.description ?? "",
      date: training.startTime,
      endDate: training.endTime,
      groupName: training.groupName,
      groupColorName: training.groupColorName,
      clientTraining: training.clientTraining,
    })),
    notes: result.notes,
  };
}

export async function deleteTraining(trainingId: string, deleteAllAfterThis = false): Promise<void> {
  const searchParams = new URLSearchParams({ trainingId });
  if (deleteAllAfterThis) searchParams.set("deleteAllAfterThis", "true");

  const response = await fetch(`/api/trainings?${searchParams.toString()}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось удалить тренировку.");
  }
}
