"use client";

import { useEffect, useMemo, useState } from "react";
import { DaySchedulePanel } from "@/components/DaySchedulePanel";
import { WEEKDAY_LABELS, MONTH_LABELS, getMonthGrid, dateKey, addMonths } from "@/lib/calendar";
import { getBranches, type Branch } from "@/lib/branches-client";

type TrainingItem = { id: string; title: string; date: string; coachName?: string };
type CalendarView = "month" | "week";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V8l8-4 8 4v12M8 20v-5h8v5M8 10h.01M12 10h.01M16 10h.01" />
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
  const monthName = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(date);
  const startMonth = monthName(weekStart);
  const endMonth = monthName(weekEnd);

  if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
    return `${startMonth} ${weekStart.getFullYear()} – ${endMonth} ${weekEnd.getFullYear()}`;
  }

  if (weekStart.getMonth() !== weekEnd.getMonth()) {
    return `${startMonth}–${endMonth} ${weekEnd.getFullYear()}`;
  }

  return `${endMonth} ${weekEnd.getFullYear()}`;
}

export function TrainingCalendar({
  trainings,
  linkBase = "/dashboard/coach/trainings",
  showCreateForm = true,
  showBranchFilter = false,
}: {
  trainings: TrainingItem[];
  linkBase?: string;
  showCreateForm?: boolean;
  showBranchFilter?: boolean;
}) {
  const today = new Date();
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchLoadState, setBranchLoadState] = useState<"idle" | "loading" | "error">(
    showBranchFilter ? "loading" : "idle"
  );

  useEffect(() => {
    if (!showBranchFilter) return;

    let cancelled = false;

    void getBranches()
      .then((loadedBranches) => {
        if (cancelled) return;
        setBranches(loadedBranches);
        setBranchLoadState("idle");
      })
      .catch(() => {
        if (!cancelled) setBranchLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [showBranchFilter]);

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

  const selectDay = (key: string) => {
    setSelectedDay(key);
    setIsDayPanelOpen(true);
  };

  return (
    <section id="calendar" className="w-full min-w-0">
      <div
        className={`grid min-w-0 items-start gap-6 transition-[grid-template-columns] duration-200 ease-out ${
          isDayPanelOpen && selectedDay
            ? "min-[1000px]:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]"
            : "grid-cols-1"
        }`}
      >
        <div className="calendar-shadow min-w-0 overflow-hidden rounded-[1.85rem] border border-border/80 bg-white/92 p-3 sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-5 px-1">
            <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="order-3 flex flex-wrap items-center gap-2 md:justify-self-end">
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
                <button
                  type="button"
                  onClick={goToday}
                  className="ml-1 min-h-11 rounded-[0.8rem] border border-border bg-white px-4 text-sm font-medium text-foreground transition duration-200 ease-out hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                >
                  Сегодня
                </button>
              </div>

              <h2 className="order-first text-left text-lg font-semibold capitalize tracking-[-0.025em] text-foreground md:order-2 md:text-center md:text-xl">
                {title}
              </h2>

              <div className="order-1 flex w-fit justify-self-start rounded-xl bg-surface-muted p-1" aria-label="Вид календаря">
                <button
                  type="button"
                  onClick={() => setCalendarView("month")}
                  aria-pressed={calendarView === "month"}
                  className={`rounded-lg px-4 py-2 text-sm transition duration-200 ease-out ${
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
                  className={`rounded-lg px-4 py-2 text-sm transition duration-200 ease-out ${
                    calendarView === "week"
                      ? "bg-white font-semibold text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Неделя
                </button>
              </div>
            </div>

            {showBranchFilter && (
              <div role="group" aria-label="Выбор группы" className="flex w-full flex-wrap items-center gap-2.5">
                {branchLoadState === "loading" ? (
                  <span className="rounded-full bg-surface-muted px-4 py-2 text-sm text-muted">Загрузка групп…</span>
                ) : branchLoadState === "error" ? (
                  <span className="rounded-full bg-danger-soft px-4 py-2 text-sm text-danger">Не удалось загрузить группы</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedBranchId("")}
                      aria-pressed={selectedBranchId === ""}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ease-out ${
                        selectedBranchId === ""
                          ? "bg-accent text-white shadow-[0_10px_24px_-16px_rgba(131,93,57,0.8)]"
                          : "bg-surface-muted text-muted hover:-translate-y-0.5 hover:bg-accent-soft hover:text-accent-foreground"
                      }`}
                    >
                      <BranchIcon />
                      Все группы
                    </button>
                    {branches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => setSelectedBranchId(branch.id)}
                        aria-pressed={selectedBranchId === branch.id}
                        className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ease-out ${
                          selectedBranchId === branch.id
                            ? "bg-accent text-white shadow-[0_10px_24px_-16px_rgba(131,93,57,0.8)]"
                            : "bg-surface-muted text-muted hover:-translate-y-0.5 hover:bg-accent-soft hover:text-accent-foreground"
                        }`}
                      >
                        <BranchIcon />
                        {branch.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="max-w-full overflow-x-auto pb-1">
            <div className="min-w-[42rem]">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                <div className="grid grid-cols-7 border-b border-border/70 text-center text-xs font-medium text-muted sm:text-sm">
                  {WEEKDAY_LABELS.map((day) => (
                    <div key={day} className="py-3">{day}</div>
                  ))}
                </div>

                {calendarView === "month" ? (
                  <div className="grid grid-cols-7 gap-px bg-border/60">
                  {monthWeeks.flat().map((cell) => {
                    const key = dateKey(cell.date);
                    const dayTrainings = trainingsByDay.get(key) ?? [];
                    const isSelected = key === selectedDay;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectDay(key)}
                        aria-pressed={isSelected}
                        className={`group relative flex min-h-24 flex-col items-center px-1.5 py-3 text-center transition duration-200 ease-out lg:min-h-32 xl:min-h-36 ${
                          isSelected
                            ? "z-[1] bg-accent-soft ring-2 ring-inset ring-accent/45"
                            : "bg-white hover:bg-accent-soft/65"
                        } ${cell.inMonth ? "" : "text-muted/45"}`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition duration-200 ${
                          cell.isToday
                            ? "bg-accent text-white shadow-[0_8px_20px_-8px_rgba(131,93,57,0.78)]"
                            : "text-foreground group-hover:bg-white"
                        }`}>
                          {cell.date.getDate()}
                        </span>

                        {dayTrainings.length > 0 && (
                          <span className="mt-3 flex max-w-full flex-wrap justify-center gap-1.5" aria-label={`Тренировок: ${dayTrainings.length}`}>
                            {dayTrainings.map((training) => (
                              <span key={training.id} className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px bg-border/60">
                  {weekDays.map((day) => {
                    const key = dateKey(day);
                    const dayTrainings = trainingsByDay.get(key) ?? [];
                    const isToday = key === dateKey(today);
                    const isSelected = key === selectedDay;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectDay(key)}
                        aria-pressed={isSelected}
                        className={`group relative flex min-h-72 flex-col items-center px-2 py-4 text-center transition duration-200 ease-out ${
                          isSelected
                            ? "z-[1] bg-accent-soft ring-2 ring-inset ring-accent/45"
                            : "bg-white hover:bg-accent-soft/65"
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday ? "bg-accent text-white" : "text-foreground group-hover:bg-white"
                        }`}>
                          {day.getDate()}
                        </span>
                        {dayTrainings.length > 0 && (
                          <span className="mt-4 flex max-w-full flex-wrap justify-center gap-2" aria-label={`Тренировок: ${dayTrainings.length}`}>
                            {dayTrainings.map((training) => (
                              <span key={training.id} className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedDay && isDayPanelOpen && (
          <DaySchedulePanel
            key={selectedDay}
            dateKey={selectedDay}
            trainings={trainingsByDay.get(selectedDay) ?? []}
            onClose={() => setIsDayPanelOpen(false)}
            linkBase={linkBase}
            showCreateForm={showCreateForm}
          />
        )}
      </div>
    </section>
  );
}
