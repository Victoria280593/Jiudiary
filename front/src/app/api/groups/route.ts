import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createBackendGroup, deleteBackendGroup, getBackendGroups } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const groups = await getBackendGroups(session.accessToken);
  return groups
    ? NextResponse.json(groups, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "Не удалось загрузить группы." }, { status: 502 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const name = contentType.includes("application/json")
    ? ((await request.json()) as { name?: unknown }).name
    : (await request.formData()).get("name");

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Необходимо указать название группы." }, { status: 400 });
  }

  const created = await createBackendGroup(session.accessToken, name.trim());
  return created
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Не удалось создать группу." }, { status: 502 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const input = (await request.json()) as { id?: unknown };
  if (typeof input.id !== "string" || !input.id.trim()) {
    return NextResponse.json({ error: "Необходимо указать идентификатор группы." }, { status: 400 });
  }

  const result = await deleteBackendGroup(session.accessToken, input.id);
  return result.ok
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
