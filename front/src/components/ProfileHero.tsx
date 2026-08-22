"use client";

import { useActionState, useEffect, useState } from "react";
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
  const router = useRouter();
  const liveBelt = useLiveBelt(belt);
  const [isEditingBelt, setIsEditingBelt] = useState(false);
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    changeCurrentClientBeltAction,
    undefined
  );
  const availableBelts = age === null
    ? (Object.keys(BELT_LABELS) as Belt[])
    : beltsForAge(age);

  useEffect(() => {
    if (!state?.success) return;

    notifyBeltUpdated(state.belt ?? null);
    router.refresh();
    const closeEditorTimeout = window.setTimeout(() => setIsEditingBelt(false), 0);
    return () => window.clearTimeout(closeEditorTimeout);
  }, [router, state]);

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
                onClick={() => setIsEditingBelt((value) => !value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="Изменить текущий пояс"
                title="Изменить текущий пояс"
              >
                <PencilIcon />
              </button>
            </div>

            {isEditingBelt && (
              <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input type="hidden" name="clientInfoId" value={clientInfoId} />
                <select name="belt" defaultValue={liveBelt ?? ""} className={inputClass}>
                  <option value="">Без пояса</option>
                  {availableBelts.map((availableBelt) => (
                    <option key={availableBelt} value={availableBelt}>
                      {BELT_LABELS[availableBelt]}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
                  >
                    {isPending ? "Сохраняем…" : "Сохранить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBelt(false)}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground"
                  >
                    Отмена
                  </button>
                </div>
                {state?.error && <p className="text-xs text-danger">{state.error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.2 5.2 3.6 3.6M6 18l2.1-4.9L16.8 4.4a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-8.7 8.7L6 18Zm0 0 4.1-1" />
    </svg>
  );
}
