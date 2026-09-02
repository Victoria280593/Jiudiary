import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveBackendClientTraining } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const input = (await request.json().catch(() => null)) as {
    trainingId?: unknown;
    rounds?: unknown;
    attended?: unknown;
  } | null;
  if (
    !input ||
    typeof input.trainingId !== "string" ||
    !Number.isInteger(input.rounds) ||
    Number(input.rounds) < 0 ||
    typeof input.attended !== "boolean"
  ) {
    return NextResponse.json({ error: "Укажите тренировку, корректное количество раундов и отметку посещения." }, { status: 400 });
  }

  const result = await saveBackendClientTraining(
    session.accessToken,
    input.trainingId,
    Number(input.rounds),
    input.attended
  );
  return result.ok
    ? NextResponse.json(result.clientTraining)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
