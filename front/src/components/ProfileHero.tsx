"use client";

import { Avatar } from "@/components/Avatar";
import { BeltBadge } from "@/components/BeltBadge";
import { useLiveBelt } from "@/components/LiveBelt";
import type { Belt } from "@prisma/client";

export function ProfileHero({
  name,
  roleLabel,
  avatarUrl,
  countryName,
  age,
  belt,
  stripes,
  blackBeltDegree,
}: {
  name: string;
  roleLabel: string;
  avatarUrl: string | null;
  countryName: string | null;
  age: number | null;
  belt: Belt | null;
  stripes: number | null;
  blackBeltDegree: number | null;
}) {
  const initialStripes = belt === "BLACK" ? blackBeltDegree ?? 0 : stripes ?? 0;
  const liveBelt = useLiveBelt(belt, initialStripes);

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

          <p className="mt-3 text-sm text-muted">
            {countryName ? `Гражданство: ${countryName}` : "Гражданство не указано"}
            {age !== null && ` · Возраст: ${age}`}
          </p>

          {liveBelt.belt && (
            <div className="mt-4 flex justify-center sm:justify-start">
              <BeltBadge belt={liveBelt.belt} stripes={liveBelt.stripes} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
