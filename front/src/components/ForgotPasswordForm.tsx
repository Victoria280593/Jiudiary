"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type FormState } from "@/app/actions/password-reset";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass, successClass } from "@/lib/ui";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    undefined
  );

  if (state?.success) {
    return <p className={successClass}>{state.success}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}
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
      <SubmitButton>Отправить ссылку для восстановления</SubmitButton>
    </form>
  );
}
