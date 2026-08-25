"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DaySchedulePanel } from "@/components/DaySchedulePanel";
import { useGroups } from "@/components/GroupsProvider";
import { WEEKDAY_LABELS, MONTH_LABELS, getMonthGrid, dateKey, addMonths } from "@/lib/calendar";
import { getGroupColorStyle } from "@/lib/group-colors";
import {
  type ClientTraining,
  getClientTrainings,
} from "@/lib/client-trainings-client";
import { getTrainings } from "@/lib/trainings-client";

type TrainingItem = { id: string; groupId?: string; title: string; date: string; endDate?: string; groupName?: string; coachName?: string; groupColorName?: string };
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
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [visibleTrainings, setVisibleTrainings] = useState(trainings);
  const [trainingsError, setTrainingsError] = useState<string>();
  const latestTrainingRequestRef = useRef(0);
  const [clientTrainingsByMonth, setClientTrainingsByMonth] = useState<
    Record<string, Record<string, ClientTraining>>
  >({});
  const [loadingClientTrainingMonths, setLoadingClientTrainingMonths] = useState<string[]>([]);
  const [clientTrainingErrors, setClientTrainingErrors] = useState<Record<string, string>>({});
  const requestedClientTrainingMonthsRef = useRef(new Set<string>());

  const selectedMonthKey = selectedDay?.slice(0, 7);

  useEffect(() => {
    if (!isDayPanelOpen || !selectedMonthKey) return;
    if (requestedClientTrainingMonthsRef.current.has(selectedMonthKey)) return;

    requestedClientTrainingMonthsRef.current.add(selectedMonthKey);
    setLoadingClientTrainingMonths((current) => [...current, selectedMonthKey]);
    setClientTrainingErrors((current) => {
      const next = { ...current };
      delete next[selectedMonthKey];
      return next;
    });

    const [year, month] = selectedMonthKey.split("-").map(Number);
    void getClientTrainings(year, month)
      .then((clientTrainings) => {
        setClientTrainingsByMonth((current) => ({
          ...current,
          [selectedMonthKey]: Object.fromEntries(
            clientTrainings.map((clientTraining) => [clientTraining.trainingId, clientTraining])
          ),
        }));
      })
      .catch((error) => {
        requestedClientTrainingMonthsRef.current.delete(selectedMonthKey);
        setClientTrainingErrors((current) => ({
          ...current,
          [selectedMonthKey]: error instanceof Error
            ? error.message
            : "Не удалось загрузить отметки о тренировках.",
        }));
      })
      .finally(() => {
        setLoadingClientTrainingMonths((current) => current.filter((key) => key !== selectedMonthKey));
      });
  }, [isDayPanelOpen, selectedMonthKey]);

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

  const showRelativeDay = (key: string) => {
    const nextDate = new Date(`${key}T00:00:00`);
    setSelectedDay(key);
    setViewYear(nextDate.getFullYear());
    setViewMonth(nextDate.getMonth() + 1);
    if (calendarView === "week") setWeekStart(startOfWeek(nextDate));
  };

  const saveVisibleTraining = (
    training: {
      id: string;
      groupId: string;
      groupName: string;
      groupColorName: string;
      description: string | null;
      startTime: string;
      endTime: string;
    },
    repeatEveryWeek?: boolean
  ) => {
    if (repeatEveryWeek) {
      void selectGroups(selectedGroupIds);
      return;
    }

    const nextTraining: TrainingItem = {
      id: training.id,
      groupId: training.groupId,
      title: training.description ?? "",
      date: training.startTime,
      endDate: training.endTime,
      groupName: training.groupName,
      groupColorName: training.groupColorName,
    };

    setVisibleTrainings((current) => {
      const exists = current.some((item) => item.id === training.id);
      return exists
        ? current.map((item) => item.id === training.id ? nextTraining : item)
        : [...current, nextTraining];
    });
  };

  const selectGroups = async (groupIds: string[]) => {
    const requestId = latestTrainingRequestRef.current + 1;
    latestTrainingRequestRef.current = requestId;
    setSelectedGroupIds(groupIds);
    setTrainingsError(undefined);

    try {
      const loadedTrainings = await getTrainings(groupIds);
      if (latestTrainingRequestRef.current === requestId) {
        setVisibleTrainings(loadedTrainings);
      }
    } catch (error) {
      if (latestTrainingRequestRef.current === requestId) {
        setTrainingsError(error instanceof Error ? error.message : "Не удалось загрузить тренировки.");
      }
    }
  };

  const toggleGroup = (groupId: string) => {
    const nextGroupIds = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((selectedGroupId) => selectedGroupId !== groupId)
      : [...selectedGroupIds, groupId];

    void selectGroups(nextGroupIds);
  };

  return (
    <section id="calendar" className="w-full min-w-0">
      <div className="grid min-w-0 grid-cols-1 items-start gap-6">
        <div className="calendar-shadow min-w-0 overflow-hidden rounded-[1.85rem] border border-border/80 bg-white/92 px-1.5 py-3 sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-5 px-1">
            <div className="flex flex-col gap-4">
              <h2 className="text-left text-lg font-semibold capitalize tracking-[-0.025em] text-foreground md:text-xl">
                {title}
              </h2>

              <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
                <div className="flex min-w-0 items-center gap-1 sm:gap-2">
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
                    className="min-h-10 rounded-[0.8rem] border border-border bg-white px-2 text-xs font-medium text-foreground transition duration-200 ease-out hover:border-accent/40 hover:bg-accent-soft hover:text-accent sm:ml-1 sm:min-h-11 sm:px-4 sm:text-sm"
                  >
                    Сегодня
                  </button>
                </div>

                <div className="relative grid w-[7.75rem] shrink-0 grid-cols-2 rounded-xl border border-border/70 bg-surface-muted p-1 shadow-sm min-[360px]:w-[8.75rem] sm:w-auto sm:min-w-44" aria-label="Вид календаря">
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
                    className={`relative z-10 rounded-lg px-2 py-2 text-xs transition-colors duration-200 ease-out sm:px-4 sm:text-sm ${
                      calendarView === "month"
                        ? "font-semibold text-foreground"
                        : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
                    }`}
                  >
                    Месяц
                  </button>
                  <button
                    type="button"
                    onClick={showWeek}
                    aria-pressed={calendarView === "week"}
                    className={`relative z-10 rounded-lg px-2 py-2 text-xs transition-colors duration-200 ease-out sm:px-4 sm:text-sm ${
                      calendarView === "week"
                        ? "font-semibold text-foreground"
                        : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
                    }`}
                  >
                    Неделя
                  </button>
                </div>
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
                      onClick={() => void selectGroups([])}
                      aria-pressed={selectedGroupIds.length === 0}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ease-out ${
                        selectedGroupIds.length === 0
                          ? "bg-accent text-white shadow-[0_10px_24px_-16px_rgba(131,93,57,0.8)]"
                          : "bg-surface-muted text-muted hover:-translate-y-0.5 hover:bg-accent-soft hover:text-accent-foreground"
                      }`}
                    >
                      Все группы
                    </button>
                    {groups.map((group) => {
                      const selected = selectedGroupIds.includes(group.id);
                      const colorStyle = getGroupColorStyle(group.colorName);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => toggleGroup(group.id)}
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
                                <span className="absolute inset-x-1 bottom-2 mx-auto flex max-w-[3.9rem] flex-wrap justify-center gap-x-1.5 gap-y-1 sm:inset-x-2 sm:bottom-auto sm:top-1/2 sm:max-w-none sm:-translate-y-1/2 sm:flex-nowrap sm:gap-2" aria-label={`Тренировок: ${dayTrainings.length}`}>
                                  {dayTrainings.length > 6 ? (
                                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-xs font-semibold text-white shadow-sm sm:h-7 sm:min-w-7">
                                      {dayTrainings.length}
                                    </span>
                                  ) : (
                                    dayTrainings.map((training) => (
                                      <span
                                        key={training.id}
                                        className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm sm:h-3.5 sm:w-3.5 ${getGroupColorStyle(training.groupColorName ?? "Brown").dot}`}
                                        aria-hidden="true"
                                      />
                                    ))
                                  )}
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
                          <span className="absolute inset-x-1 bottom-2 mx-auto flex max-w-[3.9rem] flex-wrap justify-center gap-x-1.5 gap-y-1 sm:inset-x-2 sm:bottom-auto sm:top-1/2 sm:max-w-none sm:-translate-y-1/2 sm:flex-nowrap sm:gap-2" aria-label={`Тренировок: ${dayTrainings.length}`}>
                            {dayTrainings.length > 6 ? (
                              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-xs font-semibold text-white shadow-sm sm:h-7 sm:min-w-7">
                                {dayTrainings.length}
                              </span>
                            ) : (
                              dayTrainings.map((training) => (
                                <span
                                  key={training.id}
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm sm:h-3.5 sm:w-3.5 ${getGroupColorStyle(training.groupColorName ?? "Brown").dot}`}
                                  aria-hidden="true"
                                />
                              ))
                            )}
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
            dateKey={selectedDay}
            trainings={trainingsByDay.get(selectedDay) ?? []}
            clientTrainings={selectedMonthKey ? clientTrainingsByMonth[selectedMonthKey] ?? {} : {}}
            clientTrainingsLoading={Boolean(selectedMonthKey && loadingClientTrainingMonths.includes(selectedMonthKey))}
            clientTrainingsError={selectedMonthKey ? clientTrainingErrors[selectedMonthKey] : undefined}
            onClientTrainingSaved={(clientTraining) => {
              if (!selectedMonthKey) return;
              setClientTrainingsByMonth((current) => ({
                ...current,
                [selectedMonthKey]: {
                  ...(current[selectedMonthKey] ?? {}),
                  [clientTraining.trainingId]: clientTraining,
                },
              }));
            }}
            onDateChange={showRelativeDay}
            onClose={() => setIsDayPanelOpen(false)}
            onTrainingDeleted={(trainingId, deleteAllAfterThis) => {
              if (deleteAllAfterThis) {
                void selectGroups(selectedGroupIds);
                return;
              }
              setVisibleTrainings((current) => current.filter((training) => training.id !== trainingId));
            }}
            onTrainingSaved={saveVisibleTraining}
            linkBase={linkBase}
            showCreateForm={showCreateForm}
          />
        )}
      </div>
    </section>
  );
}
