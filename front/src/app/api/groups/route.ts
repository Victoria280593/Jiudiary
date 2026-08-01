import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createBackendGroup, deleteBackendGroup, getBackendGroups, updateBackendGroup } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const groupId = new URL(request.url).searchParams.get("groupId") ?? undefined;
  const groups = await getBackendGroups(session.accessToken, groupId);
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
  const input = contentType.includes("application/json")
    ? ((await request.json()) as { name?: unknown; colorId?: unknown })
    : Object.fromEntries((await request.formData()).entries());
  const name = input.name;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Необходимо указать название группы." }, { status: 400 });
  }

  const colorId = typeof input.colorId === "string" ? Number(input.colorId) : input.colorId;
  if (typeof colorId !== "number" || !Number.isInteger(colorId)) {
    return NextResponse.json({ error: "Необходимо выбрать цвет группы." }, { status: 400 });
  }

  const created = await createBackendGroup(session.accessToken, name.trim(), colorId);
  return created
    ? NextResponse.json(created)
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

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const input = (await request.json()) as { id?: unknown; name?: unknown; colorId?: unknown };
  if (typeof input.id !== "string" || !input.id.trim()) {
    return NextResponse.json({ error: "Необходимо указать идентификатор группы." }, { status: 400 });
  }
  if (typeof input.name !== "string" || !input.name.trim()) {
    return NextResponse.json({ error: "Необходимо указать название группы." }, { status: 400 });
  }
  if (typeof input.colorId !== "number" || !Number.isInteger(input.colorId)) {
    return NextResponse.json({ error: "Необходимо выбрать цвет группы." }, { status: 400 });
  }

  const result = await updateBackendGroup(session.accessToken, input.id, input.name.trim(), input.colorId);
  return result.ok
    ? NextResponse.json(result.group)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
