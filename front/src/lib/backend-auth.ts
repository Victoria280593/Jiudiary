import "server-only";
import type { Role } from "@prisma/client";

const backendUrl = (process.env.BACKEND_URL || "http://localhost:5136").replace(/\/$/, "");

export type BackendUser = {
  id: string;
  login: string;
  name: string;
  role: Role;
};

export type BackendSession = {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: BackendUser;
};

export type BackendClientInfo = {
  country: string | null;
  birthDate: string | null;
  beltId: number | null;
  beltName: string | null;
};

export type BackendGroup = {
  id: string;
  name: string;
};

export type BackendTraining = {
  id: string;
  groupId: string;
  groupName: string;
  description: string | null;
  time: string;
};

function isBackendGroup(value: unknown): value is BackendGroup {
  if (!value || typeof value !== "object") return false;

  const group = value as Partial<BackendGroup>;
  return typeof group.id === "string" && typeof group.name === "string";
}

function isBackendTraining(value: unknown): value is BackendTraining {
  if (!value || typeof value !== "object") return false;

  const training = value as Partial<BackendTraining>;
  return (
    typeof training.id === "string" &&
    typeof training.groupId === "string" &&
    typeof training.groupName === "string" &&
    (training.description === null || typeof training.description === "string") &&
    typeof training.time === "string"
  );
}

export type LoginResult =
  | { ok: true; session: BackendSession }
  | { ok: false; error: string };

export type RegisterResult =
  | { ok: true; user: BackendUser }
  | { ok: false; error: string };

const roles = new Set<Role>(["ADMIN", "COACH", "STUDENT", "PARENT"]);

function isBackendSession(value: unknown): value is BackendSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<BackendSession>;
  const user = session.user as Partial<BackendUser> | undefined;

  return (
    typeof session.accessToken === "string" &&
    session.tokenType === "Bearer" &&
    typeof session.expiresAt === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.refreshExpiresAt === "string" &&
    !!user &&
    typeof user.id === "string" &&
    typeof user.login === "string" &&
    typeof user.name === "string" &&
    typeof user.role === "string" &&
    roles.has(user.role as Role)
  );
}

function isBackendUser(value: unknown): value is BackendUser {
  if (!value || typeof value !== "object") return false;

  const user = value as Partial<BackendUser>;
  return (
    typeof user.id === "string" &&
    typeof user.login === "string" &&
    typeof user.name === "string" &&
    typeof user.role === "string" &&
    roles.has(user.role as Role)
  );
}

async function readSessionResponse(response: Response): Promise<LoginResult> {
  if (response.status === 401) {
    return { ok: false, error: "Неверный email или пароль" };
  }
  if (response.status === 429) {
    return { ok: false, error: "Слишком много попыток. Повторите через минуту" };
  }
  if (!response.ok) {
    return { ok: false, error: "Сервис авторизации временно недоступен" };
  }

  const session: unknown = await response.json();
  if (!isBackendSession(session)) {
    return { ok: false, error: "Сервис авторизации вернул некорректный ответ" };
  }

  return { ok: true, session };
}

export async function loginWithBackend(login: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    return await readSessionResponse(response);
  } catch {
    return { ok: false, error: "Не удалось подключиться к сервису авторизации" };
  }
}

export async function registerWithBackend(
  login: string,
  name: string,
  password: string
): Promise<RegisterResult> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, name, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 409) {
      return { ok: false, error: "Пользователь с таким email уже зарегистрирован" };
    }
    if (response.status === 400) {
      return { ok: false, error: "Проверьте имя, email и пароль" };
    }
    if (!response.ok) {
      return { ok: false, error: "Сервис регистрации временно недоступен" };
    }

    const user: unknown = await response.json();
    return isBackendUser(user)
      ? { ok: true, user }
      : { ok: false, error: "Сервис регистрации вернул некорректный ответ" };
  } catch {
    return { ok: false, error: "Не удалось подключиться к сервису регистрации" };
  }
}

export async function refreshBackendSession(refreshToken: string): Promise<BackendSession | null> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;

    const session: unknown = await response.json();
    return isBackendSession(session) ? session : null;
  } catch {
    return null;
  }
}

export async function getBackendUser(accessToken: string): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const user: unknown = await response.json();
    return isBackendUser(user) ? user : null;
  } catch {
    return null;
  }
}

export async function getBackendClientInfo(accessToken: string): Promise<BackendClientInfo | null> {
  try {
    const response = await fetch(`${backendUrl}/api/client-info`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;
    return (await response.json()) as BackendClientInfo;
  } catch {
    return null;
  }
}

export async function updateBackendClientInfo(
  accessToken: string,
  data: {
    country: string | null;
    birthDate: string | null;
    beltId: number | null;
  }
): Promise<BackendClientInfo | null> {
  try {
    const response = await fetch(`${backendUrl}/api/client-info`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;
    return (await response.json()) as BackendClientInfo;
  } catch {
    return null;
  }
}

export async function createBackendGroup(accessToken: string, name: string): Promise<BackendGroup | null> {
  try {
    const response = await fetch(`${backendUrl}/api/groups`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const group: unknown = await response.json();
    return isBackendGroup(group) ? group : null;
  } catch {
    return null;
  }
}

export async function getBackendGroups(accessToken: string): Promise<BackendGroup[] | null> {
  try {
    const response = await fetch(`${backendUrl}/api/groups`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const groups: unknown = await response.json();
    if (!Array.isArray(groups)) return null;

    return groups.every(isBackendGroup)
      ? (groups as BackendGroup[])
      : null;
  } catch {
    return null;
  }
}

export type DeleteBackendGroupResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function deleteBackendGroup(accessToken: string, groupId: string): Promise<DeleteBackendGroupResult> {
  try {
    const response = await fetch(`${backendUrl}/api/groups/${encodeURIComponent(groupId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.ok) return { ok: true };

    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    return {
      ok: false,
      status: response.status,
      error: result?.error ?? "Не удалось удалить группу.",
    };
  } catch {
    return { ok: false, status: 502, error: "Не удалось подключиться к серверу." };
  }
}

export type CreateBackendTrainingResult =
  | { ok: true; training: BackendTraining }
  | { ok: false; error: string };

export async function createBackendTraining(
  accessToken: string,
  input: { groupId: string; description: string | null; time: string }
): Promise<CreateBackendTrainingResult> {
  try {
    const response = await fetch(`${backendUrl}/api/trainings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: result?.error ?? "Не удалось создать тренировку." };
    }

    const training: unknown = await response.json();
    return isBackendTraining(training)
      ? { ok: true, training }
      : { ok: false, error: "Сервер вернул некорректные данные тренировки." };
  } catch {
    return { ok: false, error: "Не удалось подключиться к серверу." };
  }
}

export async function getBackendTrainings(accessToken: string, groupId?: string): Promise<BackendTraining[] | null> {
  try {
    const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
    const response = await fetch(`${backendUrl}/api/trainings${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const trainings: unknown = await response.json();
    return Array.isArray(trainings) && trainings.every(isBackendTraining)
      ? trainings
      : null;
  } catch {
    return null;
  }
}

export async function logoutFromBackend(refreshToken: string): Promise<void> {
  try {
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Local cookies are deleted even if the backend is temporarily unavailable.
  }
}
