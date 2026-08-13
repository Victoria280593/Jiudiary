"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import { formatTime } from "@/lib/format";
import { getGroupColorStyle } from "@/lib/group-colors";
import { deleteTraining } from "@/lib/trainings-client";
import styles from "./DaySchedulePanel.module.css";

type DayTraining = {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  groupName?: string;
  coachName?: string;
  groupColorName?: string;
};

type GroupFilter = {
  name: string;
  colorName: string;
  count: number;
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string>();
  const [deletingTrainingId, setDeletingTrainingId] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      dialog?.close();
    };
  }, []);

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!(event.target as HTMLElement).closest("[data-training-menu]")) {
        setOpenMenuId(undefined);
      }
    }

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

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

  const groups = useMemo(() => {
    const filters = new Map<string, GroupFilter>();
    for (const training of trainings) {
      if (!training.groupName) continue;
      const current = filters.get(training.groupName);
      filters.set(training.groupName, {
        name: training.groupName,
        colorName: training.groupColorName ?? "Brown",
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...filters.values()];
  }, [trainings]);

  const visibleTrainings = selectedGroup
    ? orderedTrainings.filter((training) => training.groupName === selectedGroup)
    : orderedTrainings;

  async function handleDeleteTraining(trainingId: string) {
    setDeletingTrainingId(trainingId);
    setDeleteError(undefined);
    setOpenMenuId(undefined);

    try {
      await deleteTraining(trainingId);
      onTrainingDeleted?.(trainingId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Не удалось удалить тренировку.");
    } finally {
      setDeletingTrainingId(undefined);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="day-schedule-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={`${styles.modal} fixed inset-0 m-auto h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_28px_90px_-28px_rgba(43,36,29,0.45)] backdrop:bg-[#302820]/45 backdrop:backdrop-blur-[3px] sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:w-[calc(100%-3rem)] sm:rounded-[2rem]`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7 lg:px-9">
          <div className="flex min-w-0 items-start gap-2 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Вернуться к календарю"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-foreground hover:shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 id="day-schedule-title" className="text-xl font-semibold capitalize tracking-[-0.025em] sm:text-2xl">
                {dateTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">{weekday}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть список тренировок"
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-3 text-sm font-medium text-muted shadow-sm transition hover:text-foreground sm:px-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
            <span className="hidden sm:inline">Закрыть</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-7 sm:pb-7 lg:px-9">
          {groups.length > 0 && (
            <div role="group" aria-label="Фильтр тренировок по группе" className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              <button
                type="button"
                onClick={() => setSelectedGroup("")}
                aria-pressed={selectedGroup === ""}
                className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition ${
                  selectedGroup === "" ? "bg-accent text-white shadow-sm" : "bg-white text-muted hover:text-foreground"
                }`}
              >
                Все <span className="opacity-75">{trainings.length}</span>
              </button>
              {groups.map((group) => {
                const colorStyle = getGroupColorStyle(group.colorName);
                return (
                  <button
                    key={group.name}
                    type="button"
                    onClick={() => setSelectedGroup(group.name)}
                    aria-pressed={selectedGroup === group.name}
                    className={`inline-flex min-h-9 max-w-52 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${
                      selectedGroup === group.name ? colorStyle.activeBadge : colorStyle.badge
                    }`}
                  >
                    <span className="truncate">{group.name}</span>
                    <span className="opacity-75">{group.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {deleteError && (
            <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{deleteError}</p>
          )}

          <div className="flex flex-col gap-3">
            {visibleTrainings.length > 0 ? (
              visibleTrainings.map((training) => {
                const colorStyle = getGroupColorStyle(training.groupColorName ?? "Brown");
                const endTime = training.endDate ? formatTime(training.endDate) : undefined;
                const isDeleting = deletingTrainingId === training.id;

                return (
                  <article
                    key={training.id}
                    className={`relative grid min-h-28 grid-cols-[4.4rem_minmax(0,1fr)] overflow-visible rounded-2xl border border-border/60 bg-white shadow-[0_12px_32px_-26px_rgba(86,61,38,0.48)] transition sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:rounded-[1.15rem] ${isDeleting ? "pointer-events-none opacity-55" : ""}`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl sm:w-1.5 ${colorStyle.dot}`} aria-hidden="true" />
                    <time
                      dateTime={training.date.toISOString()}
                      className="flex flex-col items-center justify-center border-r border-border/55 px-2 text-center text-sm font-semibold leading-5 text-foreground sm:text-base"
                    >
                      {formatTime(training.date)}
                      {endTime && <span className="text-[0.68rem] font-normal text-muted sm:text-xs">— {endTime}</span>}
                    </time>

                    <div className="min-w-0 px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-16">
                      {linkBase ? (
                        <Link href={`${linkBase}/${training.id}`} className="group block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                          <h3 className="break-words text-sm font-semibold leading-5 transition group-hover:text-accent sm:text-base sm:leading-6">
                            {training.title || "Тренировка"}
                          </h3>
                          {training.groupName && <p className="mt-1 truncate text-xs text-muted sm:text-sm">{training.groupName}</p>}
                          {training.coachName && <p className="mt-3 text-xs font-medium text-accent-foreground">Тренер: {training.coachName}</p>}
                        </Link>
                      ) : (
                        <>
                          <h3 className="break-words text-sm font-semibold leading-5 sm:text-base sm:leading-6">{training.title || "Тренировка"}</h3>
                          {training.groupName && <p className="mt-1 truncate text-xs text-muted sm:text-sm">{training.groupName}</p>}
                          {training.coachName && <p className="mt-3 text-xs font-medium text-accent-foreground">Тренер: {training.coachName}</p>}
                        </>
                      )}
                    </div>

                    {showCreateForm && (
                      <div data-training-menu className="absolute right-2 top-2 z-10 sm:right-4 sm:top-4">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((current) => current === training.id ? undefined : training.id)}
                          aria-label={`Действия с тренировкой «${training.title || "Тренировка"}»`}
                          aria-expanded={openMenuId === training.id}
                          aria-haspopup="menu"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-lg tracking-[0.12em] text-muted transition hover:bg-surface-muted hover:text-foreground"
                        >
                          <span aria-hidden="true" className="-translate-y-1">…</span>
                        </button>

                        {openMenuId === training.id && (
                          <div role="menu" className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-border/70 bg-white p-1.5 shadow-[0_18px_45px_-18px_rgba(43,36,29,0.42)]">
                            <button
                              type="button"
                              role="menuitem"
                              disabled
                              title="Редактирование появится позже"
                              className="flex min-h-10 w-full cursor-not-allowed items-center rounded-lg px-3 text-left text-sm text-muted opacity-45"
                            >
                              Редактировать
                              <span className="ml-auto text-[0.65rem] uppercase tracking-wide">скоро</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => void handleDeleteTraining(training.id)}
                              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft"
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl bg-white px-5 py-10 text-center">
                <p className="text-sm font-semibold">Тренировок пока нет</p>
                <p className="mt-1 text-xs leading-5 text-muted">Добавьте первую тренировку на выбранный день.</p>
              </div>
            )}
          </div>

          {showCreateForm && (
            <div className="mx-auto mt-5 max-w-md">
              {isCreateFormOpen ? (
                <div className="rounded-2xl border border-border/60 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">Новая тренировка</h3>
                    <button type="button" onClick={() => setIsCreateFormOpen(false)} className="text-xs font-medium text-muted hover:text-foreground">
                      Свернуть
                    </button>
                  </div>
                  <CreateTrainingForm key={dateKey} idPrefix="day-modal-" defaultDateTime={`${dateKey}T09:00`} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateFormOpen(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(131,93,57,0.72)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
                >
                  <span className="text-xl font-light" aria-hidden="true">+</span>
                  Добавить тренировку
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
