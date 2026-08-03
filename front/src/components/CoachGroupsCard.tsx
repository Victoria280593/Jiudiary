"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { useGroups } from "@/components/GroupsProvider";
import { getGroupColors, type Group, type GroupColor } from "@/lib/groups-client";
import { getGroupColorStyle } from "@/lib/group-colors";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

function toTimeInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

function toApiTime(value: string) {
  return value ? `${value}:00` : null;
}

const colorLabels: Record<string, string> = {
  Red: "Красный",
  Blue: "Синий",
  Green: "Зелёный",
  Yellow: "Жёлтый",
  Purple: "Фиолетовый",
  Brown: "Коричневый",
};

const groupDialogClass = "fixed left-1/2 top-1/2 m-0 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[1.7rem] border border-white/70 bg-white p-0 text-foreground shadow-[0_28px_80px_-38px_rgba(86,61,38,0.65)] backdrop:bg-black/35";
const groupDialogHeaderClass = "flex items-start justify-between gap-4 px-6 pb-2 pt-6";
const groupDialogCloseButtonClass = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-3xl leading-none text-muted transition duration-200 hover:bg-surface-muted hover:text-foreground disabled:opacity-50";
const groupDialogFormClass = "flex flex-col gap-5 px-6 pb-6 pt-3";
const groupDialogTimeGridClass = "grid grid-cols-2 gap-3 rounded-[1.35rem] bg-surface-muted/55 p-3";
const groupDialogActionsClass = "flex justify-end gap-2 pt-1";
const timePickerHours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const timePickerMinutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

export function CoachGroupsCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const { groups, status, error: groupsError, addGroup, updateGroup, removeGroup } = useGroups();
  const [name, setName] = useState("");
  const [createColorId, setCreateColorId] = useState(6);
  const [createDefaultStartTime, setCreateDefaultStartTime] = useState("");
  const [createDefaultEndTime, setCreateDefaultEndTime] = useState("");
  const [error, setError] = useState<string>();
  const [mutationError, setMutationError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string>();
  const [editingGroup, setEditingGroup] = useState<Group>();
  const [editName, setEditName] = useState("");
  const [editColorId, setEditColorId] = useState(1);
  const [editDefaultStartTime, setEditDefaultStartTime] = useState("");
  const [editDefaultEndTime, setEditDefaultEndTime] = useState("");
  const [colors, setColors] = useState<GroupColor[]>([]);
  const [editError, setEditError] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string>();

  useEffect(() => {
    if (!openMenuGroupId) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-group-actions-menu="true"]')) return;

      setOpenMenuGroupId(undefined);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuGroupId]);

  function openModal() {
    setError(undefined);
    setName("");
    setCreateColorId(6);
    setCreateDefaultStartTime("");
    setCreateDefaultEndTime("");
    dialogRef.current?.showModal();

    if (colors.length === 0) {
      void getGroupColors()
        .then(setColors)
        .catch((loadError: unknown) => {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить цвета групп.");
        });
    }
  }

  function closeModal() {
    if (!isSubmitting) dialogRef.current?.close();
  }

  function openEditModal(group: Group) {
    setOpenMenuGroupId(undefined);
    setEditingGroup(group);
    setEditName(group.name);
    setEditColorId(group.colorId);
    setEditDefaultStartTime(toTimeInputValue(group.defaultStartTime));
    setEditDefaultEndTime(toTimeInputValue(group.defaultEndTime));
    setEditError(undefined);
    editDialogRef.current?.showModal();

    if (colors.length === 0) {
      void getGroupColors()
        .then(setColors)
        .catch((loadError: unknown) => {
          setEditError(loadError instanceof Error ? loadError.message : "Не удалось загрузить цвета групп.");
        });
    }
  }

  function closeEditModal() {
    if (!isEditing) editDialogRef.current?.close();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError("Укажите название группы.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, colorId: createColorId, defaultStartTime: toApiTime(createDefaultStartTime), defaultEndTime: toApiTime(createDefaultEndTime) }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось создать группу.");
        return;
      }

      const createdGroup = (await response.json()) as Partial<Group>;
      if (
        typeof createdGroup.id !== "string" ||
        typeof createdGroup.name !== "string" ||
        typeof createdGroup.colorId !== "number" ||
        typeof createdGroup.colorName !== "string" ||
        (createdGroup.defaultStartTime !== null && typeof createdGroup.defaultStartTime !== "string") ||
        (createdGroup.defaultEndTime !== null && typeof createdGroup.defaultEndTime !== "string")
      ) {
        setError("Сервер вернул некорректные данные созданной группы.");
        return;
      }

      addGroup({
        id: createdGroup.id,
        name: createdGroup.name,
        colorId: createdGroup.colorId,
        colorName: createdGroup.colorName,
        defaultStartTime: createdGroup.defaultStartTime ?? null,
        defaultEndTime: createdGroup.defaultEndTime ?? null,
      });
      dialogRef.current?.close();
      setName("");
      setCreateDefaultStartTime("");
      setCreateDefaultEndTime("");
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingGroup) return;

    const normalizedName = editName.trim();
    if (!normalizedName) {
      setEditError("Укажите название группы.");
      return;
    }

    setIsEditing(true);
    setEditError(undefined);

    try {
      const response = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingGroup.id, name: normalizedName, colorId: editColorId, defaultStartTime: toApiTime(editDefaultStartTime), defaultEndTime: toApiTime(editDefaultEndTime) }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setEditError(result?.error ?? "Не удалось отредактировать группу.");
        return;
      }

      const updated = (await response.json()) as Partial<Group>;
      if (
        typeof updated.id !== "string" ||
        typeof updated.name !== "string" ||
        typeof updated.colorId !== "number" ||
        typeof updated.colorName !== "string" ||
        (updated.defaultStartTime !== null && typeof updated.defaultStartTime !== "string") ||
        (updated.defaultEndTime !== null && typeof updated.defaultEndTime !== "string")
      ) {
        setEditError("Сервер вернул некорректные данные группы.");
        return;
      }

      updateGroup({
        id: updated.id,
        name: updated.name,
        colorId: updated.colorId,
        colorName: updated.colorName,
        defaultStartTime: updated.defaultStartTime ?? null,
        defaultEndTime: updated.defaultEndTime ?? null,
      });
      editDialogRef.current?.close();
    } catch {
      setEditError("Не удалось подключиться к серверу.");
    } finally {
      setIsEditing(false);
    }
  }

  async function handleDelete(group: Group) {
    setOpenMenuGroupId(undefined);
    setDeletingGroupId(group.id);
    setMutationError(undefined);

    try {
      const response = await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: group.id }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setMutationError(result?.error ?? "Не удалось удалить группу.");
        return;
      }

      removeGroup(group.id);
    } catch {
      setMutationError("Не удалось подключиться к серверу.");
    } finally {
      setDeletingGroupId(undefined);
    }
  }

  return (
    <Card title="Группы">
      {(mutationError || groupsError) && (
        <p className={`${errorClass} mb-4`}>{mutationError || groupsError}</p>
      )}

      {status === "idle" || status === "loading" ? (
        <div className="mb-4 rounded-lg border border-border bg-surface-muted/60 px-4 py-4 text-sm text-muted">
          Загрузка групп…
        </div>
      ) : groups.length > 0 ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const colorStyle = getGroupColorStyle(group.colorName);
            const menuIsOpen = openMenuGroupId === group.id;

            return (
              <article key={group.id} className="relative overflow-visible rounded-2xl border border-border/70 bg-white p-5 pl-6 shadow-[0_12px_30px_-24px_rgba(86,61,38,0.48)]">
                <span className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${colorStyle.dot}`} aria-hidden="true" />
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colorStyle.badge}`}>
                    <GroupIcon />
                  </span>
                  <div className="relative" data-group-actions-menu="true">
                    <button
                      type="button"
                      onClick={() => setOpenMenuGroupId(menuIsOpen ? undefined : group.id)}
                      aria-expanded={menuIsOpen}
                      aria-label={`Действия с группой ${group.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition duration-200 hover:bg-surface-muted hover:text-foreground"
                    >
                      <DotsIcon />
                    </button>
                    {menuIsOpen && (
                      <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-[0_18px_42px_-20px_rgba(86,61,38,0.45)]">
                        <button
                          type="button"
                          onClick={() => openEditModal(group)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-accent-soft hover:text-accent"
                        >
                          <PencilIcon />
                          Редактировать
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(group)}
                          disabled={deletingGroupId === group.id}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon />
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="mt-4 whitespace-normal break-words text-lg font-semibold leading-6 text-foreground">{group.name}</h3>
                <span className={`mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-full border px-3 py-1 text-xs font-semibold ${colorStyle.badge}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorStyle.dot}`} aria-hidden="true" />
                  {colorLabels[group.colorName] ?? group.colorName}
                </span>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface-muted/60 px-4 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GroupIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Групп пока нет</p>
            <p className="mt-0.5 text-xs text-muted">Создайте первую группу для своих учеников.</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <PlusIcon />
        Создать группу
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setError(undefined);
          setName("");
      setCreateDefaultStartTime("");
      setCreateDefaultEndTime("");
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className={groupDialogClass}
      >
        <div className={groupDialogHeaderClass}>
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.025em]">Новая группа</h3>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            aria-label="Закрыть"
            className={groupDialogCloseButtonClass}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={groupDialogFormClass}>
          {error && <p className={errorClass}>{error}</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="groupName" className={labelClass}>
              Название группы
            </label>
            <input
              id="groupName"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              autoFocus
              placeholder="Например, Взрослая группа"
              className={inputClass}
            />
          </div>


          <div className={groupDialogTimeGridClass}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="groupDefaultStartTime" className={labelClass}>
                Время начала
              </label>
              <GroupTimePicker
                id="groupDefaultStartTime"
                value={createDefaultStartTime}
                onChange={setCreateDefaultStartTime}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="groupDefaultEndTime" className={labelClass}>
                Время окончания
              </label>
              <GroupTimePicker
                id="groupDefaultEndTime"
                value={createDefaultEndTime}
                onChange={setCreateDefaultEndTime}
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2.5">
            <legend className={labelClass}>Цвет группы</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {colors.length === 0 && !error ? (
                <span className="text-sm text-muted">Загрузка цветов…</span>
              ) : (
                colors.map((color) => {
                  const style = getGroupColorStyle(color.name);
                  const selected = createColorId === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setCreateColorId(color.id)}
                      aria-pressed={selected}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition duration-200 ${
                        selected ? `${style.activeBadge} shadow-sm` : style.badge
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
                      {colorLabels[color.name] ?? color.name}
                    </button>
                  );
                })
              )}
            </div>
          </fieldset>

          <div className={groupDialogActionsClass}>
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-xl border border-border/70 bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || colors.length === 0}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(131,93,57,0.78)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Создание…" : "Создать"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={editDialogRef}
        onClose={() => {
          setEditingGroup(undefined);
          setEditError(undefined);
        }}
        onClick={(event) => {
          if (event.target === editDialogRef.current) closeEditModal();
        }}
        className={groupDialogClass}
      >
        <div className={groupDialogHeaderClass}>
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.025em]">Редактирование группы</h3>
          </div>
          <button
            type="button"
            onClick={closeEditModal}
            disabled={isEditing}
            aria-label="Закрыть"
            className={groupDialogCloseButtonClass}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className={groupDialogFormClass}>
          {editError && <p className={errorClass}>{editError}</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="editGroupName" className={labelClass}>Название группы</label>
            <input
              id="editGroupName"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </div>


          <div className={groupDialogTimeGridClass}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="editGroupDefaultStartTime" className={labelClass}>
                Время начала
              </label>
              <GroupTimePicker
                id="editGroupDefaultStartTime"
                value={editDefaultStartTime}
                onChange={setEditDefaultStartTime}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="editGroupDefaultEndTime" className={labelClass}>
                Время окончания
              </label>
              <GroupTimePicker
                id="editGroupDefaultEndTime"
                value={editDefaultEndTime}
                onChange={setEditDefaultEndTime}
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2.5">
            <legend className={labelClass}>Цвет группы</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {colors.length === 0 && !editError ? (
                <span className="text-sm text-muted">Загрузка цветов…</span>
              ) : (
                colors.map((color) => {
                  const style = getGroupColorStyle(color.name);
                  const selected = editColorId === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setEditColorId(color.id)}
                      aria-pressed={selected}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition duration-200 ${
                        selected ? `${style.activeBadge} shadow-sm` : style.badge
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
                      {colorLabels[color.name] ?? color.name}
                    </button>
                  );
                })
              )}
            </div>
          </fieldset>

          <div className={groupDialogActionsClass}>
            <button
              type="button"
              onClick={closeEditModal}
              disabled={isEditing}
              className="rounded-xl border border-border/70 bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isEditing || colors.length === 0}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(131,93,57,0.78)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </form>
      </dialog>
    </Card>
  );
}
function GroupTimePicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedHour = "", selectedMinute = ""] = value.split(":");

  const minuteOptions = useMemo(() => {
    if (!selectedMinute || timePickerMinutes.includes(selectedMinute)) {
      return timePickerMinutes;
    }

    return [...timePickerMinutes, selectedMinute].sort((first, second) => Number(first) - Number(second));
  }, [selectedMinute]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function selectHour(hour: string) {
    onChange(hour + ":" + (selectedMinute || "00"));
  }

  function selectMinute(minute: string) {
    onChange((selectedHour || "09") + ":" + minute);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-white px-4 text-left text-base font-semibold tabular-nums text-foreground shadow-[0_10px_24px_-22px_rgba(86,61,38,0.45)] transition duration-200 hover:border-accent/40 hover:bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <span>{value || "--:--"}</span>
        <ClockIcon />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-30 w-64 -translate-x-1/2 overflow-hidden rounded-[1.6rem] border border-border/60 bg-white shadow-[0_24px_60px_-28px_rgba(86,61,38,0.72)]">
          <div className="grid grid-cols-2 divide-x divide-border/70">
            <TimePickerColumn title="Часы" options={timePickerHours} selectedValue={selectedHour} onSelect={selectHour} />
            <TimePickerColumn title="Минуты" options={minuteOptions} selectedValue={selectedMinute} onSelect={selectMinute} />
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full bg-surface-muted/45 px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              Очистить время
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TimePickerColumn({ title, options, selectedValue, onSelect }: { title: string; options: string[]; selectedValue: string; onSelect: (value: string) => void }) {
  return (
    <div className="py-3">
      <div className="px-4 pb-2 text-center text-sm font-medium text-muted">{title}</div>
      <div className="max-h-64 overflow-y-auto px-2">
        {options.map((option) => {
          const isSelected = option === selectedValue;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={[
                "inline-flex min-h-10 w-full items-center justify-center rounded-xl text-lg tabular-nums transition duration-150",
                isSelected
                  ? "bg-accent text-white shadow-[0_10px_24px_-16px_rgba(131,93,57,0.7)]"
                  : "text-muted hover:bg-accent-soft hover:text-foreground"
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-muted" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2" />
    </svg>
  );
}
function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="7.5" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 10.5a2.5 2.5 0 0 1 0 5M19 19v-1a3 3 0 0 0-1.2-2.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" />
      <path strokeLinecap="round" d="m14.5 7.1 2.8 2.8" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}
