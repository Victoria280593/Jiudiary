"use client";

import { useActionState, useEffect, useRef } from "react";
import { addAchievementAction, type FormState } from "@/app/actions/achievement";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function AchievementForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    addAchievementAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === undefined) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {state?.error && <p className={errorClass}>{state.error}</p>}
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Достижение
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          required
          placeholder="Например: 1 место — Чемпионат России по BJJ, 2024, категория до 70 кг"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1 sm:w-56">
        <label htmlFor="date" className={labelClass}>
          Дата турнира (необязательно)
        </label>
        <input
          id="date"
          name="date"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          className={inputClass}
        />
      </div>
      <SubmitButton>Добавить достижение</SubmitButton>
    </form>
  );
}
