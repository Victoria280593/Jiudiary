"use client";

import { useMemo, useState } from "react";
import { DayScheduleModal } from "@/components/DayScheduleModal";
import { WEEKDAY_LABELS, MONTH_LABELS, getMonthGrid, dateKey, addMonths } from "@/lib/calendar";

type TrainingItem = { id: string; title: string; date: string; coachName?: string };
type CalendarView = "month" | "week";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

function weekTitle(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const monthInDate = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" })
      .formatToParts(date)
      .find((part) => part.type === "month")?.value ?? "";
  const startMonth = monthInDate(weekStart);
  const endMonth = monthInDate(weekEnd);

  if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
    return `${weekStart.getDate()} ${startMonth} ${weekStart.getFullYear()} — ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
  }
  if (weekStart.getMonth() !== weekEnd.getMonth()) {
    return `${weekStart.getDate()} ${startMonth} — ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
  }
  return `${weekStart.getDate()}–${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
}

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
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const parsedTrainings = useMemo(
    () => trainings.map((training) => ({ ...training, date: new Date(training.date) })),
    [trainings]
  );

  const trainingsByDay = useMemo(() => {
    const map = new Map<string, typeof parsedTrainings>();
    for (const training of parsedTrainings) {
      const key = dateKey(training.date);
      map.set(key, [...(map.get(key) ?? []), training]);
    }
    return map;
  }, [parsedTrainings]);

  const monthWeeks = getMonthGrid(viewYear, viewMonth);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const goRelative = (delta: number) => {
    if (calendarView === "week") {
      setWeekStart((current) => addDays(current, delta * 7));
      return;
    }

    const next = addMonths(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
    setWeekStart(startOfWeek(today));
  };

  const showWeek = () => {
    const displayedMonthIsCurrent =
      viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1;
    const referenceDate = displayedMonthIsCurrent
      ? today
      : new Date(viewYear, viewMonth - 1, 1);

    setWeekStart(startOfWeek(referenceDate));
    setCalendarView("week");
  };

  const title =
    calendarView === "month"
      ? `${MONTH_LABELS[viewMonth - 1]} ${viewYear}`
      : weekTitle(weekStart);

  return (
    <section id="calendar" className="calendar-shadow overflow-hidden rounded-[1.85rem] border border-white bg-white/92 p-3 sm:p-5 lg:p-6">
      <div className="mb-5 grid items-center gap-4 px-1 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goRelative(-1)}
            aria-label={calendarView === "month" ? "Предыдущий месяц" : "Предыдущая неделя"}
            className="calendar-control"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => goRelative(1)}
            aria-label={calendarView === "month" ? "Следующий месяц" : "Следующая неделя"}
            className="calendar-control"
          >
            <ArrowIcon direction="right" />
          </button>
          <button type="button" onClick={goToday} className="ml-1 min-h-11 rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground transition hover:border-accent/35 hover:bg-accent-soft">
            Сегодня
          </button>
        </div>

        <h2 className="text-left text-lg font-semibold capitalize tracking-[-0.025em] text-foreground sm:text-center sm:text-xl">
          {title}
        </h2>

        <div className="flex w-fit justify-self-start rounded-xl bg-surface-muted p-1 sm:justify-self-end" aria-label="Вид календаря">
          <button
            type="button"
            onClick={() => setCalendarView("month")}
            aria-pressed={calendarView === "month"}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              calendarView === "month"
                ? "bg-white font-semibold text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Месяц
          </button>
          <button
            type="button"
            onClick={showWeek}
            aria-pressed={calendarView === "week"}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              calendarView === "week"
                ? "bg-white font-semibold text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Неделя
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[650px]">
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted sm:text-sm">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="py-3">{day}</div>
            ))}
          </div>

          {calendarView === "month" ? (
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-border bg-border/70">
              {monthWeeks.flat().map((cell) => {
                const key = dateKey(cell.date);
                const dayTrainings = trainingsByDay.get(key) ?? [];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className={`group flex min-h-24 flex-col items-center bg-white px-1.5 py-3 text-center transition-colors hover:bg-accent-soft/65 lg:min-h-32 xl:min-h-36 ${
                      cell.inMonth ? "" : "text-muted/45"
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                      cell.isToday
                        ? "bg-accent text-white shadow-[0_8px_20px_-8px_rgba(131,93,57,0.78)]"
                        : "text-foreground group-hover:bg-white"
                    }`}>
                      {cell.date.getDate()}
                    </span>

                    {dayTrainings.length > 0 && (
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    )}
                    <span className="mt-1 w-full space-y-1">
                      {dayTrainings.slice(0, 2).map((training) => (
                        <span key={training.id} className="block w-full truncate rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                          {training.title}
                        </span>
                      ))}
                      {dayTrainings.length > 2 && (
                        <span className="block text-[10px] text-muted">+{dayTrainings.length - 2} ещё</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-border bg-border/70">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const dayTrainings = trainingsByDay.get(key) ?? [];
                const isToday = key === dateKey(today);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className="group flex min-h-72 flex-col items-center bg-white px-2 py-4 text-center transition-colors hover:bg-accent-soft/65"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday ? "bg-accent text-white" : "text-foreground group-hover:bg-white"
                    }`}>
                      {day.getDate()}
                    </span>
                    <span className="mt-4 w-full space-y-2">
                      {dayTrainings.map((training) => (
                        <span key={training.id} className="block w-full rounded-lg bg-accent-soft px-2 py-2 text-left text-xs font-medium text-accent-foreground">
                          {training.date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          <span className="mt-0.5 block truncate">{training.title}</span>
                        </span>
                      ))}
                      {dayTrainings.length === 0 && (
                        <span className="block pt-3 text-xs text-muted/55">Нет тренировок</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
    </section>
  );
}
