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

type GroupBy = "day" | "week" | "month";

const groupLabels: Record<GroupBy, string> = {
  day: "По дням",
  week: "По неделям",
  month: "По месяцам",
};

const presets = [
  { label: "7 дней", days: 7 },
  { label: "30 дней", days: 30 },
  { label: "3 месяца", days: 90 },
  { label: "Год", days: 365 },
];

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

function recommendedGroup(fromDate: string, toDateValue: string): GroupBy {
  const days = Math.round((toDate(toDateValue).getTime() - toDate(fromDate).getTime()) / 86_400_000) + 1;
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

function chartLabel(date: Date, groupBy: GroupBy) {
  if (groupBy === "month") {
    return new Intl.DateTimeFormat("ru-RU", { month: "short", year: "2-digit" }).format(date);
  }
  if (groupBy === "week") {
    return `с ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date)}`;
  }
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date);
}

function aggregatePoints(analytics: FightAnalytics, groupBy: GroupBy): FightChartPoint[] {
  const fightsByDate = new Map(analytics.points.map((point) => [point.date, point.fightsCount]));
  const dailyPoints: FightAnalyticsPoint[] = [];
  for (let date = toDate(analytics.fromDate); date <= toDate(analytics.toDate); date = addDays(date, 1)) {
    const dateKey = toIsoDate(date);
    dailyPoints.push({ date: dateKey, fightsCount: fightsByDate.get(dateKey) ?? 0 });
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

  return [...groups.values()].map((point) => ({
    label: chartLabel(point.date, groupBy),
    fightsCount: point.fightsCount,
  }));
}

function FightsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 15.5 10ZM3 19v-1.5A4.5 4.5 0 0 1 7.5 13h2a4.5 4.5 0 0 1 4.5 4.5V19m0-5.5h1.5a4 4 0 0 1 4 4V19" />
    </svg>
  );
}

export function AnalyticsDashboard({ initialAnalytics }: { initialAnalytics: FightAnalytics }) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [fromDate, setFromDate] = useState(initialAnalytics.fromDate);
  const [toDateValue, setToDateValue] = useState(initialAnalytics.toDate);
  const [groupBy, setGroupBy] = useState<GroupBy>(() => recommendedGroup(initialAnalytics.fromDate, initialAnalytics.toDate));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const chartPoints = useMemo(() => aggregatePoints(analytics, groupBy), [analytics, groupBy]);

  async function loadPeriod(nextFromDate: string, nextToDate: string) {
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
      setGroupBy(recommendedGroup(result.fromDate, result.toDate));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить аналитику схваток.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyPreset(days: number) {
    const end = new Date();
    const start = addDays(end, -(days - 1));
    void loadPeriod(toIsoDate(start), toIsoDate(end));
  }

  const periodTitle = `${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(analytics.fromDate))} — ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(analytics.toDate))}`;

  return (
    <div className="relative left-1/2 flex w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 flex-col gap-5 sm:w-[calc(100vw-3rem)] sm:gap-6 xl:w-[calc(100vw-4rem)]">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">Аналитика</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">Следите за объёмом схваток и динамикой тренировочного процесса.</p>
        </div>

        <div className="calendar-shadow rounded-2xl border border-border/80 bg-white/92 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
            <label className="min-w-0 text-xs font-medium text-muted">
              С
              <input type="date" value={fromDate} max={toDateValue} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10 sm:w-36" />
            </label>
            <label className="min-w-0 text-xs font-medium text-muted">
              По
              <input type="date" value={toDateValue} min={fromDate} onChange={(event) => setToDateValue(event.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10 sm:w-36" />
            </label>
            <button type="button" onClick={() => void loadPeriod(fromDate, toDateValue)} disabled={isLoading} className="col-span-2 h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60 sm:col-span-1">
              {isLoading ? "Загрузка…" : "Показать"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Быстрый выбор периода">
        {presets.map((preset) => (
          <button key={preset.days} type="button" onClick={() => applyPreset(preset.days)} disabled={isLoading} className="min-h-9 shrink-0 rounded-full border border-border bg-white px-4 text-xs font-semibold text-muted transition hover:border-accent/35 hover:bg-accent-soft hover:text-accent-foreground disabled:opacity-50">
            {preset.label}
          </button>
        ))}
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <div className="border-b border-border/80">
        <span className="inline-flex min-h-10 items-center border-b-2 border-accent px-1 text-sm font-semibold text-accent-foreground">Схватки</span>
      </div>

      <section className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-stretch">
        <article className="card-shadow rounded-[1.4rem] border border-border/75 bg-white/94 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><FightsIcon /></span>
            <div>
              <p className="text-sm font-medium text-muted">Количество схваток</p>
              <p className="mt-0.5 text-xs text-muted/80">за выбранный период</p>
            </div>
          </div>
          <p className="mt-7 text-5xl font-semibold tracking-[-0.05em] text-foreground">{analytics.fightsCount}</p>
          <p className="mt-3 text-xs leading-5 text-muted">{periodTitle}</p>
        </article>

        <article className="calendar-shadow min-w-0 rounded-[1.4rem] border border-border/75 bg-white/94 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Схватки по периодам</h2>
              <p className="mt-1 text-xs text-muted">Динамика количества отмеченных раундов</p>
            </div>
            <label className="sr-only" htmlFor="analytics-group-by">Группировка графика</label>
            <select id="analytics-group-by" value={groupBy} onChange={(event) => setGroupBy(event.target.value as GroupBy)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10">
              {(Object.keys(groupLabels) as GroupBy[]).map((key) => <option key={key} value={key}>{groupLabels[key]}</option>)}
            </select>
          </div>

          <div className={`relative mt-5 h-64 transition-opacity sm:h-80 ${isLoading ? "opacity-45" : "opacity-100"}`}>
            <FightTrendChart points={chartPoints} />
          </div>
        </article>
      </section>
    </div>
  );
}
