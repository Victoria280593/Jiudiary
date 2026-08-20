"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { BeltBadge } from "@/components/BeltBadge";
import { useLiveBelt } from "@/components/LiveBelt";
import type { Belt } from "@prisma/client";

const STRIPE_OPTIONS = [1, 2, 3, 4] as const;

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ProfileHero({
  name,
  roleLabel,
  avatarUrl,
  age,
  belt,
}: {
  name: string;
  roleLabel: string;
  avatarUrl: string | null;
  age: number | null;
  belt: Belt | null;
}) {
  const liveBelt = useLiveBelt(belt);
  const [beltReceivedDate, setBeltReceivedDate] = useState("");
  const [stripesCount, setStripesCount] = useState<number | null>(null);
  const [stripeReceivedDate, setStripeReceivedDate] = useState("");
  const todayValue = toDateInputValue(new Date());

  return (
    <section className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col items-center gap-5 px-5 py-6 text-center sm:flex-row sm:px-7 sm:py-7 sm:text-left">
        <div className="rounded-full border border-border bg-accent-soft p-1 shadow-sm">
          <Avatar src={avatarUrl} name={name} size={104} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
              {name}
            </h2>
            <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {roleLabel}
            </span>
          </div>

          {age !== null && <p className="mt-3 text-sm text-muted">Возраст: {age}</p>}

          {liveBelt && (
            <div className="mt-4 flex flex-col items-center gap-2 sm:items-start">
              <BeltBadge belt={liveBelt} />

              <label className="flex items-center gap-1.5 text-xs text-muted">
                Получен
                <input
                  type="date"
                  value={beltReceivedDate}
                  onChange={(event) => setBeltReceivedDate(event.target.value)}
                  max={todayValue}
                  className="rounded-md border border-border/70 bg-surface px-1.5 py-0.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Страйп</span>
                <div role="group" aria-label="Количество страйпов" className="flex gap-1">
                  {STRIPE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStripesCount((current) => (current === option ? null : option))}
                      aria-pressed={stripesCount === option}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem] font-semibold transition ${
                        stripesCount === option
                          ? "border-accent bg-accent text-white"
                          : "border-border/70 bg-surface text-muted hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-muted">
                Получен
                <input
                  type="date"
                  value={stripeReceivedDate}
                  onChange={(event) => setStripeReceivedDate(event.target.value)}
                  max={todayValue}
                  className="rounded-md border border-border/70 bg-surface px-1.5 py-0.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
