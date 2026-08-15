"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BackendGroup } from "@/lib/backend-auth";
import { getGroupColorStyle } from "@/lib/group-colors";
import { errorClass } from "@/lib/ui";

export function CoachStudentActions({
  studentId,
  studentName,
  groups,
  assignedGroupIds,
}: {
  studentId: string;
  studentName: string;
  groups: BackendGroup[] | null;
  assignedGroupIds: string[];
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const groupsDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(assignedGroupIds);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!isMenuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  function openGroupsDialog() {
    setSelectedGroupIds(assignedGroupIds);
    setError(undefined);
    setIsMenuOpen(false);
    groupsDialogRef.current?.showModal();
  }

  function openDeleteDialog() {
    setError(undefined);
    setIsMenuOpen(false);
    deleteDialogRef.current?.showModal();
  }

  function closeDialog(dialog: HTMLDialogElement | null) {
    if (!isSubmitting) dialog?.close();
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  }

  async function saveGroups() {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/trainers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, groupIds: selectedGroupIds }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось обновить группы ученика.");
        return;
      }

      groupsDialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeStudent() {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/trainers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось удалить ученика.");
        return;
      }

      deleteDialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div ref={menuRef} className="relative shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label={`Действия с учеником «${studentName}»`}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg tracking-[0.12em] text-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          <span aria-hidden="true" className="-translate-y-1">…</span>
        </button>

        {isMenuOpen && (
          <div role="menu" className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border border-border/70 bg-white p-1.5 shadow-[0_18px_45px_-18px_rgba(43,36,29,0.42)]">
            <button type="button" role="menuitem" onClick={openGroupsDialog} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm text-foreground transition hover:bg-surface-muted">
              Добавить в группу
            </button>
            <button type="button" role="menuitem" onClick={openDeleteDialog} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft">
              Удалить
            </button>
          </div>
        )}
      </div>

      <dialog ref={groupsDialogRef} className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">Группы ученика</h2>
          <p className="mt-1 text-sm text-muted">Выберите группы для {studentName}.</p>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {error && <p className={errorClass}>{error}</p>}
          {groups === null ? (
            <p className="text-sm text-danger">Не удалось загрузить группы тренера.</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted">Сначала создайте хотя бы одну группу.</p>
          ) : (
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
              {groups.map((group) => {
                const selected = selectedGroupIds.includes(group.id);
                const colorStyle = getGroupColorStyle(group.colorName);
                return (
                  <label key={group.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${selected ? colorStyle.activeBadge : "border-border bg-white hover:bg-surface-muted"}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleGroup(group.id)} className="h-4 w-4 accent-accent" />
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorStyle.dot}`} aria-hidden="true" />
                    <span className="min-w-0 truncate text-sm font-medium">{group.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => closeDialog(groupsDialogRef.current)} disabled={isSubmitting} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted disabled:opacity-50">
              Закрыть
            </button>
            <button type="button" onClick={() => void saveGroups()} disabled={isSubmitting || groups === null} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60">
              {isSubmitting ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={deleteDialogRef} className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">Удалить ученика?</h2>
          <p className="mt-1 text-sm text-muted">{studentName} будет удалён из вашего списка учеников.</p>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {error && <p className={errorClass}>{error}</p>}
          <p className="text-sm leading-6 text-muted">После удаления ученик сможет снова отправить вам заявку.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => closeDialog(deleteDialogRef.current)} disabled={isSubmitting} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted disabled:opacity-50">
              Закрыть
            </button>
            <button type="button" onClick={() => void removeStudent()} disabled={isSubmitting} className="rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? "Удаление…" : "Удалить"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
