"use client";

import { Avatar } from "@/components/Avatar";
import { BeltBadge } from "@/components/BeltBadge";
import { useLiveBelt } from "@/components/LiveBelt";
import type { Belt } from "@prisma/client";

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
            <div className="mt-4 flex justify-center sm:justify-start">
              <BeltBadge belt={liveBelt} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
