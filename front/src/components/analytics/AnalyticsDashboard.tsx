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

function chartLabel(date: Date, groupBy: GroupBy) {
  if (groupBy === "month") {
    return new Intl.DateTimeFormat("ru-RU", { month: "short", year: "2-digit" }).format(date);
  }
  if (groupBy === "week") {
    return `с ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date)}`;
  }
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
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
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить аналитику схваток.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyPreset(preset: PeriodPreset) {
    const period = presetPeriod(preset);
    void loadPeriod(period.fromDate, period.toDate, preset);
  }

  const periodTitle = `${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(analytics.fromDate))} — ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(analytics.toDate))}`;
  const summaryCards = [
    { label: "Всего схваток", description: "за всё время", value: analytics.allTimeFightsCount },
    { label: "Среднее за тренировку", description: "за всё время", value: formatAverage(analytics.allTimeAverageFightsPerTraining) },
    { label: "Схватки за период", description: periodTitle, value: analytics.periodFightsCount },
    { label: "Среднее за тренировку", description: "за выбранный период", value: formatAverage(analytics.periodAverageFightsPerTraining) },
  ];

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
          <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} disabled={isLoading} aria-pressed={selectedPreset === preset.id} className={`min-h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition disabled:opacity-50 ${selectedPreset === preset.id ? "border-accent/40 bg-accent-soft text-accent-foreground" : "border-border bg-white text-muted hover:border-accent/35 hover:bg-accent-soft hover:text-accent-foreground"}`}>
            {preset.label}
          </button>
        ))}
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <div className="border-b border-border/80">
        <span className="inline-flex min-h-10 items-center border-b-2 border-accent px-1 text-sm font-semibold text-accent-foreground">Схватки</span>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {summaryCards.map((card, index) => (
          <article key={`${card.label}-${card.description}`} className="card-shadow flex min-h-44 min-w-0 flex-col rounded-[1.4rem] border border-border/75 bg-white/94 p-4 sm:min-h-48 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><FightsIcon /></span>
              <div className="min-w-0">
                <p className="text-base font-semibold leading-5 text-foreground">{card.label}</p>
                <p className="mt-0.5 text-xs leading-4 text-muted/80">
                  {index === 2 ? <><span className="sm:hidden">за выбранный период</span><span className="hidden sm:inline">{card.description}</span></> : card.description}
                </p>
              </div>
            </div>
            <p className="mt-auto pt-6 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">{card.value}</p>
          </article>
        ))}
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

          <div className={`relative mt-5 h-64 transition-opacity sm:h-80 ${isLoading ? "opacity-45" : "opacity-100"}`}>
            <FightTrendChart points={chartPoints} />
          </div>
        </article>
      </section>
    </div>
  );
}
