import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteBackendClientTrainingSubmission, updateBackendClientTrainingSubmission } from "@/lib/backend-auth";

type RouteContext = { params: Promise<{ trainingId: string; submissionId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as { count?: unknown } | null;
  if (!input || !Number.isInteger(input.count) || Number(input.count) <= 0) {
    return NextResponse.json({ error: "Количество приёмов должно быть больше нуля." }, { status: 400 });
  }

  const { trainingId, submissionId: submissionIdText } = await context.params;
  const submissionId = Number(submissionIdText);
  if (!Number.isInteger(submissionId) || submissionId <= 0) return NextResponse.json({ error: "Укажите корректный приём." }, { status: 400 });

  const result = await updateBackendClientTrainingSubmission(session.accessToken, trainingId, submissionId, Number(input.count));
  return result.ok
    ? NextResponse.json(result.submission)
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const { trainingId, submissionId: submissionIdText } = await context.params;
  const submissionId = Number(submissionIdText);
  if (!Number.isInteger(submissionId) || submissionId <= 0) return NextResponse.json({ error: "Укажите корректный приём." }, { status: 400 });

  const result = await deleteBackendClientTrainingSubmission(session.accessToken, trainingId, submissionId);
  return result.ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
