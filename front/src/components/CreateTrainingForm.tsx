"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTrainingAction, updateTrainingAction, type FormState } from "@/app/actions/training";
import { useGroups } from "@/components/GroupsProvider";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

function toTimeInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

function addMinutes(time: string, minutes: number) {
  const [hours = 0, currentMinutes = 0] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + currentMinutes + minutes;
  const nextHours = Math.floor(totalMinutes / 60) % 24;
  const nextMinutes = totalMinutes % 60;

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

export function CreateTrainingForm({
  defaultDateTime,
  idPrefix = "",
  training,
  onSaved,
}: {
  defaultDateTime?: string;
  idPrefix?: string;
  training?: {
    id: string;
    groupId: string;
    description: string | null;
    startTime: string;
    endTime: string;
  };
  onSaved?: (training: NonNullable<NonNullable<FormState>["training"]>) => void;
}) {
  const isEditing = Boolean(training);
  const [state, formAction] = useActionState<FormState, FormData>(
    isEditing ? updateTrainingAction : createTrainingAction,
    undefined
  );
  const { groups, status: groupsStatus, error: groupsError } = useGroups();
  const formRef = useRef<HTMLFormElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  const initialDateTime = training?.startTime ?? defaultDateTime;
  const [defaultDate = "", rawStartTime = "09:00"] = initialDateTime?.split("T") ?? [];
  const defaultStartTime = toTimeInputValue(rawStartTime) || "09:00";
  const defaultEndTime = training?.endTime
    ? toTimeInputValue(training.endTime.split("T")[1])
    : defaultStartTime
      ? addMinutes(defaultStartTime, 90)
      : "10:30";

  useEffect(() => {
    if (!state?.success) return;

    if (state.training) onSaved?.(state.training);
    if (!isEditing) formRef.current?.reset();
  }, [isEditing, onSaved, state]);

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
          defaultValue={training?.groupId ?? ""}
          onChange={(event) => {
            const selectedGroup = groups.find((group) => group.id === event.target.value);
            const groupStartTime = toTimeInputValue(selectedGroup?.defaultStartTime);
            const groupEndTime = toTimeInputValue(selectedGroup?.defaultEndTime);

            if (!groupStartTime || !groupEndTime) return;

            if (startTimeInputRef.current) startTimeInputRef.current.value = groupStartTime;
            if (endTimeInputRef.current) endTimeInputRef.current.value = groupEndTime;
          }}
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

      <input type="hidden" name="date" defaultValue={defaultDate} />
      {training && <input type="hidden" name="trainingId" value={training.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}startTime`} className={labelClass}>
            Время начала
          </label>
          <input
            ref={startTimeInputRef}
            id={`${idPrefix}startTime`}
            name="startTime"
            type="time"
            required
            defaultValue={defaultStartTime}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}endTime`} className={labelClass}>
            Время окончания
          </label>
          <input
            ref={endTimeInputRef}
            id={`${idPrefix}endTime`}
            name="endTime"
            type="time"
            required
            defaultValue={defaultEndTime}
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
          defaultValue={training?.description ?? ""}
          className={inputClass}
        />
      </div>

      <SubmitButton disabled={formIsUnavailable}>
        {isEditing ? "Сохранить изменения" : "Добавить тренировку"}
      </SubmitButton>
    </form>
  );
}

