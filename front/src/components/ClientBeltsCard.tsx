"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveStoredClientBeltAction, type FormState } from "@/app/actions/profile";
import { TiedBeltIcon } from "@/components/TiedBeltIcon";
import { BELT_BY_ID, BELT_ID_BY_NAME, BELT_LABELS } from "@/lib/belt";
import { inputClass, labelClass } from "@/lib/ui";
import type { BackendClientBelt } from "@/lib/backend-auth";
import type { Belt } from "@prisma/client";

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
  const [isAdding, setIsAdding] = useState(false);
  const allBelts = Object.keys(BELT_LABELS) as Belt[];
  const storedBeltIds = useMemo(
    () => new Set(clientBelts.map((clientBelt) => clientBelt.beltId)),
    [clientBelts]
  );
  const beltsAvailableToAdd = allBelts.filter(
    (belt) => !storedBeltIds.has(BELT_ID_BY_NAME[belt])
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={beltsAvailableToAdd.length === 0}
          onClick={() => setIsAdding((value) => !value)}
          className="rounded-md border border-accent/35 bg-accent-soft px-3 py-2 text-sm font-medium text-accent-foreground transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? "Закрыть" : "+ Добавить пояс"}
        </button>
      </div>

      {isAdding && (
        <StoredBeltEditor
          clientInfoId={clientInfoId}
          availableBelts={beltsAvailableToAdd}
          onClose={() => setIsAdding(false)}
        />
      )}

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
            {clientBelts.map((clientBelt) => (
              <ClientBeltRow
                key={clientBelt.id}
                clientInfoId={clientInfoId}
                clientBelt={clientBelt}
                allBelts={allBelts}
                storedBeltIds={storedBeltIds}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClientBeltRow({
  clientInfoId,
  clientBelt,
  allBelts,
  storedBeltIds,
}: {
  clientInfoId: string;
  clientBelt: BackendClientBelt;
  allBelts: Belt[];
  storedBeltIds: Set<number>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const belt = BELT_BY_ID[clientBelt.beltId];
  const availableBelts = allBelts.filter((availableBelt) => {
    const beltId = BELT_ID_BY_NAME[availableBelt];
    return beltId === clientBelt.beltId || !storedBeltIds.has(beltId);
  });

  if (!belt) return null;

  if (isEditing) {
    return (
      <li className="p-3">
        <StoredBeltEditor
          clientInfoId={clientInfoId}
          clientBelt={clientBelt}
          availableBelts={availableBelts}
          onClose={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.65fr)_minmax(5rem,0.35fr)_2.5rem] sm:items-center sm:gap-4">
      <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
        <TiedBeltIcon belt={belt} className="h-9 w-16 shrink-0" />
        <span className="text-sm font-medium text-foreground">{BELT_LABELS[belt]} пояс</span>
      </div>
      <div>
        <span className="block text-xs text-muted sm:hidden">Дата получения</span>
        <span className="text-sm text-foreground">{formatReceivedDate(clientBelt.receivedDate)}</span>
      </div>
      <div>
        <span className="block text-xs text-muted sm:hidden">Страйпы</span>
        <span className="text-sm text-foreground">{clientBelt.stripesCount}</span>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex h-8 w-8 items-center justify-center justify-self-end rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-accent"
        aria-label={`Редактировать ${BELT_LABELS[belt].toLowerCase()} пояс`}
        title="Редактировать"
      >
        <PencilIcon />
      </button>
    </li>
  );
}

function StoredBeltEditor({
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
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    saveStoredClientBeltAction,
    undefined
  );

  useEffect(() => {
    if (!state?.success) return;

    onClose();
    router.refresh();
  }, [onClose, router, state]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-muted/45 p-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(9rem,0.8fr)_minmax(7rem,0.55fr)_auto] sm:items-end">
      <input type="hidden" name="clientInfoId" value={clientInfoId} />
      {clientBelt && <input type="hidden" name="clientBeltId" value={clientBelt.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor={`stored-belt-${clientBelt?.id ?? "new"}`} className={labelClass}>Пояс</label>
        <select
          id={`stored-belt-${clientBelt?.id ?? "new"}`}
          name="belt"
          defaultValue={clientBelt ? BELT_BY_ID[clientBelt.beltId] : ""}
          required
          className={inputClass}
        >
          <option value="" disabled>Выберите пояс</option>
          {availableBelts.map((belt) => (
            <option key={belt} value={belt}>{BELT_LABELS[belt]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`stored-belt-date-${clientBelt?.id ?? "new"}`} className={labelClass}>Дата получения</label>
        <input
          id={`stored-belt-date-${clientBelt?.id ?? "new"}`}
          name="receivedDate"
          type="date"
          defaultValue={clientBelt?.receivedDate ?? ""}
          max={todayInputValue()}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`stored-belt-stripes-${clientBelt?.id ?? "new"}`} className={labelClass}>Страйпы</label>
        <input
          id={`stored-belt-stripes-${clientBelt?.id ?? "new"}`}
          name="stripesCount"
          type="number"
          min={0}
          step={1}
          defaultValue={clientBelt?.stripesCount ?? 0}
          required
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60">
          {isPending ? "Сохраняем…" : "Сохранить"}
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground">
          Отмена
        </button>
      </div>

      {state?.error && <p className="text-sm text-danger sm:col-span-4">{state.error}</p>}
    </form>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.2 5.2 3.6 3.6M6 18l2.1-4.9L16.8 4.4a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-8.7 8.7L6 18Zm0 0 4.1-1" />
    </svg>
  );
}
