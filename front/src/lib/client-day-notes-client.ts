export type ClientDayNote = {
  id: string;
  date: string;
  text: string;
  createdAt: string;
  updatedAt: string | null;
};

export async function getClientDayNotes(date: string, signal?: AbortSignal): Promise<ClientDayNote[]> {
  const response = await fetch(`/api/client-day-notes?date=${encodeURIComponent(date)}`, { cache: "no-store", signal });
  if (!response.ok) throw await clientDayNoteError(response, "Не удалось загрузить заметку.");
  return response.json() as Promise<ClientDayNote[]>;
}

export async function createClientDayNote(date: string, text: string): Promise<ClientDayNote> {
  return saveClientDayNote("POST", { date, text });
}

export async function updateClientDayNote(id: string, text: string): Promise<ClientDayNote> {
  return saveClientDayNote("PUT", { id, text });
}

export async function deleteClientDayNote(id: string): Promise<void> {
  const response = await fetch("/api/client-day-notes", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    cache: "no-store",
  });
  if (!response.ok) throw await clientDayNoteError(response, "Не удалось удалить заметку.");
}

async function saveClientDayNote(method: "POST" | "PUT", body: object): Promise<ClientDayNote> {
  const response = await fetch("/api/client-day-notes", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await clientDayNoteError(response, "Не удалось сохранить заметку.");
  return response.json() as Promise<ClientDayNote>;
}

async function clientDayNoteError(response: Response, fallback: string): Promise<Error> {
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  return new Error(result?.error ?? fallback);
}
