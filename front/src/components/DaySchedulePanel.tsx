"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import { formatTime } from "@/lib/format";

type DayTraining = { id: string; title: string; date: Date; coachName?: string };

export function DaySchedulePanel({
  dateKey,
  trainings,
  onClose,
  linkBase = "/dashboard/coach/trainings",
  showCreateForm = true,
}: {
  dateKey: string;
  trainings: DayTraining[];
  onClose: () => void;
  linkBase?: string;
  showCreateForm?: boolean;
}) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function closePanel() {
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, 180);
  }

  const selectedDate = useMemo(() => new Date(`${dateKey}T00:00:00`), [dateKey]);
  const dateTitle = useMemo(
    () => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(selectedDate),
    [selectedDate]
  );
  const weekday = useMemo(() => {
    const value = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(selectedDate);
    return value.charAt(0).toUpperCase() + value.slice(1);
  }, [selectedDate]);

  const orderedTrainings = useMemo(
    () => [...trainings].sort((first, second) => first.date.getTime() - second.date.getTime()),
    [trainings]
  );

  return (
    <aside
      aria-label={`Тренировки на ${dateTitle}`}
      className={`${isClosing ? "day-panel-closing" : "day-panel"} calendar-shadow overflow-hidden rounded-[1.6rem] bg-white/95 min-[1000px]:sticky min-[1000px]:top-6`}
    >
      <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 className="text-xl font-semibold capitalize tracking-[-0.025em] text-foreground">
            {dateTitle}
          </h2>
          <p className="mt-1 text-sm text-muted">{weekday}</p>
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Закрыть панель выбранного дня"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition duration-200 ease-out hover:bg-surface-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-3">
          {orderedTrainings.length > 0 ? (
            orderedTrainings.map((training) => (
              <Link
                key={training.id}
                href={`${linkBase}/${training.id}`}
                className="group rounded-2xl bg-surface-muted/70 p-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent-soft hover:shadow-[0_14px_32px_-24px_rgba(86,61,38,0.45)]"
              >
                <time className="text-xs font-semibold text-accent" dateTime={training.date.toISOString()}>
                  {formatTime(training.date)}
                </time>
                <h3 className="mt-1.5 text-sm font-semibold text-foreground transition-colors group-hover:text-accent-foreground">
                  {training.title}
                </h3>
                {training.coachName && (
                  <p className="mt-1 text-xs text-muted">Тренер: {training.coachName}</p>
                )}
              </Link>
            ))
          ) : (
            <div className="rounded-2xl bg-surface-muted/55 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">Тренировок пока нет</p>
              <p className="mt-1 text-xs leading-5 text-muted">Добавьте первую тренировку на выбранный день.</p>
            </div>
          )}
        </div>

        {showCreateForm && (
          <div className="mt-5">
            {isCreateFormOpen ? (
              <div className="rounded-2xl bg-surface-muted/45 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">Новая тренировка</h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateFormOpen(false)}
                    className="text-xs font-medium text-muted transition hover:text-foreground"
                  >
                    Свернуть
                  </button>
                </div>
                <CreateTrainingForm
                  key={dateKey}
                  idPrefix="day-panel-"
                  defaultDateTime={`${dateKey}T09:00`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateFormOpen(true)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(131,93,57,0.72)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent-hover"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Добавить тренировку
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
