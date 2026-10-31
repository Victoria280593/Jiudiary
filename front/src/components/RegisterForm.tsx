"use client";

import { useActionState, useState } from "react";
import { registerAction, type FormState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/PasswordInput";
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
        <label htmlFor="lastName" className={labelClass}>
          Фамилия
        </label>
        <input id="lastName" name="lastName" type="text" required maxLength={200} autoComplete="family-name" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="firstName" className={labelClass}>
          Имя
        </label>
        <input id="firstName" name="firstName" type="text" required maxLength={200} autoComplete="given-name" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="middleName" className={labelClass}>
          Отчество (необязательно)
        </label>
        <input id="middleName" name="middleName" type="text" maxLength={200} autoComplete="additional-name" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="login" className={labelClass}>
          Логин (не менее 12 символов)
        </label>
        <input
          id="login"
          name="login"
          type="text"
          required
          minLength={12}
          maxLength={256}
          autoComplete="username"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Пароль (не менее 8 символов)
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
        />
      </div>

      <SubmitButton>Зарегистрироваться</SubmitButton>
    </form>
  );
}
