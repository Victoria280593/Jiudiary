"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changeClientBeltAction, type FormState } from "@/app/actions/profile";
import { notifyBeltUpdated } from "@/components/LiveBelt";
import { TiedBeltIcon } from "@/components/TiedBeltIcon";
import {
  BELT_BY_ID,
  BELT_LABELS,
  beltsForAge,
  calculateAge,
} from "@/lib/belt";
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
  birthDate,
  currentBelt,
  clientBelts,
}: {
  clientInfoId: string;
  birthDate: Date | null;
  currentBelt: Belt | null;
  clientBelts: BackendClientBelt[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    changeClientBeltAction,
    undefined
  );
  const availableBelts = birthDate
    ? beltsForAge(calculateAge(birthDate))
    : (Object.keys(BELT_LABELS) as Belt[]);
  const currentEntry = currentBelt
    ? clientBelts.find((item) => BELT_BY_ID[item.beltId] === currentBelt)
    : undefined;

  useEffect(() => {
    if (!state?.success) return;

    notifyBeltUpdated(state.belt ?? null);
    router.refresh();
  }, [router, state]);

  return (
    <div className="flex flex-col gap-5">
      <form
        key={`${currentBelt ?? "none"}-${currentEntry?.id ?? "new"}`}
        action={formAction}
        className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-muted/45 p-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(9rem,0.8fr)_minmax(7rem,0.55fr)_auto] sm:items-end"
      >
        <input type="hidden" name="clientInfoId" value={clientInfoId} />

        <div className="flex flex-col gap-1">
          <label htmlFor="client-belt" className={labelClass}>Пояс</label>
          <select
            id="client-belt"
            name="belt"
            defaultValue={currentBelt ?? ""}
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
          <label htmlFor="belt-received-date" className={labelClass}>Дата получения</label>
          <input
            id="belt-received-date"
            name="receivedDate"
            type="date"
            defaultValue={currentEntry?.receivedDate ?? ""}
            max={todayInputValue()}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="belt-stripes-count" className={labelClass}>Страйпы</label>
          <input
            id="belt-stripes-count"
            name="stripesCount"
            type="number"
            min={0}
            step={1}
            defaultValue={currentEntry?.stripesCount ?? 0}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Сохраняем…" : "Сохранить"}
        </button>

        {state?.error && (
          <p className="text-sm text-danger sm:col-span-4">{state.error}</p>
        )}
      </form>

      {clientBelts.length === 0 ? (
        <p className="text-sm text-muted">История поясов пока пустая.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.65fr)_minmax(5rem,0.35fr)] gap-4 border-b border-border bg-surface-muted/55 px-4 py-2.5 text-xs font-medium text-muted sm:grid">
            <span>Пояс</span>
            <span>Дата получения</span>
            <span>Страйпы</span>
          </div>
          <ul className="divide-y divide-border">
            {clientBelts.map((clientBelt) => {
              const belt = BELT_BY_ID[clientBelt.beltId];
              if (!belt) return null;

              return (
                <li
                  key={clientBelt.id}
                  className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.65fr)_minmax(5rem,0.35fr)] sm:items-center sm:gap-4"
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
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
