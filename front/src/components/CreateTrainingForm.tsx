"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTrainingAction, type FormState } from "@/app/actions/training";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function CreateTrainingForm({
  defaultDateTime,
  idPrefix = "",
}: {
  /** Полное значение datetime-local, например "2026-07-20T09:00" */
  defaultDateTime?: string;
  /** Нужен, если на странице одновременно несколько экземпляров формы */
  idPrefix?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    createTrainingAction,
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}title`} className={labelClass}>
            Название
          </label>
          <input
            id={`${idPrefix}title`}
            name="title"
            type="text"
            required
            placeholder="Например, общая тренировка"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}date`} className={labelClass}>
            Дата и время
          </label>
          <input
            id={`${idPrefix}date`}
            name="date"
            type="datetime-local"
            required
            defaultValue={defaultDateTime}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}location`} className={labelClass}>
          Место (необязательно)
        </label>
        <input id={`${idPrefix}location`} name="location" type="text" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}notes`} className={labelClass}>
          Заметки (необязательно)
        </label>
        <textarea id={`${idPrefix}notes`} name="notes" rows={2} className={inputClass} />
      </div>
      <SubmitButton>Добавить тренировку</SubmitButton>
    </form>
  );
}
