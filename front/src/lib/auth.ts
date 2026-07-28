import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  getBackendUser,
  getBackendClientInfo,
  logoutFromBackend,
  type BackendSession,
} from "@/lib/backend-auth";
import { BELT_LABELS } from "@/lib/belt";
import { getCountryList } from "@/lib/countries";
import type { Belt } from "@prisma/client";
import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const BELT_BY_ID: Record<number, Belt> = {
  1: "WHITE",
  2: "GREY_WHITE",
  3: "GREY",
  4: "GREY_BLACK",
  5: "YELLOW_WHITE",
  6: "YELLOW",
  7: "YELLOW_BLACK",
  8: "ORANGE_WHITE",
  9: "ORANGE",
  10: "ORANGE_BLACK",
  11: "GREEN_WHITE",
  12: "GREEN",
  13: "GREEN_BLACK",
  14: "BLUE",
  15: "PURPLE",
  16: "BROWN",
  17: "BLACK",
  18: "BLACK_RED",
  19: "RED",
};

function normalizeText(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("ru-RU");
}

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

  const clientInfo = await getBackendClientInfo(session.accessToken);
  const countryCode = clientInfo?.country
    ? getCountryList().find(
        (country) => normalizeText(country.name) === normalizeText(clientInfo.country as string)
      )?.code ?? persistedUser?.countryCode ?? null
    : persistedUser?.countryCode ?? null;
  const belt = clientInfo?.beltId
    ? BELT_BY_ID[clientInfo.beltId] ?? null
    : clientInfo?.beltName
      ? (Object.entries(BELT_LABELS).find(
          ([, name]) => normalizeText(name) === normalizeText(clientInfo.beltName as string)
        )?.[0] as Belt | undefined) ?? null
      : persistedUser?.belt ?? null;
  const sportsData = clientInfo
    ? {
        countryCode,
        birthDate: clientInfo.birthDate ? new Date(`${clientInfo.birthDate}T00:00:00`) : null,
        belt,
      }
    : {};

  if (persistedUser) return { ...persistedUser, ...sportsData };

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
    blackBeltDegree: null,
    blackBeltAwardedAt: null,
    blackBeltProfessor: null,
    coachId: null,
    ...sportsData,
  };
});
