import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addBackendClientTrainingSubmission } from "@/lib/backend-auth";

type RouteContext = { params: Promise<{ trainingId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as { submissionId?: unknown } | null;
  if (!input || !Number.isInteger(input.submissionId) || Number(input.submissionId) <= 0) {
    return NextResponse.json({ error: "Укажите корректный приём." }, { status: 400 });
  }

  const { trainingId } = await context.params;
  const result = await addBackendClientTrainingSubmission(session.accessToken, trainingId, Number(input.submissionId));
  return result.ok
    ? NextResponse.json(result.submission)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
