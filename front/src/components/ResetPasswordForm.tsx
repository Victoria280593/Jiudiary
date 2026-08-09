"use client";

import { useActionState } from "react";
import { resetPasswordAction, type FormState } from "@/app/actions/password-reset";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, labelClass } from "@/lib/ui";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    resetPasswordAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && <p className={errorClass}>{state.error}</p>}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Новый пароль
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Повторите пароль
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton>Сохранить новый пароль</SubmitButton>
    </form>
  );
}
