"use client";

import { useMemo, useRef, useState } from "react";
import { DaySchedulePanel } from "@/components/DaySchedulePanel";
import { useGroups } from "@/components/GroupsProvider";
import { WEEKDAY_LABELS, MONTH_LABELS, getMonthGrid, dateKey, addMonths } from "@/lib/calendar";
import { getGroupColorStyle } from "@/lib/group-colors";
import { getTrainings } from "@/lib/trainings-client";

type TrainingItem = { id: string; title: string; date: string; endDate?: string; groupName?: string; coachName?: string; groupColorName?: string };
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
  showGroupFilter = false,
}: {
  trainings: TrainingItem[];
  linkBase?: string;
  showCreateForm?: boolean;
  showGroupFilter?: boolean;
}) {
  const today = new Date();
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const { groups, status: groupsStatus, error: groupsError } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [visibleTrainings, setVisibleTrainings] = useState(trainings);
  const [trainingsError, setTrainingsError] = useState<string>();
  const latestTrainingRequestRef = useRef(0);

  const parsedTrainings = useMemo(
    () => visibleTrainings.map((training) => ({ ...training, date: new Date(training.date), endDate: training.endDate ? new Date(training.endDate) : undefined })),
    [visibleTrainings]
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

  const selectGroup = async (groupId: string) => {
    const requestId = latestTrainingRequestRef.current + 1;
    latestTrainingRequestRef.current = requestId;
    setSelectedGroupId(groupId);
    setTrainingsError(undefined);

    try {
      const loadedTrainings = await getTrainings(groupId || undefined);
      if (latestTrainingRequestRef.current === requestId) {
        setVisibleTrainings(loadedTrainings);
      }
    } catch (error) {
      if (latestTrainingRequestRef.current === requestId) {
        setTrainingsError(error instanceof Error ? error.message : "Не удалось загрузить тренировки.");
      }
    }
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

              <div className="relative order-1 grid min-w-44 grid-cols-2 justify-self-start rounded-xl bg-surface-muted p-1" aria-label="Вид календаря">
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    calendarView === "week" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setCalendarView("month")}
                  aria-pressed={calendarView === "month"}
                  className={`relative z-10 rounded-lg px-4 py-2 text-sm transition-colors duration-200 ease-out ${
                    calendarView === "month"
                      ? "font-semibold text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Месяц
                </button>
                <button
                  type="button"
                  onClick={showWeek}
                  aria-pressed={calendarView === "week"}
                  className={`relative z-10 rounded-lg px-4 py-2 text-sm transition-colors duration-200 ease-out ${
                    calendarView === "week"
                      ? "font-semibold text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Неделя
                </button>
              </div>
            </div>

            {showGroupFilter && (
              <div role="group" aria-label="Выбор группы" className="flex w-full flex-wrap items-center gap-2.5">
                {groupsStatus === "idle" || groupsStatus === "loading" ? (
                  <span className="rounded-full bg-surface-muted px-4 py-2 text-sm text-muted">Загрузка групп…</span>
                ) : groupsStatus === "error" ? (
                  <span className="rounded-full bg-danger-soft px-4 py-2 text-sm text-danger">{groupsError}</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void selectGroup("")}
                      aria-pressed={selectedGroupId === ""}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ease-out ${
                        selectedGroupId === ""
                          ? "bg-accent text-white shadow-[0_10px_24px_-16px_rgba(131,93,57,0.8)]"
                          : "bg-surface-muted text-muted hover:-translate-y-0.5 hover:bg-accent-soft hover:text-accent-foreground"
                      }`}
                    >
                      Все группы
                    </button>
                    {groups.map((group) => {
                      const selected = selectedGroupId === group.id;
                      const colorStyle = getGroupColorStyle(group.colorName);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => void selectGroup(group.id)}
                          aria-pressed={selected}
                          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ease-out hover:-translate-y-0.5 ${
                            selected
                              ? `${colorStyle.activeBadge} shadow-[0_10px_24px_-16px_rgba(15,23,42,0.45)]`
                              : colorStyle.badge
                          }`}
                        >
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${colorStyle.dot}`}
                            aria-hidden="true"
                          />
                          {group.name}
                        </button>
                      );
                    })}
                  </>
                )}
                {trainingsError && (
                  <span className="self-center text-xs text-danger">{trainingsError}</span>
                )}
              </div>
            )}
          </div>

          <div className="max-w-full overflow-visible pb-1 sm:overflow-x-auto">
            <div className="min-w-0 sm:min-w-[42rem]">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                <div className="grid grid-cols-7 border-b border-border/70 text-center text-[0.68rem] font-medium text-muted sm:text-sm">
                  {WEEKDAY_LABELS.map((day) => (
                    <div key={day} className="border-r border-border/70 py-2 last:border-r-0 sm:py-3">{day}</div>
                  ))}
                </div>

                {calendarView === "month" ? (
                  <div className="flex flex-col gap-px bg-border/60">
                  {monthWeeks.map((week) => (
                      <div key={dateKey(week[0].date)} className="grid grid-cols-7 gap-px">
                        {week.map((cell) => {
                          const key = dateKey(cell.date);
                          const dayTrainings = trainingsByDay.get(key) ?? [];
                          const isSelected = key === selectedDay;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => selectDay(key)}
                              aria-pressed={isSelected}
                              className={`group relative flex min-h-16 flex-col items-center px-1 py-2 text-center transition duration-200 ease-out sm:min-h-24 sm:px-1.5 sm:py-3 lg:min-h-32 xl:min-h-36 ${
                                isSelected
                                  ? "z-[1] bg-accent-soft ring-2 ring-inset ring-accent/45"
                                  : "bg-white hover:bg-accent-soft/65"
                              } ${cell.inMonth ? "" : "text-muted/45"}`}
                            >
                              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition duration-200 sm:h-8 sm:w-8 sm:text-sm ${
                                cell.isToday
                                  ? "bg-accent text-white shadow-[0_8px_20px_-8px_rgba(131,93,57,0.78)]"
                                  : "text-foreground group-hover:bg-white"
                              }`}>
                                {cell.date.getDate()}
                              </span>

                              {dayTrainings.length > 0 && (
                                <span className="absolute inset-x-1 bottom-2 grid grid-cols-4 justify-center justify-items-center gap-x-1.5 gap-y-1 px-2 sm:inset-x-2 sm:bottom-auto sm:top-1/2 sm:flex sm:-translate-y-1/2 sm:flex-nowrap sm:gap-2 sm:px-0" aria-label={`Тренировок: ${dayTrainings.length}`}>
                                  {dayTrainings.slice(0, 8).map((training) => (
                                    <span
                                      key={training.id}
                                      className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm sm:h-3.5 sm:w-3.5 ${getGroupColorStyle(training.groupColorName ?? "Brown").dot}`}
                                      aria-hidden="true"
                                    />
                                  ))}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                  ))}
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
                        className={`group relative flex min-h-24 flex-col items-center px-1 py-2.5 text-center transition duration-200 ease-out sm:min-h-72 sm:px-2 sm:py-4 ${
                          isSelected
                            ? "z-[1] bg-accent-soft ring-2 ring-inset ring-accent/45"
                            : "bg-white hover:bg-accent-soft/65"
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold sm:h-9 sm:w-9 sm:text-sm ${
                          isToday ? "bg-accent text-white" : "text-foreground group-hover:bg-white"
                        }`}>
                          {day.getDate()}
                        </span>
                        {dayTrainings.length > 0 && (
                          <span className="absolute inset-x-1 bottom-2 grid grid-cols-4 justify-center justify-items-center gap-x-1.5 gap-y-1 px-2 sm:inset-x-2 sm:bottom-auto sm:top-1/2 sm:flex sm:-translate-y-1/2 sm:flex-nowrap sm:gap-2 sm:px-0" aria-label={`Тренировок: ${dayTrainings.length}`}>
                            {dayTrainings.slice(0, 8).map((training) => (
                              <span
                                key={training.id}
                                className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm sm:h-3.5 sm:w-3.5 ${getGroupColorStyle(training.groupColorName ?? "Brown").dot}`}
                                aria-hidden="true"
                              />
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
            onTrainingDeleted={(trainingId) => {
              setVisibleTrainings((current) => current.filter((training) => training.id !== trainingId));
            }}
            linkBase={linkBase}
            showCreateForm={showCreateForm}
          />
        )}
      </div>
    </section>
  );
}
