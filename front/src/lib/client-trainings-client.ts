export type ClientTraining = {
  id: string;
  trainingId: string;
  rounds: number | null;
  attended: boolean;
  createdAt: string;
};

export async function saveClientTraining(trainingId: string, rounds: number, attended: boolean): Promise<ClientTraining> {
  const response = await fetch("/api/client-trainings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trainingId, rounds, attended }),
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось отметить тренировку.");
  }

  return response.json() as Promise<ClientTraining>;
}
