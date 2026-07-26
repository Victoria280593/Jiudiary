"use client";

import { useState } from "react";
import { DayScheduleModal } from "@/components/DayScheduleModal";
import { dateKey } from "@/lib/calendar";

export function AddTrainingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(67,91,219,0.85)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
        Добавить тренировку
      </button>

      {isOpen && (
        <DayScheduleModal
          dateKey={dateKey(new Date())}
          trainings={[]}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
