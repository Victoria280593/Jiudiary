import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBackendGroupColors } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const colors = await getBackendGroupColors(session.accessToken);
  return colors
    ? NextResponse.json(colors, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "Не удалось загрузить цвета групп." }, { status: 502 });
}
