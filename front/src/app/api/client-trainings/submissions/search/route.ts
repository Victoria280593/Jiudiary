import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchBackendSubmissions } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const query = new URL(request.url).searchParams.get("query") ?? "";
  const result = await searchBackendSubmissions(session.accessToken, query);
  return result.ok
    ? NextResponse.json(result.submissions)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
