"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  getFightAnalytics,
  type FightAnalytics,
  type FightAnalyticsPoint,
} from "@/lib/analytics-client";
import { errorClass } from "@/lib/ui";
import type { FightChartPoint } from "./FightTrendChart";

const FightTrendChart = dynamic(() => import("./FightTrendChart"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-2xl bg-surface-muted" aria-label="Загрузка графика" />,
});
const SubmissionDistributionChart = dynamic(() => import("./SubmissionDistributionChart"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" aria-label="Загрузка распределения сабмишенов" />,
});
type GroupBy = "day" | "week" | "month";
type PeriodPreset = "currentWeek" | "currentMonth" | "currentYear";

const groupLabels: Record<GroupBy, string> = {
  day: "По дням",
  week: "По неделям",
  month: "По месяцам",
};

const groupDescriptions: Record<GroupBy, string> = {
  day: "Детальная динамика по каждому дню",
  week: "Суммарное количество за каждую неделю",
  month: "Суммарное количество за каждый месяц",
};

const presets = [
  { id: "currentWeek", label: "За текущую неделю" },
  { id: "currentMonth", label: "За текущий месяц" },
  { id: "currentYear", label: "За текущий год" },
] satisfies { id: PeriodPreset; label: string }[];

function presetPeriod(preset: PeriodPreset) {
  const today = new Date();
  const start = preset === "currentWeek"
    ? startOfWeek(today)
    : preset === "currentMonth"
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today.getFullYear(), 0, 1);
  const end = preset === "currentWeek"
    ? addDays(start, 6)
    : preset === "currentMonth"
      ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
      : new Date(today.getFullYear(), 11, 31);
  return { fromDate: toIsoDate(start), toDate: toIsoDate(end) };
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function periodDays(fromDate: string, toDateValue: string) {
  return Math.round((toDate(toDateValue).getTime() - toDate(fromDate).getTime()) / 86_400_000) + 1;
}

function availableGroups(fromDate: string, toDateValue: string): GroupBy[] {
  const days = periodDays(fromDate, toDateValue);
  if (days <= 14) return ["day"];
  if (days <= 60) return ["day", "week"];
  if (days <= 180) return ["week", "month"];
  return ["month"];
}

function recommendedGroup(fromDate: string, toDateValue: string): GroupBy {
  const days = periodDays(fromDate, toDateValue);
  if (days <= 30) return "day";
  if (days <= 180) return "week";
  return "month";
}

function chartLabels(date: Date, groupBy: GroupBy) {
  if (groupBy === "month") {
    return {
      label: new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date),
      compactLabel: new Intl.DateTimeFormat("ru-RU", { month: "short", year: "2-digit" }).format(date),
    };
  }
  if (groupBy === "week") {
    const label = `с ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date)}`;
    return { label, compactLabel: label };
  }

  const formattedDate = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date);
  const compactWeekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date).replace(".", "");
  return { label: `${formattedDate} (${weekday})`, compactLabel: `${formattedDate} (${compactWeekday})` };
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function aggregatePoints(analytics: FightAnalytics, groupBy: GroupBy): FightChartPoint[] {
  const analyticsByDate = new Map(analytics.points.map((point) => [point.date, point]));
  const dailyPoints: FightAnalyticsPoint[] = [];
  for (let date = toDate(analytics.fromDate); date <= toDate(analytics.toDate); date = addDays(date, 1)) {
    const dateKey = toIsoDate(date);
    const sourcePoint = analyticsByDate.get(dateKey);
    dailyPoints.push({ date: dateKey, fightsCount: sourcePoint?.fightsCount ?? 0 });
  }

  const groups = new Map<string, { date: Date; fightsCount: number }>();
  for (const point of dailyPoints) {
    const date = toDate(point.date);
    const groupDate = groupBy === "week"
      ? startOfWeek(date)
      : groupBy === "month"
        ? new Date(date.getFullYear(), date.getMonth(), 1)
        : date;
    const key = toIsoDate(groupDate);
    const current = groups.get(key);
    groups.set(key, {
      date: groupDate,
      fightsCount: (current?.fightsCount ?? 0) + point.fightsCount,
    });
  }

  return [...groups.values()].map((point) => ({ ...chartLabels(point.date, groupBy), fightsCount: point.fightsCount }));
}

function FightsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 15.5 10ZM3 19v-1.5A4.5 4.5 0 0 1 7.5 13h2a4.5 4.5 0 0 1 4.5 4.5V19m0-5.5h1.5a4 4 0 0 1 4 4V19" />
    </svg>
  );
}

type MetricKind = "fights" | "trainings" | "average" | "submissions";

function MetricIcon({ kind }: { kind: MetricKind }) {
  if (kind === "trainings") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path strokeLinecap="round" d="M8 3v4m8-4v4M4 10h16" /></svg>;
  }
  if (kind === "average") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 19V9m7 10V5m7 14v-7M3 19h18" /></svg>;
  }
  if (kind === "submissions") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8v3a4 4 0 0 1-8 0V4Zm0 2H5v1a4 4 0 0 0 4 4m7-5h3v1a4 4 0 0 1-4 4m-3 0v5m-4 4h8m-6-4h4" /></svg>;
  }
  return <FightsIcon />;
}

function AnalyticsSummaryBlock({ title, description, metrics }: { title: string; description: string; metrics: { label: string; value: string | number; kind: MetricKind }[] }) {
  return (
    <article className="calendar-shadow min-w-0 rounded-[1.4rem] border border-border/75 bg-white/94 p-4 sm:p-6">
      <header className="min-w-0">
        <h2 className="text-base font-semibold text-foreground sm:text-lg">{title}</h2>
        <p className="mt-0.5 text-xs text-muted sm:text-sm">{description}</p>
      </header>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex min-h-28 min-w-0 flex-col rounded-2xl border border-border/65 bg-white/85 p-3.5 sm:min-h-32 sm:p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft/75 text-accent"><MetricIcon kind={metric.kind} /></span>
            <p className="mt-auto pt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">{metric.value}</p>
            <p className="mt-1 text-xs text-muted">{metric.label}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function AnalyticsDashboard({ initialAnalytics }: { initialAnalytics: FightAnalytics }) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [fromDate, setFromDate] = useState(initialAnalytics.fromDate);
  const [toDateValue, setToDateValue] = useState(initialAnalytics.toDate);
  const [groupBy, setGroupBy] = useState<GroupBy>(() => recommendedGroup(initialAnalytics.fromDate, initialAnalytics.toDate));
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset | undefined>("currentWeek");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const availableGroupOptions = useMemo(() => availableGroups(analytics.fromDate, analytics.toDate), [analytics.fromDate, analytics.toDate]);
  const chartPoints = useMemo(() => aggregatePoints(analytics, groupBy), [analytics, groupBy]);

  async function loadPeriod(nextFromDate: string, nextToDate: string, nextPreset?: PeriodPreset) {
    if (!nextFromDate || !nextToDate || nextFromDate > nextToDate) {
      setError("Укажите корректный период.");
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      const result = await getFightAnalytics(nextFromDate, nextToDate);
      setAnalytics(result);
      setFromDate(result.fromDate);
      setToDateValue(result.toDate);
      setSelectedPreset(nextPreset);
      setGroupBy((currentGroup) => {
        const nextGroups = availableGroups(result.fromDate, result.toDate);
        return nextGroups.includes(currentGroup) ? currentGroup : recommendedGroup(result.fromDate, result.toDate);
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить аналитику.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyPreset(preset: PeriodPreset) {
    const period = presetPeriod(preset);
    void loadPeriod(period.fromDate, period.toDate, preset);
  }

  const periodTitle = `${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(analytics.fromDate))} — ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(analytics.toDate))}`;
  const allTimeMetrics = [
    { label: "Схваток", value: analytics.allTimeFightsCount, kind: "fights" as const },
    { label: "Тренировок", value: analytics.allTimeTrainingsCount, kind: "trainings" as const },
    { label: "Среднее за тренировку", value: formatAverage(analytics.allTimeAverageFightsPerTraining), kind: "average" as const },
    { label: "Сабмишенов", value: analytics.allTimeSubmissionsCount, kind: "submissions" as const },
  ];
  const periodMetrics = [
    { label: "Схваток", value: analytics.periodFightsCount, kind: "fights" as const },
    { label: "Тренировок", value: analytics.periodTrainingsCount, kind: "trainings" as const },
    { label: "Среднее за тренировку", value: formatAverage(analytics.periodAverageFightsPerTraining), kind: "average" as const },
    { label: "Сабмишенов", value: analytics.periodSubmissionsCount, kind: "submissions" as const },
  ];

  return (
    <div className="relative left-1/2 flex w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 flex-col gap-5 sm:w-[calc(100vw-3rem)] sm:gap-6 xl:w-[calc(100vw-4rem)]">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">Аналитика</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">Следите за тренировками, объёмом схваток и выполненными сабмишенами.</p>
        </div>
        <section className="flex w-full min-w-0 flex-col items-stretch gap-3 lg:w-auto lg:items-end" aria-label="Выбор периода аналитики">
          <div className="calendar-shadow w-full rounded-2xl border border-border/80 bg-white/92 p-3 sm:p-4">
            <div className="grid w-full grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:flex sm:items-end sm:gap-2">
              <label className="min-w-0 text-xs font-medium text-muted">
                С
                <input type="date" value={fromDate} max={toDateValue} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10 sm:w-36" />
              </label>
              <label className="min-w-0 text-xs font-medium text-muted">
                По
                <input type="date" value={toDateValue} min={fromDate} onChange={(event) => setToDateValue(event.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10 sm:w-36" />
              </label>
              <button type="button" onClick={() => void loadPeriod(fromDate, toDateValue)} disabled={isLoading} className="h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60 min-[480px]:col-span-2 sm:col-span-1">
                {isLoading ? "Загрузка…" : "Показать"}
              </button>
            </div>
          </div>
          <div className="flex w-full max-w-full flex-col gap-2 pb-1 sm:w-auto sm:flex-row sm:overflow-x-auto" aria-label="Быстрый выбор периода">
            {presets.map((preset) => (
              <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} disabled={isLoading} aria-pressed={selectedPreset === preset.id} className={`min-h-10 w-full shrink-0 rounded-full border px-4 text-xs font-semibold transition disabled:opacity-50 sm:w-auto ${selectedPreset === preset.id ? "border-accent/40 bg-accent-soft text-accent-foreground" : "border-border bg-white text-muted hover:border-accent/35 hover:bg-accent-soft hover:text-accent-foreground"}`}>
                {preset.label}
              </button>
            ))}
          </div>
        </section>
      </header>

      {error && <p className={errorClass}>{error}</p>}

      <section className="grid gap-5 lg:grid-cols-2">
        <AnalyticsSummaryBlock title="За всё время" description="Общая статистика по всем отмеченным тренировкам" metrics={allTimeMetrics} />
        <AnalyticsSummaryBlock title="За выбранный период" description={periodTitle} metrics={periodMetrics} />
      </section>

      <section>
        <article className="calendar-shadow min-w-0 rounded-[1.4rem] border border-border/75 bg-white/94 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Схватки {groupLabels[groupBy].toLowerCase()}</h2>
              <p className="mt-1 text-xs text-muted">{groupDescriptions[groupBy]}</p>
            </div>
            <div className="min-w-0 sm:min-w-44">
              <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="analytics-group-by">Детализация</label>
              <select id="analytics-group-by" value={groupBy} onChange={(event) => setGroupBy(event.target.value as GroupBy)} disabled={availableGroupOptions.length === 1} className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10 disabled:cursor-default disabled:bg-surface-muted disabled:text-muted">
                {availableGroupOptions.map((key) => <option key={key} value={key}>{groupLabels[key]}</option>)}
              </select>
            </div>
          </div>

          <div className={`relative mt-5 h-64 overflow-x-auto pb-2 transition-opacity sm:h-80 ${isLoading ? "opacity-45" : "opacity-100"}`}>
            <FightTrendChart points={chartPoints} />
          </div>
        </article>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-2">
        <article className="calendar-shadow min-w-0 rounded-[1.4rem] border border-border/75 bg-white/94 p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Сабмишены за всё время</h2>
            <p className="mt-1 text-xs text-muted">Распределение всех выполненных приёмов</p>
          </div>
          <div className="mt-5">
            <SubmissionDistributionChart points={analytics.allTimeSubmissionDistribution} />
          </div>
        </article>
        <article className="calendar-shadow min-w-0 rounded-[1.4rem] border border-border/75 bg-white/94 p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Сабмишены за выбранный период</h2>
            <p className="mt-1 text-xs text-muted">Количество выполненных приёмов за выбранный период</p>
          </div>
          <div className="mt-5">
            <SubmissionDistributionChart points={analytics.submissionDistribution} />
          </div>
        </article>
      </section>
    </div>
  );
}
