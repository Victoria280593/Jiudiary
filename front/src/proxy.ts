import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const backendUrl = (process.env.BACKEND_URL || "http://localhost:5136").replace(/\/$/, "");

async function resolveSession(request: NextRequest) {
  const accessToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!accessToken) return { authed: false, stale: false };

  try {
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });

    return {
      authed: response.ok,
      stale: response.status === 401,
    };
  } catch {
    return { authed: false, stale: false };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { authed, stale } = await resolveSession(request);

  let response: NextResponse;

  if (pathname.startsWith("/dashboard") && !authed) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if ((pathname === "/login" || pathname === "/register") && authed) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = NextResponse.next();
  }

  if (stale) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
