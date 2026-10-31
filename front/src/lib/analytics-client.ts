export type FightAnalyticsPoint = {
  date: string;
  fightsCount: number;
};

export type SubmissionAnalyticsPoint = {
  submissionId: number;
  nameRu: string;
  nameEn: string;
  count: number;
};

export type FightAnalytics = {
  fromDate: string;
  toDate: string;
  allTimeFightsCount: number;
  periodFightsCount: number;
  allTimeTrainingsCount: number;
  periodTrainingsCount: number;
  allTimeSubmissionsCount: number;
  periodSubmissionsCount: number;
  allTimeAverageFightsPerTraining: number;
  periodAverageFightsPerTraining: number;
  points: FightAnalyticsPoint[];
  submissionDistribution: SubmissionAnalyticsPoint[];
  allTimeSubmissionDistribution: SubmissionAnalyticsPoint[];
};

export async function getFightAnalytics(fromDate: string, toDate: string): Promise<FightAnalytics> {
  const searchParams = new URLSearchParams({ fromDate, toDate });
  const response = await fetch(`/api/analytics/fights?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Не удалось загрузить аналитику.");
  }

  return response.json() as Promise<FightAnalytics>;
}
