"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTrainingAction, type FormState } from "@/app/actions/training";
import { useGroups } from "@/components/GroupsProvider";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

export function CreateTrainingForm({
  defaultDateTime,
  idPrefix = "",
}: {
  defaultDateTime?: string;
  idPrefix?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createTrainingAction, undefined);
  const { groups, status: groupsStatus, error: groupsError } = useGroups();
  const formRef = useRef<HTMLFormElement>(null);
  const [defaultDate = "", defaultTime = "09:00"] = defaultDateTime?.split("T") ?? [];

  useEffect(() => {
    if (!state?.success) return;

    formRef.current?.reset();
  }, [state]);

  const groupsAreLoading = groupsStatus === "idle" || groupsStatus === "loading";
  const formIsUnavailable = groupsAreLoading || groupsStatus === "error" || groups.length === 0;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}
      {groupsError && <p className={errorClass}>{groupsError}</p>}
      {state?.success && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Тренировка добавлена.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}groupId`} className={labelClass}>
          Группа
        </label>
        <select
          id={`${idPrefix}groupId`}
          name="groupId"
          required
          disabled={groupsAreLoading || groupsStatus === "error"}
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            {groupsAreLoading ? "Загрузка групп…" : "Выберите группу"}
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {groupsStatus === "loaded" && groups.length === 0 && (
          <p className="text-xs text-muted">Сначала создайте хотя бы одну группу в профиле.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}date`} className={labelClass}>
            Дата
          </label>
          <input
            id={`${idPrefix}date`}
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}time`} className={labelClass}>
            Время
          </label>
          <input
            id={`${idPrefix}time`}
            name="time"
            type="time"
            required
            defaultValue={defaultTime}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}description`} className={labelClass}>
          Описание (до 300 символов)
        </label>
        <textarea
          id={`${idPrefix}description`}
          name="description"
          rows={3}
          maxLength={300}
          placeholder="Например, техника прохода гарда и учебные схватки"
          className={inputClass}
        />
      </div>

      <SubmitButton disabled={formIsUnavailable}>Добавить тренировку</SubmitButton>
    </form>
  );
}
