"use client";

import { useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function CoachGroupsCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openModal() {
    setError(undefined);
    setName("");
    dialogRef.current?.showModal();
  }

  function closeModal() {
    if (!isSubmitting) dialogRef.current?.close();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError("Укажите название группы.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось создать группу.");
        return;
      }

      setGroups((currentGroups) => [...currentGroups, normalizedName]);
      dialogRef.current?.close();
      setName("");
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title="Группы">
      {groups.length > 0 ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group} className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <GroupIcon />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{group}</p>
                <p className="text-xs text-muted">Группа</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface-muted/60 px-4 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GroupIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Групп пока нет</p>
            <p className="mt-0.5 text-xs text-muted">Создайте первую группу для своих учеников.</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <PlusIcon />
        Создать группу
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setError(undefined);
          setName("");
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/45"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold">Новая группа</h3>
            <p className="mt-1 text-xs text-muted">Укажите название, которое увидят ученики.</p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            aria-label="Закрыть"
            className="rounded-md px-2 py-1 text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {error && <p className={errorClass}>{error}</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="groupName" className={labelClass}>
              Название группы
            </label>
            <input
              id="groupName"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              autoFocus
              placeholder="Например, Взрослая группа"
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Создание…" : "Создать"}
            </button>
          </div>
        </form>
      </dialog>
    </Card>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="7.5" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 10.5a2.5 2.5 0 0 1 0 5M19 19v-1a3 3 0 0 0-1.2-2.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
