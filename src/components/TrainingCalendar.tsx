"use client";

import { useMemo, useState } from "react";
import { WEEKDAY_LABELS, MONTH_LABELS, getMonthGrid, dateKey, addMonths } from "@/lib/calendar";
import { DayScheduleModal } from "@/components/DayScheduleModal";

type TrainingItem = { id: string; title: string; date: string; coachName?: string };

export function TrainingCalendar({
  trainings,
  linkBase = "/dashboard/coach/trainings",
  showCreateForm = true,
}: {
  trainings: TrainingItem[];
  linkBase?: string;
  showCreateForm?: boolean;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const parsedTrainings = useMemo(
    () => trainings.map((t) => ({ ...t, date: new Date(t.date) })),
    [trainings]
  );

  const trainingsByDay = useMemo(() => {
    const map = new Map<string, typeof parsedTrainings>();
    for (const t of parsedTrainings) {
      const key = dateKey(t.date);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [parsedTrainings]);

  const weeks = getMonthGrid(viewYear, viewMonth);
  const yearOptions = Array.from({ length: 7 }, (_, i) => today.getFullYear() - 1 + i);

  const goToMonth = (y: number, m: number) => {
    setViewYear(y);
    setViewMonth(m);
  };

  const goRelative = (delta: number) => {
    const next = addMonths(viewYear, viewMonth, delta);
    goToMonth(next.year, next.month);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goRelative(-1)}
            aria-label="Предыдущий месяц"
            className="rounded-md px-2 py-1 text-muted hover:bg-surface-muted"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goRelative(1)}
            aria-label="Следующий месяц"
            className="rounded-md px-2 py-1 text-muted hover:bg-surface-muted"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => goToMonth(today.getFullYear(), today.getMonth() + 1)}
            className="ml-1 rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface-muted"
          >
            Сегодня
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={viewMonth}
            onChange={(e) => goToMonth(viewYear, Number(e.target.value))}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {MONTH_LABELS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={(e) => goToMonth(Number(e.target.value), viewMonth)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell) => {
          const key = dateKey(cell.date);
          const dayTrainings = trainingsByDay.get(key) ?? [];

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(key)}
              className={`flex min-h-16 flex-col items-start gap-0.5 rounded-md border border-border p-1 text-left text-xs transition-colors hover:bg-surface-muted ${
                cell.inMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={
                  cell.isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[13px] text-accent-foreground"
                    : "text-[13px] text-foreground"
                }
              >
                {cell.date.getDate()}
              </span>
              {dayTrainings.slice(0, 2).map((t) => (
                <span
                  key={t.id}
                  className="w-full truncate rounded bg-accent/25 px-1 text-[10px] text-accent-foreground"
                >
                  {t.title}
                </span>
              ))}
              {dayTrainings.length > 2 && (
                <span className="text-[10px] text-muted">+{dayTrainings.length - 2} ещё</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <DayScheduleModal
          dateKey={selectedDay}
          trainings={trainingsByDay.get(selectedDay) ?? []}
          onClose={() => setSelectedDay(null)}
          linkBase={linkBase}
          showCreateForm={showCreateForm}
        />
      )}
    </div>
  );
}
