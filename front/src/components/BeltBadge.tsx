import { TiedBeltIcon } from "@/components/TiedBeltIcon";
import { BELT_COLORS, BELT_LABELS } from "@/lib/belt";
import type { Belt } from "@prisma/client";

export function BeltBadge({
  belt,
  stripes,
}: {
  belt: Belt;
  stripes: number;
}) {
  const colors = BELT_COLORS[belt];
  const labelColor = belt === "WHITE" ? "#475569" : colors.main;
  const accent = colors.accent ?? colors.main;

  return (
    <div
      className="inline-flex w-full max-w-72 items-center justify-start gap-4 rounded-full border px-5 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.07)] backdrop-blur-sm"
      style={{
        borderColor: `${colors.main}30`,
        background: `linear-gradient(135deg, ${colors.main}16, ${accent}0D)`,
      }}
    >
      <TiedBeltIcon belt={belt} stripes={stripes} className="h-12 w-24 shrink-0" />
      <span
        className="whitespace-nowrap text-base font-semibold"
        style={{ color: labelColor }}
      >
        {BELT_LABELS[belt]} пояс
      </span>
    </div>
  );
}
