import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBackendFightAnalytics } from "@/lib/backend-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Пользователь не авторизован." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  if (!fromDate || !toDate) {
    return NextResponse.json({ error: "Необходимо указать период аналитики." }, { status: 400 });
  }

  const analytics = await getBackendFightAnalytics(session.accessToken, fromDate, toDate);
  return analytics
    ? NextResponse.json(analytics, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ error: "Не удалось загрузить аналитику." }, { status: 502 });
}
