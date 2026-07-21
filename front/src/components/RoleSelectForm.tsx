"use client";

import { useActionState, useRef } from "react";
import { changeUserRoleAction, type FormState } from "@/app/actions/admin";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Админ",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

export function RoleSelectForm({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: Role;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    changeUserRoleAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <select
          key={currentRole}
          name="role"
          defaultValue={currentRole}
          disabled={disabled}
          onChange={() => formRef.current?.requestSubmit()}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-muted disabled:text-muted"
        >
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </form>
      {state?.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}
