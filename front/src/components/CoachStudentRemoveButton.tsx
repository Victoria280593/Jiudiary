"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { errorClass } from "@/lib/ui";

export function CoachStudentRemoveButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  function closeModal() {
    if (!isSubmitting) dialogRef.current?.close();
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
        onClick={() => dialogRef.current?.showModal()}
        className="shrink-0 rounded-xl bg-danger-soft px-3 py-2 text-xs font-semibold text-danger transition hover:opacity-80"
      >
        Удалить
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-border bg-white p-0 text-foreground shadow-[0_30px_80px_-28px_rgba(49,35,24,0.55)] backdrop:bg-black/30"
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">Удалить ученика?</h2>
          <p className="mt-1 text-sm text-muted">
            {studentName} будет удалён из вашего списка учеников.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {error && <p className={errorClass}>{error}</p>}
          <p className="text-sm leading-6 text-muted">
            После удаления ученик сможет снова отправить вам заявку.
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
              onClick={() => void removeStudent()}
              disabled={isSubmitting}
              className="rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Удаление…" : "Удалить"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
