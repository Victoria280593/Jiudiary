"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import {
  type ClientTraining,
  saveClientTraining,
} from "@/lib/client-trainings-client";
import { formatTime } from "@/lib/format";
import { getGroupColorStyle } from "@/lib/group-colors";
import { deleteTraining } from "@/lib/trainings-client";
import { errorClass } from "@/lib/ui";
import styles from "./DaySchedulePanel.module.css";

type DayTraining = {
  id: string;
  groupId?: string;
  title: string;
  date: Date;
  endDate?: Date;
  groupName?: string;
  coachName?: string;
  groupColorName?: string;
  clientTraining?: ClientTraining | null;
};

type GroupFilter = {
  name: string;
  colorName: string;
  count: number;
};

type SavedTraining = {
  id: string;
  groupId: string;
  groupName: string;
  groupColorName: string;
  description: string | null;
  startTime: string;
  endTime: string;
};

function localDateTimeValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

function TrainingFormModal({
  dateKey,
  training,
  onClose,
  onSaved,
}: {
  dateKey: string;
  training?: DayTraining;
  onClose: () => void;
  onSaved: (training: SavedTraining, repeatEveryWeek?: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEditing = Boolean(training);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="training-form-title"
      onCancel={(event) => {
        event.preventDefault();
      }}
      className={`${styles.createModal} fixed inset-0 m-auto max-h-[calc(100svh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-[1.5rem] border border-border/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_30px_90px_-24px_rgba(43,36,29,0.55)] backdrop:bg-[#302820]/55 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100svh-3rem)] sm:w-[calc(100%-3rem)]`}
    >
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 id="training-form-title" className="text-base font-semibold sm:text-lg">
            {isEditing ? "Редактирование тренировки" : "Новая тренировка"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть форму тренировки"
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-white px-3 text-sm font-medium text-muted shadow-sm transition hover:text-foreground sm:px-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
            <span className="hidden sm:inline">Закрыть</span>
          </button>
        </div>
        <CreateTrainingForm
          key={training?.id ?? dateKey}
          idPrefix={isEditing ? "edit-training-" : "day-modal-"}
          defaultDateTime={`${dateKey}T09:00`}
          training={training ? {
            id: training.id,
            groupId: training.groupId ?? "",
            description: training.title || null,
            startTime: localDateTimeValue(training.date),
            endTime: localDateTimeValue(training.endDate ?? training.date),
          } : undefined}
          onSaved={onSaved}
        />
      </div>
    </dialog>
  );
}

function ClientTrainingModal({
  training,
  clientTraining,
  onClose,
  onSaved,
}: {
  training: DayTraining;
  clientTraining?: ClientTraining;
  onClose: () => void;
  onSaved: (clientTraining: ClientTraining) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rounds, setRounds] = useState(clientTraining?.rounds ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function save() {
    setIsSaving(true);
    setError(undefined);
    try {
      onSaved(await saveClientTraining(training.id, rounds));
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось отметить тренировку.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="client-training-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) onClose();
      }}
      className={`${styles.createModal} fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-md rounded-[1.5rem] border border-border/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_30px_90px_-24px_rgba(43,36,29,0.55)] backdrop:bg-[#302820]/55 backdrop:backdrop-blur-[2px]`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id="client-training-title" className="text-lg font-semibold">Отметить тренировку</h3>
            <p className="mt-1 truncate text-sm text-muted">{training.groupName || training.title || "Тренировка"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Закрыть"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-muted shadow-sm transition hover:text-foreground disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-7">
          <p className="text-center text-sm font-medium text-muted">Количество раундов</p>
          <div className="mt-4 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-4">
            <button
              type="button"
              onClick={() => setRounds((current) => Math.max(0, current - 1))}
              disabled={rounds === 0 || isSaving}
              aria-label="Уменьшить количество раундов"
              className="h-14 rounded-2xl border border-border bg-white text-2xl font-light transition hover:bg-surface-muted disabled:opacity-40"
            >
              −
            </button>
            <output className="text-center text-4xl font-semibold tabular-nums" aria-live="polite">{rounds}</output>
            <button
              type="button"
              onClick={() => setRounds((current) => current + 1)}
              disabled={isSaving}
              aria-label="Увеличить количество раундов"
              className="h-14 rounded-2xl bg-accent text-2xl font-light text-white transition hover:bg-accent-hover disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {error && <p className={`${errorClass} mt-5`}>{error}</p>}
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving}
          className="mt-7 min-h-12 w-full rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {isSaving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </dialog>
  );
}

export function DaySchedulePanel({
  dateKey,
  trainings,
  onClose,
  onDateChange,
  linkBase = "/dashboard/coach/trainings",
  showCreateForm = true,
  onClientTrainingSaved,
  onTrainingDeleted,
  onTrainingSaved,
}: {
  dateKey: string;
  trainings: DayTraining[];
  onClose: () => void;
  onDateChange: (dateKey: string) => void;
  linkBase?: string;
  showCreateForm?: boolean;
  onClientTrainingSaved: (clientTraining: ClientTraining) => void;
  onTrainingDeleted?: (trainingId: string, deleteAllAfterThis?: boolean) => void;
  onTrainingSaved?: (training: SavedTraining, repeatEveryWeek?: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<DayTraining>();
  const [markingTraining, setMarkingTraining] = useState<DayTraining>();
  const [openMenuId, setOpenMenuId] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<DayTraining>();
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

  function showRelativeDay(delta: number) {
    const nextDate = new Date(`${dateKey}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + delta);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, "0");
    const day = String(nextDate.getDate()).padStart(2, "0");
    setSelectedGroup("");
    setOpenMenuId(undefined);
    onDateChange(`${year}-${month}-${day}`);
  }

  function openDeleteDialog(training: DayTraining) {
    setDeleteTarget(training);
    setDeleteError(undefined);
    setOpenMenuId(undefined);
    deleteDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    if (deletingTrainingId) return;
    deleteDialogRef.current?.close();
    setDeleteTarget(undefined);
  }

  async function confirmDeleteTraining(deleteAllAfterThis: boolean) {
    if (!deleteTarget) return;
    const trainingId = deleteTarget.id;
    setDeletingTrainingId(trainingId);
    setDeleteError(undefined);

    try {
      await deleteTraining(trainingId, deleteAllAfterThis);
      onTrainingDeleted?.(trainingId, deleteAllAfterThis);
      deleteDialogRef.current?.close();
      setDeleteTarget(undefined);
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
      }}
      className={`${styles.modal} fixed inset-0 m-auto h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_28px_90px_-28px_rgba(43,36,29,0.45)] backdrop:bg-[#302820]/45 backdrop:backdrop-blur-[3px] sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:w-[calc(100%-3rem)] sm:rounded-[2rem]`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7 lg:px-9">
          <div className="flex min-w-0 items-start gap-1 sm:gap-3">
            <button
              type="button"
              onClick={() => showRelativeDay(-1)}
              aria-label="Предыдущий день"
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
            <button
              type="button"
              onClick={() => showRelativeDay(1)}
              aria-label="Следующий день"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-foreground hover:shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </button>
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
                      <span>{formatTime(training.date)}</span>
                      {endTime && (
                        <>
                          <span aria-hidden="true">-</span>
                          <span>{endTime}</span>
                        </>
                      )}
                    </time>

                    <div className="min-w-0 px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-16">
                      {linkBase ? (
                        <Link href={`${linkBase}/${training.id}`} className="group block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                          {training.groupName && <p className="truncate text-xs font-normal text-muted sm:text-sm">{training.groupName}</p>}
                          <h3 className={`${training.groupName ? "mt-1" : ""} whitespace-pre-wrap break-words text-sm font-semibold leading-5 transition group-hover:text-accent sm:text-base sm:leading-6`}>
                            {training.title || "Тренировка"}
                          </h3>
                          {training.coachName && <p className="mt-3 text-xs font-medium text-accent-foreground">Тренер: {training.coachName}</p>}
                          {training.clientTraining && (
                            <p className="mt-3 inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                              {training.clientTraining.rounds === null ? "Тренировка отмечена" : `Раунды: ${training.clientTraining.rounds}`}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <>
                          {training.groupName && <p className="truncate text-xs font-normal text-muted sm:text-sm">{training.groupName}</p>}
                          <h3 className={`${training.groupName ? "mt-1" : ""} whitespace-pre-wrap break-words text-sm font-semibold leading-5 sm:text-base sm:leading-6`}>{training.title || "Тренировка"}</h3>
                          {training.coachName && <p className="mt-3 text-xs font-medium text-accent-foreground">Тренер: {training.coachName}</p>}
                          {training.clientTraining && (
                            <p className="mt-3 inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                              {training.clientTraining.rounds === null ? "Тренировка отмечена" : `Раунды: ${training.clientTraining.rounds}`}
                            </p>
                          )}
                        </>
                      )}
                    </div>

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
                            onClick={() => {
                              setMarkingTraining(training);
                              setOpenMenuId(undefined);
                            }}
                            className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm text-foreground transition hover:bg-surface-muted"
                          >
                            {training.clientTraining ? "Изменить отметку" : "Отметить тренировку"}
                          </button>
                          {showCreateForm && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setEditingTraining(training);
                                setOpenMenuId(undefined);
                              }}
                              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm text-foreground transition hover:bg-surface-muted"
                            >
                              Редактировать
                            </button>
                          )}
                          {showCreateForm && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openDeleteDialog(training)}
                              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
              <button
                type="button"
                onClick={() => setIsCreateFormOpen(true)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(131,93,57,0.72)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
              >
                <span className="text-xl font-light" aria-hidden="true">+</span>
                Добавить тренировку
              </button>
            </div>
          )}
        </div>
      </div>

      {isCreateFormOpen && (
        <TrainingFormModal
          dateKey={dateKey}
          onClose={() => setIsCreateFormOpen(false)}
          onSaved={(training, repeatEveryWeek) => {
            onTrainingSaved?.(training, repeatEveryWeek);
            setIsCreateFormOpen(false);
          }}
        />
      )}
      {editingTraining && (
        <TrainingFormModal
          dateKey={dateKey}
          training={editingTraining}
          onClose={() => setEditingTraining(undefined)}
          onSaved={(training) => {
            onTrainingSaved?.(training);
            setEditingTraining(undefined);
          }}
        />
      )}
      {markingTraining && (
        <ClientTrainingModal
          key={markingTraining.id}
          training={markingTraining}
          clientTraining={markingTraining.clientTraining ?? undefined}
          onClose={() => setMarkingTraining(undefined)}
          onSaved={onClientTrainingSaved}
        />
      )}

      <dialog
        ref={deleteDialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeDeleteDialog();
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30"
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">Удалить тренировку?</h2>
          {deleteTarget && (
            <p className="mt-1 text-sm text-muted">
              {deleteTarget.title || "Тренировка"} · {formatTime(deleteTarget.date)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 px-5 py-5 sm:px-6">
          {deleteError && <p className={errorClass}>{deleteError}</p>}
          <p className="text-sm leading-6 text-muted">
            Тренировка может быть частью еженедельной серии. Выберите, что удалить.
          </p>
          <button
            type="button"
            onClick={() => void confirmDeleteTraining(false)}
            disabled={Boolean(deletingTrainingId)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted disabled:opacity-50"
          >
            Только эту тренировку
          </button>
          <button
            type="button"
            onClick={() => void confirmDeleteTraining(true)}
            disabled={Boolean(deletingTrainingId)}
            className="rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:opacity-60"
          >
            {deletingTrainingId ? "Удаление…" : "Эту и все следующие в серии"}
          </button>
          <button
            type="button"
            onClick={closeDeleteDialog}
            disabled={Boolean(deletingTrainingId)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-muted disabled:opacity-50"
          >
            Отмена
          </button>
        </div>
      </dialog>
    </dialog>
  );
}
