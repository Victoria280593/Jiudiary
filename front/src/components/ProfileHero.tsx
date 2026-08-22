"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeCurrentClientBeltAction,
  type FormState,
} from "@/app/actions/profile";
import { Avatar } from "@/components/Avatar";
import { BeltBadge } from "@/components/BeltBadge";
import { notifyBeltUpdated, useLiveBelt } from "@/components/LiveBelt";
import { BELT_LABELS, beltsForAge } from "@/lib/belt";
import { inputClass } from "@/lib/ui";
import type { Belt } from "@prisma/client";

export function ProfileHero({
  clientInfoId,
  name,
  roleLabel,
  avatarUrl,
  age,
  belt,
}: {
  clientInfoId: string;
  name: string;
  roleLabel: string;
  avatarUrl: string | null;
  age: number | null;
  belt: Belt | null;
}) {
  const liveBelt = useLiveBelt(belt);
  const [isBeltModalOpen, setIsBeltModalOpen] = useState(false);
  const ageAvailableBelts = age === null
    ? (Object.keys(BELT_LABELS) as Belt[])
    : beltsForAge(age);
  const availableBelts = liveBelt && !ageAvailableBelts.includes(liveBelt)
    ? [liveBelt, ...ageAvailableBelts]
    : ageAvailableBelts;

  return (
    <section className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col items-center gap-5 px-5 py-6 text-center sm:flex-row sm:px-7 sm:py-7 sm:text-left">
        <div className="rounded-full border border-border bg-accent-soft p-1 shadow-sm">
          <Avatar src={avatarUrl} name={name} size={104} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
              {name}
            </h2>
            <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {roleLabel}
            </span>
          </div>

          {age !== null && <p className="mt-3 text-sm text-muted">Возраст: {age}</p>}

          <div className="mt-4 flex flex-col items-center gap-2 sm:items-start">
            <div className="flex items-center gap-2">
              {liveBelt ? (
                <BeltBadge belt={liveBelt} />
              ) : (
                <span className="text-sm text-muted">Текущий пояс не выбран</span>
              )}
              <button
                type="button"
                onClick={() => setIsBeltModalOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="Изменить текущий пояс"
                title="Изменить текущий пояс"
              >
                <PencilIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isBeltModalOpen && (
        <CurrentBeltModal
          clientInfoId={clientInfoId}
          currentBelt={liveBelt}
          availableBelts={availableBelts}
          onClose={() => setIsBeltModalOpen(false)}
        />
      )}
    </section>
  );
}

function CurrentBeltModal({
  clientInfoId,
  currentBelt,
  availableBelts,
  onClose,
}: {
  clientInfoId: string;
  currentBelt: Belt | null;
  availableBelts: Belt[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    changeCurrentClientBeltAction,
    undefined
  );

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  useEffect(() => {
    if (!state?.success) return;

    notifyBeltUpdated(state.belt ?? null);
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
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <h3 className="text-xl font-semibold tracking-[-0.025em]">Смена текущего пояса</h3>
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

        {state?.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="current-belt" className="text-sm font-medium text-foreground/80">
            Текущий пояс
          </label>
          <select
            id="current-belt"
            name="belt"
            defaultValue={currentBelt ?? ""}
            autoFocus
            className={inputClass}
          >
            <option value="">Без пояса</option>
            {availableBelts.map((availableBelt) => (
              <option key={availableBelt} value={availableBelt}>
                {BELT_LABELS[availableBelt]}
              </option>
            ))}
          </select>
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
