"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { errorClass } from "@/lib/ui";

export function CoachStudentRequestActions({
  requestId,
  studentName,
  status,
}: {
  requestId: string;
  studentName: string;
  status: "Pending" | "Rejected";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  function closeModal() {
    if (!isSubmitting) dialogRef.current?.close();
  }

  async function resolve(status: "Accepted" | "Rejected") {
    setIsMenuOpen(false);
    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/trainers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось обработать заявку.");
        return;
      }

      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteRequest() {
    if (!window.confirm(`Удалить отклонённую заявку ученика «${studentName}»?`)) return;

    setIsMenuOpen(false);
    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/trainers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось удалить заявку.");
        return;
      }

      router.refresh();
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "Rejected") {
    return (
      <div ref={menuRef} className="relative self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          disabled={isSubmitting}
          aria-label={`Действия с заявкой ученика «${studentName}»`}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg tracking-[0.12em] text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
        >
          <span aria-hidden="true" className="-translate-y-1">…</span>
        </button>

        {isMenuOpen && (
          <div role="menu" className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-border/70 bg-white p-1.5 shadow-[0_18px_45px_-18px_rgba(43,36,29,0.42)]">
            <button
              type="button"
              role="menuitem"
              onClick={() => void resolve("Accepted")}
              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-foreground transition hover:bg-surface-muted"
            >
              Принять
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => void deleteRequest()}
              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft"
            >
              Удалить заявку
            </button>
          </div>
        )}

        {error && <p className="absolute right-0 top-11 z-10 w-64 rounded-lg bg-danger-soft p-2 text-xs text-danger shadow-sm">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
      >
        Рассмотреть
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30"
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">Заявка ученика</h2>
          <p className="mt-1 text-sm text-muted">{studentName} хочет присоединиться к вам.</p>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {error && <p className={errorClass}>{error}</p>}
          <p className="text-sm leading-6 text-muted">
            После принятия ученик появится в вашем списке, а вы — в списке его тренеров.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => void resolve("Rejected")}
              disabled={isSubmitting}
              className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger disabled:opacity-50"
            >
              Отклонить
            </button>
            <button
              type="button"
              onClick={() => void resolve("Accepted")}
              disabled={isSubmitting}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmitting ? "Сохранение…" : "Принять"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
