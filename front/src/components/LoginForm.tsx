"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}
      <input type="hidden" name="role" value="COACH" />
      <div className="flex flex-col gap-1">
        <label htmlFor="login" className={labelClass}>
          Логин
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
          Пароль
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </div>
      <SubmitButton>Войти</SubmitButton>
    </form>
  );
}
