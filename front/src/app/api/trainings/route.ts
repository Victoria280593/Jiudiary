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

  const groupIds = new URL(request.url).searchParams.getAll("groupIds");
  const trainings = await getBackendTrainings(session.accessToken, groupIds);

  return trainings
    ? NextResponse.json(trainings, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "Не удалось загрузить тренировки." }, { status: 502 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const trainingId = searchParams.get("trainingId");
  if (!trainingId) {
    return NextResponse.json({ error: "Необходимо указать тренировку." }, { status: 400 });
  }

  const deleteAllAfterThis = searchParams.get("deleteAllAfterThis") === "true";
  const result = await deleteBackendTraining(session.accessToken, trainingId, deleteAllAfterThis);
  return result.ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
