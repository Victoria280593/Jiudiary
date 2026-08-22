"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveStoredClientBeltAction, type FormState } from "@/app/actions/profile";
import { TiedBeltIcon } from "@/components/TiedBeltIcon";
import { BELT_BY_ID, BELT_ID_BY_NAME, BELT_LABELS } from "@/lib/belt";
import { inputClass, labelClass } from "@/lib/ui";
import type { BackendClientBelt } from "@/lib/backend-auth";
import type { Belt } from "@prisma/client";

const dialogClass = "m-auto w-[min(92vw,34rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30 backdrop:backdrop-blur-[2px]";

function formatReceivedDate(value: string | null): string {
  if (!value) return "Не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function todayInputValue(): string {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function ClientBeltsCard({
  clientInfoId,
  clientBelts,
}: {
  clientInfoId: string;
  clientBelts: BackendClientBelt[];
}) {
  const [editingClientBelt, setEditingClientBelt] = useState<BackendClientBelt | null>();
  const allBelts = Object.keys(BELT_LABELS) as Belt[];
  const storedBeltIds = useMemo(
    () => new Set(clientBelts.map((clientBelt) => clientBelt.beltId)),
    [clientBelts]
  );
  const availableBelts = allBelts.filter((belt) => {
    const beltId = BELT_ID_BY_NAME[belt];
    return beltId === editingClientBelt?.beltId || !storedBeltIds.has(beltId);
  });
  const canAddBelt = storedBeltIds.size < allBelts.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">Стена хранения поясов БЖЖ</h2>
        <button
          type="button"
          disabled={!canAddBelt}
          onClick={() => setEditingClientBelt(null)}
          className="rounded-md border border-accent/35 bg-accent-soft px-3 py-2 text-sm font-medium text-accent-foreground transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Добавить пояс
        </button>
      </div>

      {clientBelts.length === 0 ? (
        <p className="text-sm text-muted">История поясов пока пустая.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.65fr)_minmax(5rem,0.35fr)_2.5rem] gap-4 border-b border-border bg-surface-muted/55 px-4 py-2.5 text-xs font-medium text-muted sm:grid">
            <span>Пояс</span>
            <span>Дата получения</span>
            <span>Страйпы</span>
            <span className="sr-only">Действия</span>
          </div>
          <ul className="divide-y divide-border">
            {clientBelts.map((clientBelt) => {
              const belt = BELT_BY_ID[clientBelt.beltId];
              if (!belt) return null;

              return (
                <li
                  key={clientBelt.id}
                  className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.65fr)_minmax(5rem,0.35fr)_2.5rem] sm:items-center sm:gap-4"
                >
                  <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                    <TiedBeltIcon belt={belt} className="h-9 w-16 shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {BELT_LABELS[belt]} пояс
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted sm:hidden">Дата получения</span>
                    <span className="text-sm text-foreground">
                      {formatReceivedDate(clientBelt.receivedDate)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted sm:hidden">Страйпы</span>
                    <span className="text-sm text-foreground">{clientBelt.stripesCount}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingClientBelt(clientBelt)}
                    className="inline-flex h-8 w-8 items-center justify-center justify-self-end rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-accent"
                    aria-label={`Редактировать ${BELT_LABELS[belt].toLowerCase()} пояс`}
                    title="Редактировать"
                  >
                    <PencilIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {editingClientBelt !== undefined && (
        <StoredBeltModal
          clientInfoId={clientInfoId}
          clientBelt={editingClientBelt ?? undefined}
          availableBelts={availableBelts}
          onClose={() => setEditingClientBelt(undefined)}
        />
      )}
    </div>
  );
}

function StoredBeltModal({
  clientInfoId,
  clientBelt,
  availableBelts,
  onClose,
}: {
  clientInfoId: string;
  clientBelt?: BackendClientBelt;
  availableBelts: Belt[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    saveStoredClientBeltAction,
    undefined
  );

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  useEffect(() => {
    if (!state?.success) return;

    dialogRef.current?.close();
    router.refresh();
  }, [router, state]);

  function closeModal() {
    if (!isPending) dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) closeModal();
      }}
      className={dialogClass}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <h3 className="text-xl font-semibold tracking-[-0.025em]">
          {clientBelt ? "Редактирование пояса" : "Добавление пояса"}
        </h3>
        <button
          type="button"
          onClick={closeModal}
          disabled={isPending}
          aria-label="Закрыть"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4 px-5 py-5 sm:px-6">
        <input type="hidden" name="clientInfoId" value={clientInfoId} />
        {clientBelt && <input type="hidden" name="clientBeltId" value={clientBelt.id} />}

        {state?.error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="stored-belt" className={labelClass}>Пояс</label>
          <select
            id="stored-belt"
            name="belt"
            defaultValue={clientBelt ? BELT_BY_ID[clientBelt.beltId] : ""}
            required
            autoFocus
            className={inputClass}
          >
            <option value="" disabled>Выберите пояс</option>
            {availableBelts.map((belt) => (
              <option key={belt} value={belt}>{BELT_LABELS[belt]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="stored-belt-date" className={labelClass}>Дата получения</label>
            <input
              id="stored-belt-date"
              name="receivedDate"
              type="date"
              defaultValue={clientBelt?.receivedDate ?? ""}
              max={todayInputValue()}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="stored-belt-stripes" className={labelClass}>Страйпы</label>
            <input
              id="stored-belt-stripes"
              name="stripesCount"
              type="number"
              min={0}
              step={1}
              defaultValue={clientBelt?.stripesCount ?? 0}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={closeModal}
            disabled={isPending}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {isPending ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.2 5.2 3.6 3.6M6 18l2.1-4.9L16.8 4.4a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-8.7 8.7L6 18Zm0 0 4.1-1" />
    </svg>
  );
}
