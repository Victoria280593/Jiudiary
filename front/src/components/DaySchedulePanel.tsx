"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import { createClientDayNote, getClientDayNotes, type ClientDayNote, updateClientDayNote } from "@/lib/client-day-notes-client";
import {
  addClientTrainingSubmission,
  type ClientTraining,
  type ClientTrainingSubmission,
  deleteClientTrainingSubmission,
  saveClientTraining,
  searchSubmissions,
  type SubmissionSearchResult,
  updateClientTrainingSubmission,
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

function clientTrainingBadge(clientTraining: ClientTraining) {
  if (clientTraining.rounds) {
    return { label: `Раунды: ${clientTraining.rounds}`, className: "bg-accent-soft text-accent-foreground" };
  }
  return { label: "Посетил", className: "bg-success-soft text-success" };
}

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

function SubmissionSearchModal({ excludedIds, onClose, onSelect }: { excludedIds: Set<number>; onClose: () => void; onSelect: (submission: SubmissionSearchResult) => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SubmissionSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<number>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setError(undefined);
      try {
        setResults((await searchSubmissions(normalizedQuery, controller.signal)).filter((submission) => !excludedIds.has(submission.id)));
      } catch (searchError) {
        if (!controller.signal.aborted) setError(searchError instanceof Error ? searchError.message : "Не удалось найти приём.");
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [excludedIds, query]);

  function changeQuery(value: string) {
    setQuery(value);
    setResults([]);
    setIsSearching(false);
    setError(undefined);
  }

  async function selectSubmission(submission: SubmissionSearchResult) {
    setAddingId(submission.id);
    setError(undefined);
    try {
      await onSelect(submission);
      onClose();
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Не удалось добавить приём.");
    } finally {
      setAddingId(undefined);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="submission-search-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!addingId) onClose();
      }}
      className={`${styles.createModal} fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-md rounded-[1.5rem] border border-border/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_30px_90px_-24px_rgba(43,36,29,0.55)] backdrop:bg-[#302820]/45 backdrop:backdrop-blur-[2px]`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 id="submission-search-title" className="text-lg font-semibold">Добавить сабмишен</h3>
          <button type="button" onClick={onClose} disabled={Boolean(addingId)} aria-label="Закрыть поиск" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-muted shadow-sm transition hover:text-foreground disabled:opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <label className="mt-5 block">
          <span className="sr-only">Название сабмишена</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-muted" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m16 16 4 4" /></svg>
            <input autoFocus value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Начните вводить название" className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-muted/70 sm:text-sm" />
          </div>
        </label>

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {isSearching && <p className="py-6 text-center text-sm text-muted">Поиск…</p>}
          {!isSearching && query.trim() && results.length === 0 && !error && <p className="py-6 text-center text-sm text-muted">Ничего не найдено</p>}
          {!isSearching && results.map((submission) => (
            <button key={submission.id} type="button" onClick={() => void selectSubmission(submission)} disabled={Boolean(addingId)} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-2.5 text-left transition hover:border-accent/40 hover:bg-accent-soft/40 disabled:opacity-50">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{submission.nameRu}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{submission.nameEn}</span>
              </span>
              <span className="text-xl font-light text-accent" aria-hidden="true">+</span>
            </button>
          ))}
        </div>
        {error && <p className={`${errorClass} mt-4`}>{error}</p>}
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
  const [manualAttended, setManualAttended] = useState(Boolean(clientTraining));
  const [submissions, setSubmissions] = useState<ClientTrainingSubmission[]>(clientTraining?.submissions ?? []);
  const [isSubmissionSearchOpen, setIsSubmissionSearchOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  // Раунды или добавленные приёмы означают посещение и не позволяют снять отметку вручную.
  const attended = rounds > 0 || submissions.length > 0 ? true : manualAttended;
  const excludedSubmissionIds = useMemo(() => new Set(submissions.map((submission) => submission.submissionId)), [submissions]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function save() {
    setIsSaving(true);
    setError(undefined);
    try {
      if (!attended) {
        setError("Отметьте посещение или укажите количество раундов.");
        return;
      }

      const savedTraining = await saveClientTraining(training.id, rounds);
      const persistedSubmissions = new Map(savedTraining.submissions.map((submission) => [submission.submissionId, submission]));
      const draftSubmissionIds = new Set(submissions.map((submission) => submission.submissionId));

      const saveSubmissions = submissions.map(async (submission) => {
        const persistedSubmission = persistedSubmissions.get(submission.submissionId);
        if (!persistedSubmission) {
          const addedSubmission = await addClientTrainingSubmission(training.id, submission.submissionId);
          return submission.count === addedSubmission.count
            ? addedSubmission
            : updateClientTrainingSubmission(training.id, submission.submissionId, submission.count);
        }

        return submission.count === persistedSubmission.count
          ? persistedSubmission
          : updateClientTrainingSubmission(training.id, submission.submissionId, submission.count);
      });
      const deleteSubmissions = savedTraining.submissions
        .filter((submission) => !draftSubmissionIds.has(submission.submissionId))
        .map((submission) => deleteClientTrainingSubmission(training.id, submission.submissionId));
      const savedSubmissions = await Promise.all(saveSubmissions);
      await Promise.all(deleteSubmissions);

      onSaved({ ...savedTraining, submissions: savedSubmissions.sort((left, right) => left.submissionId - right.submissionId) });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось отметить тренировку.");
    } finally {
      setIsSaving(false);
    }
  }

  async function addSubmission(submission: SubmissionSearchResult) {
    setError(undefined);
    setSubmissions((current) => [...current, { submissionId: submission.id, nameRu: submission.nameRu, nameEn: submission.nameEn, count: 1 }].sort((left, right) => left.submissionId - right.submissionId));
    setManualAttended(true);
  }

  function changeSubmissionCount(submission: ClientTrainingSubmission, count: number) {
    if (count <= 0) return;
    setError(undefined);
    setSubmissions((current) => current.map((item) => item.submissionId === submission.submissionId ? { ...item, count } : item));
  }

  function removeSubmission(submissionId: number) {
    setError(undefined);
    setSubmissions((current) => current.filter((submission) => submission.submissionId !== submissionId));
  }

  return (
    <>
    <dialog
      ref={dialogRef}
      aria-labelledby="client-training-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) onClose();
      }}
      className={`${styles.createModal} fixed inset-0 m-auto max-h-[calc(100svh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-[1.5rem] border border-border/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_30px_90px_-24px_rgba(43,36,29,0.55)] backdrop:bg-[#302820]/55 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100svh-3rem)]`}
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

        <label
          className={`mt-5 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 ${rounds > 0 || submissions.length > 0 ? "opacity-60" : "cursor-pointer hover:bg-surface-muted"}`}
        >
          <input
            type="checkbox"
            checked={attended}
            disabled={rounds > 0 || submissions.length > 0 || isSaving}
            onChange={(event) => setManualAttended(event.target.checked)}
            className="h-4 w-4 rounded border-border text-accent focus:ring-1 focus:ring-accent"
          />
          <span className="text-sm font-medium text-foreground">
            Посетил{(rounds > 0 || submissions.length > 0) && <span className="ml-1 font-normal text-muted">— проставлено автоматически</span>}
          </span>
        </label>

        <section className="mt-6 border-t border-border/70 pt-5" aria-labelledby="client-training-submissions-title">
          <h4 id="client-training-submissions-title" className="text-lg font-semibold">Сабмишены</h4>

          {submissions.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {submissions.map((submission) => (
                  <div key={submission.submissionId} className="grid grid-cols-[minmax(0,1fr)_2.75rem_2rem_2.75rem_2.5rem] items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2.5 shadow-[0_8px_22px_-20px_rgba(86,61,38,0.42)]">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{submission.nameRu}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{submission.nameEn}</span>
                    </span>
                    <button type="button" onClick={() => changeSubmissionCount(submission, submission.count - 1)} disabled={isSaving || submission.count <= 1} aria-label={`Уменьшить количество «${submission.nameRu}»`} className="h-10 rounded-xl border border-border bg-white text-xl transition hover:bg-surface-muted disabled:opacity-35">−</button>
                    <output className="text-center text-lg font-semibold tabular-nums" aria-live="polite">{submission.count}</output>
                    <button type="button" onClick={() => changeSubmissionCount(submission, submission.count + 1)} disabled={isSaving} aria-label={`Увеличить количество «${submission.nameRu}»`} className="h-10 rounded-xl bg-accent text-xl text-white transition hover:bg-accent-hover disabled:opacity-50">+</button>
                    <button type="button" onClick={() => removeSubmission(submission.submissionId)} disabled={isSaving} aria-label={`Удалить «${submission.nameRu}»`} className="flex h-10 items-center justify-center rounded-xl text-danger transition hover:bg-danger-soft disabled:opacity-50">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg>
                    </button>
                  </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setIsSubmissionSearchOpen(true)} disabled={isSaving} className="mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white/45 text-sm font-semibold text-accent-foreground transition hover:border-accent/50 hover:bg-accent-soft/35 disabled:opacity-50">
            <span className="text-2xl font-light" aria-hidden="true">+</span>
            Добавить сабмишен
          </button>
        </section>

        {error && <p className={`${errorClass} mt-5`}>{error}</p>}
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving || !attended}
          className="mt-7 min-h-12 w-full rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {isSaving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </dialog>
    {isSubmissionSearchOpen && <SubmissionSearchModal excludedIds={excludedSubmissionIds} onClose={() => setIsSubmissionSearchOpen(false)} onSelect={addSubmission} />}
    </>
  );
}

function EditableDayNote({ note, onSaved }: { note: ClientDayNote; onSaved: (note: ClientDayNote) => void }) {
  const [text, setText] = useState(note.text);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function save() {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setError("Введите текст заметки.");
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      const savedNote = await updateClientDayNote(note.id, normalizedText);
      setText(savedNote.text);
      onSaved(savedNote);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось обновить заметку.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/70 bg-[#fbfaf8] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">Заметка</span>
        <span className="shrink-0 text-xs tabular-nums text-muted">{text.length}/500</span>
      </div>
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setError(undefined);
        }}
        maxLength={500}
        rows={3}
        disabled={isSaving}
        className="mt-2 block min-h-20 w-full resize-y rounded-lg border border-border bg-white px-3 py-2.5 text-base leading-6 text-foreground outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/10 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-xs text-danger" role="status">{error}</div>
        <button type="button" onClick={() => void save()} disabled={isSaving || !text.trim() || text.trim() === note.text} className="min-h-9 rounded-lg border border-accent/35 bg-white px-4 text-sm font-semibold text-accent transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50">
          {isSaving ? "Сохранение…" : "Обновить"}
        </button>
      </div>
    </div>
  );
}

function AddDayNoteModal({ dateKey, onClose, onCreated }: { dateKey: string; onClose: () => void; onCreated: (note: ClientDayNote) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function create() {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setError("Введите текст заметки.");
      return;
    }

    setIsCreating(true);
    setError(undefined);
    try {
      const createdNote = await createClientDayNote(dateKey, normalizedText);
      onCreated(createdNote);
      onClose();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Не удалось добавить заметку.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="add-day-note-title"
      aria-describedby="add-day-note-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!isCreating) onClose();
      }}
      className={`${styles.createModal} fixed inset-0 m-auto max-h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-[1.5rem] border border-border/70 bg-[#fbfaf8] p-0 text-foreground shadow-[0_30px_90px_-24px_rgba(43,36,29,0.55)] backdrop:bg-[#302820]/50 backdrop:backdrop-blur-[3px] sm:max-h-[calc(100svh-2rem)] sm:w-[calc(100%-2rem)]`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
        className="p-4 sm:p-5 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 pt-1">
            <h3 id="add-day-note-title" className="text-lg font-semibold sm:text-xl">Добавить заметку</h3>
            <p id="add-day-note-description" className="mt-1 text-sm leading-5 text-muted">Заметка будет видна только вам</p>
          </div>
          <button type="button" onClick={onClose} disabled={isCreating} aria-label="Закрыть добавление заметки" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-muted shadow-sm transition hover:text-foreground disabled:opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <label className="mt-5 block">
          <span className="sr-only">Текст заметки</span>
          <textarea
            autoFocus
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(undefined);
            }}
            maxLength={500}
            rows={5}
            disabled={isCreating}
            placeholder="Что важно запомнить об этом дне?"
            className="block min-h-36 w-full max-w-full resize-y rounded-2xl border border-border bg-white px-4 py-3 text-base leading-6 text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent/55 focus:ring-2 focus:ring-accent/10 disabled:cursor-wait disabled:opacity-60"
          />
        </label>
        <div className="mt-2 flex min-h-5 items-start justify-between gap-3">
          <p className="text-xs text-danger" role="status">{error}</p>
          <span className="ml-auto shrink-0 text-xs tabular-nums text-muted">{text.length}/500</span>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button type="button" onClick={onClose} disabled={isCreating} className="min-h-11 w-full rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:opacity-50 sm:w-auto">Отмена</button>
          <button type="submit" disabled={isCreating || !text.trim()} className="min-h-11 w-full rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {isCreating ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DayNoteEditor({ dateKey }: { dateKey: string }) {
  const [notes, setNotes] = useState<ClientDayNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    void getClientDayNotes(dateKey, controller.signal)
      .then(setNotes)
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заметки.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [dateKey]);

  return (
    <>
      <section className="mb-5 rounded-2xl border border-border/70 bg-white p-4 shadow-[0_12px_32px_-26px_rgba(86,61,38,0.48)] sm:p-5" aria-labelledby="day-note-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="day-note-title" className="text-sm font-semibold text-foreground sm:text-base">Заметки на день</h3>
            <p className="mt-0.5 text-xs text-muted">Видны только вам</p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button type="button" onClick={() => setIsAddModalOpen(true)} disabled={isLoading} className="min-h-10 flex-1 rounded-xl border border-accent/30 bg-accent-soft/55 px-4 text-sm font-semibold text-accent-foreground transition hover:border-accent/45 hover:bg-accent-soft disabled:cursor-wait disabled:opacity-50 sm:flex-none">
              + Добавить заметку
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted">Загрузка заметок…</p>
        ) : (
          <div className="mt-3 space-y-3">
            {notes.map((note) => (
              <EditableDayNote
                key={note.id}
                note={note}
                onSaved={(savedNote) => setNotes((current) => current.map((item) => item.id === savedNote.id ? savedNote : item))}
              />
            ))}
          </div>
        )}
        {error && <p className={`${errorClass} mt-3`}>{error}</p>}
      </section>
      {isAddModalOpen && <AddDayNoteModal dateKey={dateKey} onClose={() => setIsAddModalOpen(false)} onCreated={(createdNote) => setNotes((current) => [...current, createdNote])} />}
    </>
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
          <DayNoteEditor key={dateKey} dateKey={dateKey} />

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
                    className={`relative grid min-h-32 grid-cols-[4.4rem_minmax(0,1fr)] overflow-visible rounded-2xl border border-border/60 bg-white shadow-[0_12px_32px_-26px_rgba(86,61,38,0.48)] transition sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:rounded-[1.15rem] ${isDeleting ? "pointer-events-none opacity-55" : ""}`}
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

                    <div className="min-w-0 px-4 py-4 pr-16 sm:px-6 sm:py-5 sm:pr-20">
                      {linkBase ? (
                        <Link href={`${linkBase}/${training.id}`} className="group block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                          {training.groupName && <p className="truncate text-xs font-normal text-muted sm:text-sm">{training.groupName}</p>}
                          <h3 className={`${training.groupName ? "mt-1" : ""} whitespace-pre-wrap break-words text-sm font-semibold leading-5 transition group-hover:text-accent sm:text-base sm:leading-6`}>
                            {training.title || "Тренировка"}
                          </h3>
                          {training.coachName && <p className="mt-3 text-xs font-medium text-accent-foreground">Тренер: {training.coachName}</p>}
                          {training.clientTraining && (
                            <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${clientTrainingBadge(training.clientTraining).className}`}>
                              {clientTrainingBadge(training.clientTraining).label}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <>
                          {training.groupName && <p className="truncate text-xs font-normal text-muted sm:text-sm">{training.groupName}</p>}
                          <h3 className={`${training.groupName ? "mt-1" : ""} whitespace-pre-wrap break-words text-sm font-semibold leading-5 sm:text-base sm:leading-6`}>{training.title || "Тренировка"}</h3>
                          {training.coachName && <p className="mt-3 text-xs font-medium text-accent-foreground">Тренер: {training.coachName}</p>}
                          {training.clientTraining && (
                            <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${clientTrainingBadge(training.clientTraining).className}`}>
                              {clientTrainingBadge(training.clientTraining).label}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="group absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-4">
                      <button
                        type="button"
                        onClick={() => {
                          setMarkingTraining(training);
                          setOpenMenuId(undefined);
                        }}
                        aria-label={`Изменить тренировку «${training.title || "Тренировка"}»`}
                        aria-describedby={`edit-training-tooltip-${training.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft/70 text-accent shadow-sm transition hover:border-accent/35 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5 17.5 10.5M4 20l4.2-1 10.3-10.3a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
                        </svg>
                      </button>
                      <span id={`edit-training-tooltip-${training.id}`} role="tooltip" className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        Изменить тренировку
                      </span>
                    </div>

                    {showCreateForm && (
                      <div data-training-menu className="absolute right-2 top-2 z-20 sm:right-3">
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
                                setEditingTraining(training);
                                setOpenMenuId(undefined);
                              }}
                              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm text-foreground transition hover:bg-surface-muted"
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openDeleteDialog(training)}
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
