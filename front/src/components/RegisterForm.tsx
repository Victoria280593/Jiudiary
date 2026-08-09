"use client";

import { useActionState } from "react";
import { registerAction, type FormState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function RegisterForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    registerAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}

      <input type="hidden" name="role" value="COACH" />

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
