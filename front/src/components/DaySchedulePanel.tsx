"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import { formatTime } from "@/lib/format";
import { getGroupColorStyle } from "@/lib/group-colors";
import { deleteTraining } from "@/lib/trainings-client";

type DayTraining = {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  groupName?: string;
  coachName?: string;
  groupColorName?: string;
};

export function DaySchedulePanel({
  dateKey,
  trainings,
  onClose,
  linkBase = "/dashboard/coach/trainings",
  showCreateForm = true,
  onTrainingDeleted,
}: {
  dateKey: string;
  trainings: DayTraining[];
  onClose: () => void;
  linkBase?: string;
  showCreateForm?: boolean;
  onTrainingDeleted?: (trainingId: string) => void;
}) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [deletingTrainingId, setDeletingTrainingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>();
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

  async function handleDeleteTraining(trainingId: string) {
    setDeletingTrainingId(trainingId);
    setDeleteError(undefined);

    try {
      await deleteTraining(trainingId);
      onTrainingDeleted?.(trainingId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Не удалось удалить тренировку.");
    } finally {
      setDeletingTrainingId(null);
    }
  }

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
        {deleteError && (
          <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{deleteError}</p>
        )}
        <div className="flex flex-col gap-3">
          {orderedTrainings.length > 0 ? (
            orderedTrainings.map((training) => {
              const colorStyle = getGroupColorStyle(training.groupColorName ?? "Brown");
              const timeRange = training.endDate
                ? `${formatTime(training.date)} – ${formatTime(training.endDate)}`
                : formatTime(training.date);
              const content = (
                <>
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${colorStyle.dot}`} aria-hidden="true" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col items-start pl-1.5">
                      <time className="block text-sm font-medium text-muted" dateTime={training.date.toISOString()}>
                        {timeRange}
                      </time>
                      {training.groupName && (
                        <span className={`mt-2 inline-flex max-w-full rounded-full border px-3 py-1 text-xs font-semibold ${colorStyle.badge}`}>
                          {training.groupName}
                        </span>
                      )}
                    </div>
                    {showCreateForm && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleDeleteTraining(training.id);
                        }}
                        disabled={deletingTrainingId === training.id}
                        aria-label="Удалить тренировку"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition duration-200 ease-out hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l1 15h10l1-15" />
                          <path strokeLinecap="round" d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <h3 className="mt-3 whitespace-normal break-words text-base font-semibold leading-6 text-foreground transition-colors group-hover:text-accent-foreground">
                    {training.title}
                  </h3>
                  {training.coachName && (
                    <p className="mt-2 text-xs text-muted">Тренер: {training.coachName}</p>
                  )}
                </>
              );
              const className = "group relative overflow-hidden rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-[0_10px_26px_-22px_rgba(86,61,38,0.42)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-24px_rgba(86,61,38,0.5)]";

              return linkBase ? (
                <Link key={training.id} href={`${linkBase}/${training.id}`} className={className}>
                  {content}
                </Link>
              ) : (
                <article key={training.id} className={className}>
                  {content}
                </article>
              );
            })
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
