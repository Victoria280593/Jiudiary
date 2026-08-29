import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { getSession } from "@/lib/auth";
import { getBackendFightAnalytics } from "@/lib/backend-auth";

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session || !["COACH", "STUDENT"].includes(session.user.role)) redirect("/dashboard");

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 29);
  const analytics = await getBackendFightAnalytics(session.accessToken, toIsoDate(fromDate), toIsoDate(toDate));

  if (!analytics) {
    return <div className="rounded-2xl border border-border bg-white px-5 py-10 text-center text-sm text-danger">Не удалось загрузить аналитику.</div>;
  }

  return <AnalyticsDashboard initialAnalytics={analytics} />;
}
