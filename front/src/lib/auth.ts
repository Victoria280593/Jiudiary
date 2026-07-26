import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  getBackendUser,
  logoutFromBackend,
  type BackendSession,
} from "@/lib/backend-auth";
import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/**
 * Записывает полученные от C# API токены в недоступные JavaScript httpOnly-cookie.
 */
export async function createSession(session: BackendSession) {
  const expires = new Date(session.expiresAt);
  const cookieStore = await cookies();
  const appUrl = process.env.APP_URL;
  const secureCookie = appUrl
    ? appUrl.startsWith("https://")
    : process.env.NODE_ENV === "production";

  // Access JWT живёт недолго и отправляется только серверной частью фронта.
  cookieStore.set(SESSION_COOKIE_NAME, session.accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    expires,
  });

  // Refresh-токен живёт дольше и нужен только для получения новой пары токенов.
  cookieStore.set(REFRESH_COOKIE_NAME, session.refreshToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.refreshExpiresAt),
  });
}

/**
 * Отзывает refresh-сессию на backend и удаляет обе локальные cookie.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    await logoutFromBackend(refreshToken);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!accessToken) return null;

  // Backend проверяет подпись и срок JWT; одной только наличия cookie недостаточно.
  const user = await getBackendUser(accessToken);
  return user ? { accessToken, user } : null;
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const persistedUser = await prisma.user.findUnique({
    where: { email: session.user.login.toLowerCase() },
  });

  if (persistedUser) return persistedUser;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.login,
    role: session.user.role,
    avatarUrl: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    countryCode: null,
    birthDate: null,
    belt: null,
    stripes: null,
    blackBeltDegree: null,
    blackBeltAwardedAt: null,
    blackBeltProfessor: null,
    coachId: null,
  };
});
