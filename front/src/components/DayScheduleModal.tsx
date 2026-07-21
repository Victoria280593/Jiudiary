"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreateTrainingForm } from "@/components/CreateTrainingForm";
import { formatTime } from "@/lib/format";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type DayTraining = { id: string; title: string; date: Date; coachName?: string };

export function DayScheduleModal({
  dateKey,
  trainings,
  onClose,
  linkBase = "/dashboard/coach/trainings",
  showCreateForm = true,
}: {
  dateKey: string;
  trainings: DayTraining[];
  onClose: () => void;
  linkBase?: string;
  showCreateForm?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedHour, setSelectedHour] = useState(trainings[0]?.date.getHours() ?? 9);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const trainingsByHour = useMemo(() => {
    const map = new Map<number, DayTraining[]>();
    for (const t of trainings) {
      const h = t.date.getHours();
      const list = map.get(h) ?? [];
      list.push(t);
      map.set(h, list);
    }
    return map;
  }, [trainings]);

  const dateLabel = useMemo(() => {
    const label = new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${dateKey}T00:00:00`));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [dateKey]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold">{dateLabel}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="rounded-md px-2 py-1 text-muted hover:bg-surface-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className={`overflow-y-auto ${showCreateForm ? "max-h-[45vh]" : "max-h-[70vh]"}`}>
        {HOURS.map((hour) => {
          const hourTrainings = trainingsByHour.get(hour) ?? [];
          const isSelected = hour === selectedHour;
          return (
            <div
              key={hour}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedHour(hour)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedHour(hour);
              }}
              className={`flex min-h-9 w-full items-start gap-3 border-b border-border/60 px-4 py-1.5 text-left text-sm transition-colors ${
                isSelected ? "bg-accent-soft" : "hover:bg-surface-muted"
              }`}
            >
              <span className="w-12 shrink-0 pt-0.5 text-xs text-muted">
                {String(hour).padStart(2, "0")}:00
              </span>
              <div className="flex flex-1 flex-col gap-1">
                {hourTrainings.map((t) => (
                  <Link
                    key={t.id}
                    href={`${linkBase}/${t.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground hover:bg-accent-hover"
                  >
                    <span className="font-medium">{formatTime(t.date)}</span> · {t.title}
                    {t.coachName && <span className="opacity-80"> · {t.coachName}</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateForm && (
        <div className="border-t border-border p-4">
          <p className="mb-2 text-xs text-muted">
            Новая тренировка на {String(selectedHour).padStart(2, "0")}:00 — кликните на
            строку часа выше, чтобы изменить время.
          </p>
          <CreateTrainingForm
            key={`${dateKey}-${selectedHour}`}
            idPrefix="modal-"
            defaultDateTime={`${dateKey}T${String(selectedHour).padStart(2, "0")}:00`}
          />
        </div>
      )}
    </dialog>
  );
}
