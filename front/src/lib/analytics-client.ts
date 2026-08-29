export type FightAnalyticsPoint = {
  date: string;
  fightsCount: number;
};

export type FightAnalytics = {
  fromDate: string;
  toDate: string;
  fightsCount: number;
  points: FightAnalyticsPoint[];
};

export async function getFightAnalytics(fromDate: string, toDate: string): Promise<FightAnalytics> {
  const searchParams = new URLSearchParams({ fromDate, toDate });
  const response = await fetch(`/api/analytics/fights?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось загрузить аналитику схваток.");
  }

  return response.json() as Promise<FightAnalytics>;
}
