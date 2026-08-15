"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BackendStudentRequestStatus } from "@/lib/backend-auth";
import { errorClass } from "@/lib/ui";

export function StudentTrainerRequestButton({
  coachId,
  coachName,
  status,
}: {
  coachId: string;
  coachName: string;
  status?: BackendStudentRequestStatus;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const disabled = status === "Pending" || status === "Accepted";
  const label = status === "Pending"
    ? "Заявка отправлена"
    : status === "Accepted"
      ? "Вы присоединились"
      : status === "Rejected"
        ? "Отправить повторно"
        : "Присоединиться";

  function closeModal() {
    if (!isSubmitting) dialogRef.current?.close();
  }

  async function submitRequest() {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Не удалось отправить заявку.");
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

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => dialogRef.current?.showModal()}
        className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted"
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30"
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">Заявка тренеру</h2>
          <p className="mt-1 text-sm text-muted">Отправить заявку тренеру {coachName}?</p>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {error && <p className={errorClass}>{error}</p>}
          <p className="text-sm leading-6 text-muted">
            Тренер увидит заявку во вкладке «Ученики» и сможет принять или отклонить её.
          </p>
          <div className="flex justify-end gap-3">
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
              onClick={() => void submitRequest()}
              disabled={isSubmitting}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmitting ? "Отправка…" : "Отправить"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export function StudentRequestDeleteButton({
  requestId,
  coachName,
}: {
  requestId: string;
  coachName: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function deleteRequest() {
    if (!window.confirm(`Удалить заявку тренеру «${coachName}»?`)) return;

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

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void deleteRequest()}
        disabled={isSubmitting}
        className="rounded-lg px-2 py-1 text-xs font-medium text-danger transition hover:bg-danger-soft disabled:opacity-50"
      >
        {isSubmitting ? "Удаление…" : "Удалить"}
      </button>
      {error && <p className="max-w-52 text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
