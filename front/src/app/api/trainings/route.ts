import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBackendTrainings } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const groupId = new URL(request.url).searchParams.get("groupId") ?? undefined;
  const trainings = await getBackendTrainings(session.accessToken, groupId);

  return trainings
    ? NextResponse.json(trainings, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "Не удалось загрузить тренировки." }, { status: 502 });
}
