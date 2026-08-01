"use client";

import { useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { useGroups } from "@/components/GroupsProvider";
import { getGroupColors, type Group, type GroupColor } from "@/lib/groups-client";
import { getGroupColorStyle } from "@/lib/group-colors";
import { errorClass, inputClass, labelClass } from "@/lib/ui";

const colorLabels: Record<string, string> = {
  Red: "Красный",
  Blue: "Синий",
  Green: "Зелёный",
  Yellow: "Жёлтый",
  Purple: "Фиолетовый",
  Brown: "Коричневый",
};

export function CoachGroupsCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const { groups, status, error: groupsError, addGroup, updateGroup, removeGroup } = useGroups();
  const [name, setName] = useState("");
  const [createColorId, setCreateColorId] = useState(6);
  const [error, setError] = useState<string>();
  const [mutationError, setMutationError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string>();
  const [editingGroup, setEditingGroup] = useState<Group>();
  const [editName, setEditName] = useState("");
  const [editColorId, setEditColorId] = useState(1);
  const [colors, setColors] = useState<GroupColor[]>([]);
  const [editError, setEditError] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);

  function openModal() {
    setError(undefined);
    setName("");
    setCreateColorId(6);
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
    setEditingGroup(group);
    setEditName(group.name);
    setEditColorId(group.colorId);
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
        body: JSON.stringify({ name: normalizedName, colorId: createColorId }),
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
        typeof createdGroup.colorName !== "string"
      ) {
        setError("Сервер вернул некорректные данные созданной группы.");
        return;
      }

      addGroup({
        id: createdGroup.id,
        name: createdGroup.name,
        colorId: createdGroup.colorId,
        colorName: createdGroup.colorName,
      });
      dialogRef.current?.close();
      setName("");
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
        body: JSON.stringify({ id: editingGroup.id, name: normalizedName, colorId: editColorId }),
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
        typeof updated.colorName !== "string"
      ) {
        setEditError("Сервер вернул некорректные данные группы.");
        return;
      }

      updateGroup({
        id: updated.id,
        name: updated.name,
        colorId: updated.colorId,
        colorName: updated.colorName,
      });
      editDialogRef.current?.close();
    } catch {
      setEditError("Не удалось подключиться к серверу.");
    } finally {
      setIsEditing(false);
    }
  }

  async function handleDelete(group: Group) {
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
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-3 py-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${getGroupColorStyle(group.colorName).dot}`}>
                <GroupIcon />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{group.name}</p>
                <p className="text-xs text-muted">{colorLabels[group.colorName] ?? group.colorName}</p>
              </div>
              <button
                type="button"
                onClick={() => openEditModal(group)}
                aria-label={`Редактировать группу ${group.name}`}
                title="Редактировать группу"
                className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(group)}
                disabled={deletingGroupId === group.id}
                aria-label={`Удалить группу ${group.name}`}
                title="Удалить группу"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
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
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/45"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold">Новая группа</h3>
            <p className="mt-1 text-xs text-muted">Укажите название, которое увидят ученики.</p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            aria-label="Закрыть"
            className="rounded-md px-2 py-1 text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
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

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || colors.length === 0}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
        className="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/45"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold">Редактирование группы</h3>
            <p className="mt-1 text-xs text-muted">Измените название и цвет бейджа в календаре.</p>
          </div>
          <button
            type="button"
            onClick={closeEditModal}
            disabled={isEditing}
            aria-label="Закрыть"
            className="rounded-md px-2 py-1 text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="flex flex-col gap-5 p-5">
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

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={isEditing}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isEditing || colors.length === 0}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </form>
      </dialog>
    </Card>
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
