import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createBackendStudentRequest,
  deleteBackendStudentRequest,
  removeBackendCoachStudent,
  resolveBackendStudentRequest,
} from "@/lib/backend-auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as { coachId?: string } | null;
  if (!input?.coachId) {
    return NextResponse.json({ error: "Необходимо выбрать тренера." }, { status: 400 });
  }

  const result = await createBackendStudentRequest(session.accessToken, input.coachId);
  return result.ok
    ? NextResponse.json(result.request, { status: 201 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as {
    requestId?: string;
    status?: "Accepted" | "Rejected";
  } | null;
  if (!input?.requestId || !input.status || !["Accepted", "Rejected"].includes(input.status)) {
    return NextResponse.json({ error: "Некорректное решение по заявке." }, { status: 400 });
  }

  const result = await resolveBackendStudentRequest(
    session.accessToken,
    input.requestId,
    input.status
  );
  return result.ok
    ? NextResponse.json(result.request)
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as {
    requestId?: string;
    studentId?: string;
  } | null;
  if (input?.requestId) {
    const result = await deleteBackendStudentRequest(session.accessToken, input.requestId);
    return result.ok
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (session.user.role !== "COACH") {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  if (!input?.studentId) {
    return NextResponse.json({ error: "Необходимо выбрать ученика или заявку." }, { status: 400 });
  }

  const result = await removeBackendCoachStudent(session.accessToken, input.studentId);
  return result.ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
