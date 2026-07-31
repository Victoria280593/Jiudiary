import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createBackendBranch } from "@/lib/backend-auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const input = (await request.json()) as { name?: unknown };
  if (typeof input.name !== "string" || !input.name.trim()) {
    return NextResponse.json({ error: "Необходимо указать название филиала." }, { status: 400 });
  }

  const created = await createBackendBranch(session.accessToken, input.name.trim());
  return created
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Не удалось создать филиал." }, { status: 502 });
}
