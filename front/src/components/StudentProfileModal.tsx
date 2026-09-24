"use client";

import { useEffect, useId, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { BackendStudent } from "@/lib/backend-auth";

function formatStartDate(value: string | null) {
  if (!value) return "Пока не указано";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function StudentProfileModal({ student }: { student: BackendStudent }) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="shrink-0 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:border-accent/35 hover:bg-accent/[0.05]"
      >
        Открыть карточку
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={() => setIsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border/70 bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <Avatar src={null} name={student.name} size={64} />
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="truncate text-xl font-semibold tracking-[-0.025em] text-foreground">{student.name}</h2>
                <p className="mt-1 truncate text-sm text-muted">{student.login}</p>
                <span className="mt-3 inline-flex rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
                  {student.beltName ? `${student.beltName} пояс` : "Пояс не указан"}
                </span>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть карточку" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-muted transition hover:bg-surface-muted hover:text-foreground">×</button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-muted/70 p-4">
                <p className="text-2xl font-semibold text-foreground">{student.trainingsLast30Days}</p>
                <p className="mt-1 text-xs leading-5 text-muted">Тренировок за 30 дней</p>
              </div>
              <div className="rounded-2xl bg-surface-muted/70 p-4">
                <p className="text-2xl font-semibold text-foreground">{student.totalFights}</p>
                <p className="mt-1 text-xs leading-5 text-muted">Схваток всего</p>
              </div>
              <div className="rounded-2xl bg-surface-muted/70 p-4">
                <p className="text-2xl font-semibold text-foreground">{student.averageFightsPerTraining.toFixed(1)}</p>
                <p className="mt-1 text-xs leading-5 text-muted">Схваток за тренировку</p>
              </div>
              <div className="rounded-2xl bg-surface-muted/70 p-4">
                <p className="text-sm font-semibold leading-6 text-foreground">{formatStartDate(student.trainingStartedAt)}</p>
                <p className="mt-1 text-xs leading-5 text-muted">Начало занятий</p>
              </div>
            </div>

            {student.groups.length > 0 && (
              <div className="mt-5 border-t border-border/70 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Группы</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {student.groups.map((group) => <span key={group.id} className="rounded-lg border border-border bg-surface-muted px-2.5 py-1 text-xs text-muted">{group.name}</span>)}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
