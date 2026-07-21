"use client";

import { useActionState, useRef } from "react";
import { changeUserBeltAction, type FormState } from "@/app/actions/admin";
import { BELT_LABELS } from "@/lib/belt";
import type { Belt } from "@prisma/client";

export function BeltSelectForm({
  userId,
  currentBelt,
  availableBelts,
}: {
  userId: string;
  currentBelt: Belt | null;
  availableBelts: Belt[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    changeUserBeltAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <select
          key={currentBelt}
          name="belt"
          defaultValue={currentBelt ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="" disabled>
            Выберите пояс
          </option>
          {availableBelts.map((belt) => (
            <option key={belt} value={belt}>
              {BELT_LABELS[belt]}
            </option>
          ))}
        </select>
      </form>
      {state?.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}
