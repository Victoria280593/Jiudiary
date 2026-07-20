import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

async function resolveSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return { authed: false, stale: false };

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = (payload as { userId: string }).userId;
  } catch {
    return { authed: false, stale: false };
  }

  // Токен криптографически валиден, но проверяем, что пользователь всё ещё
  // существует в базе — иначе (например, после сброса БД в разработке)
  // proxy.ts вечно считал бы пользователя залогиненным и зацикливал редиректы.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return { authed: !!user, stale: !user };
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
    response.cookies.delete(COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
