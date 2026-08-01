export type CalendarTraining = {
  id: string;
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

export async function getTrainings(groupId?: string): Promise<CalendarTraining[]> {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  const response = await fetch(`/api/trainings${query}`, { cache: "no-store" });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось загрузить тренировки.");
  }

  const trainings = (await response.json()) as TrainingResponse[];
  return trainings.map((training) => ({
    id: training.id,
    title: training.description || `Тренировка · ${training.groupName}`,
    date: training.startTime,
    endDate: training.endTime,
    groupName: training.groupName,
    groupColorName: training.groupColorName,
  }));
}
