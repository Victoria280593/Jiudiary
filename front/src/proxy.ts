import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const backendUrl = (process.env.BACKEND_URL || "http://localhost:5136").replace(/\/$/, "");

type RefreshedSession = {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
};

function isRefreshedSession(value: unknown): value is RefreshedSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<RefreshedSession>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.expiresAt === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.refreshExpiresAt === "string"
  );
}

async function refreshSession(refreshToken: string): Promise<RefreshedSession | null> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;

    const session: unknown = await response.json();
    return isRefreshedSession(session) ? session : null;
  } catch {
    return null;
  }
}

async function resolveSession(request: NextRequest) {
  const accessToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (accessToken) {
    try {
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      });

      if (response.ok) {
        return { authed: true, stale: false, session: null };
      }
      if (response.status !== 401) {
        return { authed: false, stale: false, session: null };
      }
    } catch {
      return { authed: false, stale: false, session: null };
    }
  }

  if (!refreshToken) {
    return { authed: false, stale: Boolean(accessToken), session: null };
  }

  const session = await refreshSession(refreshToken);
  return session
    ? { authed: true, stale: false, session }
    : { authed: false, stale: true, session: null };
}

function secureCookie() {
  const appUrl = process.env.APP_URL;
  return appUrl ? appUrl.startsWith("https://") : process.env.NODE_ENV === "production";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { authed, stale, session } = await resolveSession(request);

  if (session) {
    request.cookies.set(SESSION_COOKIE_NAME, session.accessToken);
    request.cookies.set(REFRESH_COOKIE_NAME, session.refreshToken);
  }

  let response: NextResponse;

  if (pathname.startsWith("/dashboard") && !authed) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if ((pathname === "/login" || pathname === "/register") && authed) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  if (session) {
    const cookieOptions = {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax" as const,
      path: "/",
    };
    response.cookies.set(SESSION_COOKIE_NAME, session.accessToken, {
      ...cookieOptions,
      expires: new Date(session.expiresAt),
    });
    response.cookies.set(REFRESH_COOKIE_NAME, session.refreshToken, {
      ...cookieOptions,
      expires: new Date(session.refreshExpiresAt),
    });
  } else if (stale) {
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
