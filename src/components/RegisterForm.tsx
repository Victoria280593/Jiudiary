"use client";

import { useActionState, useState } from "react";
import { registerAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

type Person = { id: string; name: string; email: string };

const ROLE_LABELS: Record<string, string> = {
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

export function RegisterForm({
  coaches,
  students,
}: {
  coaches: Person[];
  students: Person[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    registerAction,
    undefined
  );
  const [role, setRole] = useState<"COACH" | "STUDENT" | "PARENT">("STUDENT");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Имя
        </label>
        <input id="name" name="name" type="text" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>Роль</span>
        <div className="flex gap-2">
          {(Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>).map(
            (r) => (
              <label
                key={r}
                className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm transition-colors ${
                  role === r
                    ? "border-accent bg-accent-soft text-accent-foreground"
                    : "border-border text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r as typeof role)}
                  className="sr-only"
                />
                {ROLE_LABELS[r]}
              </label>
            )
          )}
        </div>
      </div>

      {role === "STUDENT" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="coachId" className={labelClass}>
            Тренер (необязательно)
          </label>
          <select id="coachId" name="coachId" className={inputClass}>
            <option value="">Не выбран</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          {coaches.length === 0 && (
            <p className="text-xs text-muted">
              Пока нет зарегистрированных тренеров — можно привязаться позже.
            </p>
          )}
        </div>
      )}

      {role === "PARENT" && (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>Дети (необязательно)</span>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
            {students.length === 0 && (
              <p className="text-xs text-muted">
                Пока нет зарегистрированных учеников — можно привязаться позже.
              </p>
            )}
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="studentIds" value={s.id} />
                {s.name} ({s.email})
              </label>
            ))}
          </div>
        </div>
      )}

      <SubmitButton>Зарегистрироваться</SubmitButton>
    </form>
  );
}
