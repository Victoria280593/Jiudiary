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
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function createSession(session: BackendSession) {
  const expires = new Date(session.expiresAt);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (accessToken) {
    await logoutFromBackend(accessToken);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!accessToken) return null;

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
