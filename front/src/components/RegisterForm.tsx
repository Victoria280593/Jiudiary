"use client";

import { useActionState, useState } from "react";
import { registerAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function RegisterForm() {
  const [role, setRole] = useState<"COACH" | "STUDENT">("COACH");
  const [state, formAction] = useActionState<FormState, FormData>(
    registerAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}

      <div className="flex flex-col gap-1">
        <span className={labelClass}>Роль</span>
        <div className="relative grid grid-cols-2 rounded-xl bg-surface-muted p-1">
          <span
            aria-hidden="true"
            className={`absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-lg bg-surface shadow-sm transition-transform duration-300 ease-out ${
              role === "STUDENT" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          {([
            ["COACH", "Тренер"],
            ["STUDENT", "Ученик"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              aria-pressed={role === value}
              className={`relative z-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 ${
                role === value ? "text-foreground" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

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
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <SubmitButton>Зарегистрироваться</SubmitButton>
    </form>
  );
}
