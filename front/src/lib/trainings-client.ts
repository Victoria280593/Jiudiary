export type CalendarTraining = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  endDate: string;
  groupName: string;
  groupColorName: string;
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
};

export async function getTrainings(groupIds: string[] = []): Promise<CalendarTraining[]> {
  const searchParams = new URLSearchParams();
  groupIds.forEach((groupId) => searchParams.append("groupIds", groupId));
  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const response = await fetch(`/api/trainings${query}`, { cache: "no-store" });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось загрузить тренировки.");
  }

  const trainings = (await response.json()) as TrainingResponse[];
  return trainings.map((training) => ({
    id: training.id,
    groupId: training.groupId,
    title: training.description ?? "",
    date: training.startTime,
    endDate: training.endTime,
    groupName: training.groupName,
    groupColorName: training.groupColorName,
  }));
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
