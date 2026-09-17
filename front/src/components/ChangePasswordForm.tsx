"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/app/actions/change-password";
import { inputClass, labelClass } from "@/lib/ui";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, undefined);
  return <form action={action} className="flex max-w-xl flex-col gap-4">
    <p className="text-sm text-muted">После смены пароля все остальные сессии будут завершены.</p>
    {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
    <label className={labelClass} htmlFor="currentPassword">Текущий пароль</label>
    <input className={inputClass} id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
    <label className={labelClass} htmlFor="newPassword">Новый пароль (не менее 8 символов)</label>
    <input className={inputClass} id="newPassword" name="newPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required />
    <label className={labelClass} htmlFor="confirmPassword">Повторите новый пароль</label>
    <input className={inputClass} id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required />
    <button className="rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Сохраняем…" : "Изменить пароль"}</button>
  </form>;
}
