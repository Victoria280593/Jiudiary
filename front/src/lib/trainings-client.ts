export type CalendarTraining = {
  id: string;
  title: string;
  date: string;
};

type TrainingResponse = {
  id: string;
  groupId: string;
  groupName: string;
  description: string | null;
  time: string;
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
    date: training.time,
  }));
}
