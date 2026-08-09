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
  birthDate: string | null;
  beltId: number | null;
  beltName: string | null;
};

export type BackendGroup = {
  id: string;
  name: string;
  colorId: number;
  colorName: string;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
};

export type BackendGroupColor = {
  id: number;
  name: string;
};

export type BackendTraining = {
  id: string;
  groupId: string;
  groupName: string;
  groupColorId: number;
  groupColorName: string;
  description: string | null;
  startTime: string;
  endTime: string;
};

export type BackendTrainer = {
  id: string;
  name: string;
  login: string;
  beltId: number | null;
  beltName: string | null;
};

export type BackendTrainerPage = {
  items: BackendTrainer[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
};

export type BackendStudentRequestStatus = "Pending" | "Accepted" | "Rejected";

export type BackendStudentRequest = {
  id: string;
  studentId: string;
  studentName: string;
  studentLogin: string;
  coachId: string;
  coachName: string;
  coachLogin: string;
  status: BackendStudentRequestStatus;
  createDate: string;
};

export type BackendStudent = {
  id: string;
  name: string;
  login: string;
  beltId: number | null;
  beltName: string | null;
};

function isBackendGroup(value: unknown): value is BackendGroup {
  if (!value || typeof value !== "object") return false;

  const group = value as Partial<BackendGroup>;
  return (
    typeof group.id === "string" &&
    typeof group.name === "string" &&
    typeof group.colorId === "number" &&
    typeof group.colorName === "string" &&
    (group.defaultStartTime === null || typeof group.defaultStartTime === "string") &&
    (group.defaultEndTime === null || typeof group.defaultEndTime === "string")
  );
}

function isBackendGroupColor(value: unknown): value is BackendGroupColor {
  if (!value || typeof value !== "object") return false;

  const color = value as Partial<BackendGroupColor>;
  return typeof color.id === "number" && typeof color.name === "string";
}

function isBackendTraining(value: unknown): value is BackendTraining {
  if (!value || typeof value !== "object") return false;

  const training = value as Partial<BackendTraining>;
  return (
    typeof training.id === "string" &&
    typeof training.groupId === "string" &&
    typeof training.groupName === "string" &&
    typeof training.groupColorId === "number" &&
    typeof training.groupColorName === "string" &&
    (training.description === null || typeof training.description === "string") &&
    typeof training.startTime === "string" &&
    typeof training.endTime === "string"
  );
}

function isBackendTrainer(value: unknown): value is BackendTrainer {
  if (!value || typeof value !== "object") return false;

  const trainer = value as Partial<BackendTrainer>;
  return (
    typeof trainer.id === "string" &&
    typeof trainer.name === "string" &&
    typeof trainer.login === "string" &&
    (trainer.beltId === null || typeof trainer.beltId === "number") &&
    (trainer.beltName === null || typeof trainer.beltName === "string")
  );
}

function isBackendTrainerPage(value: unknown): value is BackendTrainerPage {
  if (!value || typeof value !== "object") return false;

  const page = value as Partial<BackendTrainerPage>;
  return (
    Array.isArray(page.items) &&
    page.items.every(isBackendTrainer) &&
    typeof page.page === "number" &&
    typeof page.itemsPerPage === "number" &&
    typeof page.totalItems === "number" &&
    typeof page.totalPages === "number"
  );
}

function isBackendStudentRequest(value: unknown): value is BackendStudentRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Partial<BackendStudentRequest>;
  return (
    typeof request.id === "string" &&
    typeof request.studentId === "string" &&
    typeof request.studentName === "string" &&
    typeof request.studentLogin === "string" &&
    typeof request.coachId === "string" &&
    typeof request.coachName === "string" &&
    typeof request.coachLogin === "string" &&
    ["Pending", "Accepted", "Rejected"].includes(request.status ?? "") &&
    typeof request.createDate === "string"
  );
}

function isBackendStudent(value: unknown): value is BackendStudent {
  if (!value || typeof value !== "object") return false;

  const student = value as Partial<BackendStudent>;
  return (
    typeof student.id === "string" &&
    typeof student.name === "string" &&
    typeof student.login === "string" &&
    (student.beltId === null || typeof student.beltId === "number") &&
    (student.beltName === null || typeof student.beltName === "string")
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

export async function loginWithBackend(
  login: string,
  password: string,
  role: "COACH" | "STUDENT"
): Promise<LoginResult> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, role }),
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
  firstName: string,
  lastName: string,
  middleName: string | null,
  password: string,
  role: "COACH" | "STUDENT"
): Promise<RegisterResult> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, firstName, lastName, middleName, password, role }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 409) {
      return { ok: false, error: "Пользователь с таким логином уже зарегистрирован" };
    }
    if (response.status === 400) {
      return { ok: false, error: "Проверьте ФИО, логин и пароль" };
    }
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        ok: false,
        error: result?.error ?? "Сервис регистрации временно недоступен",
      };
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

export async function getBackendTrainers(
  accessToken: string,
  filter: { page?: number; itemsPerPage?: number; search?: string }
): Promise<BackendTrainerPage | null> {
  try {
    const query = new URLSearchParams({
      page: String(filter.page ?? 1),
      itemsPerPage: String(filter.itemsPerPage ?? 10),
    });
    if (filter.search?.trim()) query.set("search", filter.search.trim());

    const response = await fetch(`${backendUrl}/api/trainers?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;

    const trainers: unknown = await response.json();
    return isBackendTrainerPage(trainers) ? trainers : null;
  } catch {
    return null;
  }
}

async function getBackendList<T>(
  accessToken: string,
  path: string,
  validator: (value: unknown) => value is T
): Promise<T[] | null> {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;

    const items: unknown = await response.json();
    return Array.isArray(items) && items.every(validator) ? items : null;
  } catch {
    return null;
  }
}

export function getBackendStudentTrainerRequests(accessToken: string) {
  return getBackendList(accessToken, "/api/trainers/requests", isBackendStudentRequest);
}

export function getBackendStudentTrainers(accessToken: string) {
  return getBackendList(accessToken, "/api/trainers/my", isBackendTrainer);
}

export function getBackendCoachStudentRequests(accessToken: string) {
  return getBackendList(accessToken, "/api/trainers/students/requests", isBackendStudentRequest);
}

export function getBackendCoachStudents(accessToken: string) {
  return getBackendList(accessToken, "/api/trainers/students", isBackendStudent);
}

export type StudentRequestMutationResult =
  | { ok: true; request: BackendStudentRequest }
  | { ok: false; status: number; error: string };

export async function createBackendStudentRequest(
  accessToken: string,
  coachId: string
): Promise<StudentRequestMutationResult> {
  return mutateBackendStudentRequest(
    accessToken,
    `/api/trainers/${encodeURIComponent(coachId)}/students/requests`,
    "POST"
  );
}

export async function resolveBackendStudentRequest(
  accessToken: string,
  requestId: string,
  status: "Accepted" | "Rejected"
): Promise<StudentRequestMutationResult> {
  return mutateBackendStudentRequest(
    accessToken,
    `/api/trainers/students/requests/${encodeURIComponent(requestId)}`,
    "PATCH",
    { status }
  );
}

async function mutateBackendStudentRequest(
  accessToken: string,
  path: string,
  method: "POST" | "PATCH",
  body?: object
): Promise<StudentRequestMutationResult> {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const result: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: (result as { error?: string } | null)?.error ?? "Не удалось обработать заявку.",
      };
    }

    return isBackendStudentRequest(result)
      ? { ok: true, request: result }
      : { ok: false, status: 502, error: "Сервер вернул некорректные данные заявки." };
  } catch {
    return { ok: false, status: 502, error: "Не удалось подключиться к серверу." };
  }
}

export async function removeBackendCoachStudent(
  accessToken: string,
  studentId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  try {
    const response = await fetch(
      `${backendUrl}/api/trainers/students/${encodeURIComponent(studentId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      }
    );

    if (response.ok) return { ok: true };

    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    return {
      ok: false,
      status: response.status,
      error: result?.error ?? "Не удалось удалить ученика.",
    };
  } catch {
    return { ok: false, status: 502, error: "Не удалось подключиться к серверу." };
  }
}

export async function updateBackendClientInfo(
  accessToken: string,
  data: {
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

export async function createBackendGroup(accessToken: string, name: string, colorId: number, defaultStartTime: string | null, defaultEndTime: string | null): Promise<BackendGroup | null> {
  try {
    const response = await fetch(`${backendUrl}/api/groups`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, colorId, defaultStartTime, defaultEndTime }),
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

export async function getBackendGroups(accessToken: string, groupId?: string): Promise<BackendGroup[] | null> {
  try {
    const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
    const response = await fetch(`${backendUrl}/api/groups${query}`, {
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

export async function getBackendGroupColors(accessToken: string): Promise<BackendGroupColor[] | null> {
  try {
    const response = await fetch(`${backendUrl}/api/groups/colors`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const colors: unknown = await response.json();
    return Array.isArray(colors) && colors.every(isBackendGroupColor)
      ? colors
      : null;
  } catch {
    return null;
  }
}

export type UpdateBackendGroupResult =
  | { ok: true; group: BackendGroup }
  | { ok: false; status: number; error: string };

export async function updateBackendGroup(accessToken: string, groupId: string, name: string, colorId: number, defaultStartTime: string | null, defaultEndTime: string | null): Promise<UpdateBackendGroupResult> {
  try {
    const response = await fetch(`${backendUrl}/api/groups/${encodeURIComponent(groupId)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, colorId, defaultStartTime, defaultEndTime }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.ok) {
      const group: unknown = await response.json();
      return isBackendGroup(group)
        ? { ok: true, group }
        : { ok: false, status: 502, error: "Сервер вернул некорректные данные группы." };
    }

    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    return {
      ok: false,
      status: response.status,
      error: result?.error ?? "Не удалось отредактировать группу.",
    };
  } catch {
    return { ok: false, status: 502, error: "Не удалось подключиться к серверу." };
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
  input: { groupId: string; description: string | null; startTime: string; endTime: string }
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

export type DeleteBackendTrainingResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function deleteBackendTraining(accessToken: string, trainingId: string): Promise<DeleteBackendTrainingResult> {
  try {
    const response = await fetch(`${backendUrl}/api/trainings/${encodeURIComponent(trainingId)}`, {
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
      error: result?.error ?? "Не удалось удалить тренировку.",
    };
  } catch {
    return { ok: false, status: 502, error: "Не удалось подключиться к серверу." };
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
