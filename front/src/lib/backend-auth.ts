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
  user: BackendUser;
};

export type LoginResult =
  | { ok: true; session: BackendSession }
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

export async function loginWithBackend(login: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

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
  } catch {
    return { ok: false, error: "Не удалось подключиться к сервису авторизации" };
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

export async function logoutFromBackend(accessToken: string): Promise<void> {
  try {
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // The local cookie is deleted even if the backend is temporarily unavailable.
  }
}
