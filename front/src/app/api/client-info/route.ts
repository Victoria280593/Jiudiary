import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBackendClientInfo, updateBackendClientInfo } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientInfo = await getBackendClientInfo(session.accessToken);
  return clientInfo
    ? NextResponse.json(clientInfo, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      })
    : NextResponse.json({ error: "Client info service is unavailable" }, { status: 502 });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as {
    birthDate: string | null;
    beltId: number | null;
  };

  if (
    input.beltId !== null && !Number.isInteger(input.beltId)
  ) {
    return NextResponse.json({ error: "Некорректные спортивные данные" }, { status: 400 });
  }

  const clientInfo = await updateBackendClientInfo(session.accessToken, input);
  return clientInfo
    ? NextResponse.json(clientInfo, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      })
    : NextResponse.json({ error: "Client info service is unavailable" }, { status: 502 });
}
