import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createBackendClientDayNote, deleteBackendClientDayNote, getBackendClientDayNotes, updateBackendClientDayNote } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const date = new URL(request.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Необходимо указать дату заметки." }, { status: 400 });

  const result = await getBackendClientDayNotes(session.accessToken, date);
  return result.ok
    ? NextResponse.json(result.notes, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as { date?: unknown; text?: unknown } | null;
  if (!input || typeof input.date !== "string" || typeof input.text !== "string") {
    return NextResponse.json({ error: "Укажите дату и текст заметки." }, { status: 400 });
  }

  const result = await createBackendClientDayNote(session.accessToken, input.date, input.text);
  return result.ok
    ? NextResponse.json(result.note)
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as { id?: unknown; text?: unknown } | null;
  if (!input || typeof input.id !== "string" || typeof input.text !== "string") {
    return NextResponse.json({ error: "Укажите заметку и новый текст." }, { status: 400 });
  }

  const result = await updateBackendClientDayNote(session.accessToken, input.id, input.text);
  return result.ok
    ? NextResponse.json(result.note)
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (!input || typeof input.id !== "string") {
    return NextResponse.json({ error: "Укажите заметку." }, { status: 400 });
  }

  const result = await deleteBackendClientDayNote(session.accessToken, input.id);
  return result.ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
