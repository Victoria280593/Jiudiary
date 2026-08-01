import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteBackendTraining, getBackendTrainings } from "@/lib/backend-auth";

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

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const trainingId = new URL(request.url).searchParams.get("trainingId");
  if (!trainingId) {
    return NextResponse.json({ error: "Необходимо указать тренировку." }, { status: 400 });
  }

  const result = await deleteBackendTraining(session.accessToken, trainingId);
  return result.ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
