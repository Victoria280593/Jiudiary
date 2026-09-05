export type ClientTraining = {
  id: string;
  trainingId: string;
  rounds: number | null;
  submissions: ClientTrainingSubmission[];
  createdAt: string;
};

export type ClientTrainingSubmission = {
  submissionId: number;
  nameRu: string;
  nameEn: string;
  count: number;
};

export type SubmissionSearchResult = {
  id: number;
  nameRu: string;
  nameEn: string;
};

export async function saveClientTraining(trainingId: string, rounds: number): Promise<ClientTraining> {
  const response = await fetch("/api/client-trainings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trainingId, rounds }),
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось отметить тренировку.");
  }

  return response.json() as Promise<ClientTraining>;
}

export async function searchSubmissions(query: string, signal?: AbortSignal): Promise<SubmissionSearchResult[]> {
  const response = await fetch(`/api/client-trainings/submissions/search?query=${encodeURIComponent(query)}`, { cache: "no-store", signal });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось найти приём.");
  }
  return response.json() as Promise<SubmissionSearchResult[]>;
}

export async function addClientTrainingSubmission(trainingId: string, submissionId: number): Promise<ClientTrainingSubmission> {
  return saveClientTrainingSubmission(`/api/client-trainings/${encodeURIComponent(trainingId)}/submissions`, "POST", { submissionId });
}

export async function updateClientTrainingSubmission(trainingId: string, submissionId: number, count: number): Promise<ClientTrainingSubmission> {
  return saveClientTrainingSubmission(`/api/client-trainings/${encodeURIComponent(trainingId)}/submissions/${submissionId}`, "PUT", { count });
}

async function saveClientTrainingSubmission(url: string, method: "POST" | "PUT", body: object): Promise<ClientTrainingSubmission> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось сохранить приём.");
  }
  return response.json() as Promise<ClientTrainingSubmission>;
}

export async function deleteClientTrainingSubmission(trainingId: string, submissionId: number): Promise<void> {
  const response = await fetch(`/api/client-trainings/${encodeURIComponent(trainingId)}/submissions/${submissionId}`, { method: "DELETE", cache: "no-store" });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось удалить приём.");
  }
}
