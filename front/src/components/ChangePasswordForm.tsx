"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/app/actions/change-password";
import { inputClass, labelClass } from "@/lib/ui";
export function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, undefined);
  useEffect(() => { if (isOpen && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, [isOpen]);
  function close() { if (!pending) { dialogRef.current?.close(); setIsOpen(false); } }
  return <>
    <button type="button" onClick={() => setIsOpen(true)} className="rounded-xl border border-accent/35 bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-foreground transition hover:border-accent/60">Сменить пароль</button>
    {isOpen && <dialog ref={dialogRef} onClose={() => setIsOpen(false)} onCancel={(event) => { if (pending) event.preventDefault(); }} onClick={(event) => { if (event.target === dialogRef.current) close(); }} className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30 backdrop:backdrop-blur-[2px]">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4"><h3 className="text-xl font-semibold">Смена пароля</h3><button type="button" onClick={close} disabled={pending} className="text-2xl text-muted" aria-label="Закрыть">×</button></div>
      <form action={action} className="flex flex-col gap-4 px-5 py-5"><p className="text-sm text-muted">После смены пароля все остальные сессии будут завершены.</p>{state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}<label className={labelClass} htmlFor="currentPassword">Текущий пароль</label><input className={inputClass} id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /><label className={labelClass} htmlFor="newPassword">Новый пароль (не менее 8 символов)</label><input className={inputClass} id="newPassword" name="newPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /><label className={labelClass} htmlFor="confirmPassword">Повторите новый пароль</label><input className={inputClass} id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /><div className="flex justify-end gap-3"><button type="button" onClick={close} disabled={pending} className="rounded-xl border border-border px-4 py-2.5">Отмена</button><button className="rounded-xl bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Сохраняем…" : "Изменить пароль"}</button></div></form>
    </dialog>}
  </>;
}
