"use client";

import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CoachStudentActions } from "@/components/CoachStudentRemoveButton";
import type { BackendGroup, BackendStudent } from "@/lib/backend-auth";
import { BELT_BY_ID, BELT_COLORS } from "@/lib/belt";
import { getGroupColorStyle } from "@/lib/group-colors";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}

function getBeltBadgeStyle(beltId: number | null) {
  const belt = beltId === null ? null : BELT_BY_ID[beltId];
  if (!belt) {
    return {
      borderColor: "#d9cbbc",
      background: "#f8f4ef",
      color: "#756555",
    };
  }

  const colors = BELT_COLORS[belt];
  const accent = colors.accent ?? colors.main;
  return {
    borderColor: `${colors.main}55`,
    background: colors.pattern === "split"
      ? `linear-gradient(90deg, ${colors.main}1F 50%, ${accent}1F 50%)`
      : `linear-gradient(135deg, ${colors.main}20, ${accent}12)`,
    color: "#1f2937",
  };
}

export function CoachStudentCards({
  students,
  trainerGroups,
}: {
  students: BackendStudent[];
  trainerGroups: BackendGroup[] | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const [selectedStudent, setSelectedStudent] = useState<BackendStudent | null>(null);

  function openStudent(student: BackendStudent, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelectedStudent(student);
    dialogRef.current?.showModal();
  }

  function closeStudent() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setSelectedStudent(null);
    triggerRef.current?.focus();
  }

  return (
    <>
      <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
        {students.map((student) => (
          <li key={student.id} className="relative min-w-0 rounded-2xl border border-border/70 bg-white shadow-[0_12px_30px_-24px_rgba(66,45,27,0.45)] transition-shadow hover:shadow-[0_18px_38px_-24px_rgba(66,45,27,0.5)]">
            <button
              type="button"
              onClick={(event) => openStudent(student, event.currentTarget)}
              aria-haspopup="dialog"
              aria-label={`Открыть карточку ученика ${student.name}`}
              className="group flex min-h-44 w-full cursor-pointer flex-col rounded-2xl p-4 pr-16 text-left transition-colors hover:bg-surface-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:p-5 sm:pr-20"
            >
              <span className="flex min-w-0 items-center gap-3.5">
                <Avatar src={null} name={student.name} size={52} />
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-foreground">{student.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{student.login}</span>
                </span>
              </span>

              <span className="mt-4 flex flex-wrap">
                <span
                  className="whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold"
                  style={getBeltBadgeStyle(student.beltId)}
                >
                  Пояс: {student.beltName ?? "не указан"}
                </span>
              </span>

              {student.groups.length > 0 && (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {student.groups.map((group) => (
                    <span key={group.id} className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium ${getGroupColorStyle(group.colorName).badge}`}>
                      {group.name}
                    </span>
                  ))}
                </span>
              )}

              <span aria-hidden="true" className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_20px_-10px_rgba(168,112,62,0.8)] transition-colors group-hover:bg-accent-hover sm:right-5">
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 transition-transform group-hover:translate-x-0.5">
                  <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            <div className="absolute right-3 top-3 z-10">
              <CoachStudentActions
                studentId={student.id}
                studentName={student.name}
                groups={trainerGroups}
                assignedGroupIds={student.groups.map((group) => group.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={handleDialogClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeStudent();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(92vw,38rem)] overflow-y-auto rounded-3xl border border-border bg-white p-0 text-foreground shadow-[0_30px_90px_-28px_rgba(49,35,24,0.62)] backdrop:bg-black/35"
      >
        {selectedStudent && (
          <div>
            <header className="relative border-b border-border/70 bg-surface-muted/55 px-5 py-5 pr-16 sm:px-7 sm:py-6 sm:pr-20">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar src={null} name={selectedStudent.name} size={64} />
                <div className="min-w-0">
                  <h2 id={titleId} className="text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">
                    {selectedStudent.name}
                  </h2>
                  <p className="mt-1 [overflow-wrap:anywhere] text-sm text-muted">{selectedStudent.login}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeStudent}
                aria-label="Закрыть карточку ученика"
                autoFocus
                className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-5 sm:top-5"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="space-y-6 px-5 py-6 sm:px-7">
              <section aria-labelledby={`${titleId}-overview`}>
                <h3 id={`${titleId}-overview`} className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
                  Общая информация
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/70 bg-surface-muted/45 p-4">
                    <dt className="text-xs leading-5 text-muted">Пояс</dt>
                    <dd className="mt-1 text-base font-semibold text-foreground">{selectedStudent.beltName ?? "Не указан"}</dd>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-surface-muted/45 p-4">
                    <dt className="text-xs leading-5 text-muted">Начал заниматься</dt>
                    <dd className="mt-1 text-sm font-semibold leading-6 text-foreground">{formatDate(selectedStudent.startedAt)}</dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby={`${titleId}-activity`}>
                <h3 id={`${titleId}-activity`} className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
                  Активность
                </h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 p-4">
                    <dt className="text-xs leading-5 text-muted">Тренировок за 30 дней</dt>
                    <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{selectedStudent.trainingsLast30Days}</dd>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4">
                    <dt className="text-xs leading-5 text-muted">Всего схваток</dt>
                    <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{selectedStudent.totalFightsCount}</dd>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4">
                    <dt className="text-xs leading-5 text-muted">В среднем за тренировку</dt>
                    <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{formatAverage(selectedStudent.averageFightsPerTraining)}</dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby={`${titleId}-groups`}>
                <h3 id={`${titleId}-groups`} className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
                  Группы
                </h3>
                {selectedStudent.groups.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Ученик пока не добавлен ни в одну группу.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStudent.groups.map((group) => (
                      <span key={group.id} className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${getGroupColorStyle(group.colorName).badge}`}>
                        {group.name}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
