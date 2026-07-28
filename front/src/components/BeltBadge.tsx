import { TiedBeltIcon } from "@/components/TiedBeltIcon";
import { BELT_COLORS, BELT_LABELS } from "@/lib/belt";
import type { Belt } from "@prisma/client";

export function BeltBadge({
  belt,
}: {
  belt: Belt;
}) {
  const colors = BELT_COLORS[belt];
  const labelColor = belt === "WHITE" ? "#475569" : colors.main;
  const accent = colors.accent ?? colors.main;

  return (
    <div
      className="inline-flex items-center justify-center gap-2.5 rounded-full border px-3.5 py-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.07)] backdrop-blur-sm"
      style={{
        borderColor: `${colors.main}30`,
        background: `linear-gradient(135deg, ${colors.main}16, ${accent}0D)`,
      }}
    >
      <TiedBeltIcon belt={belt} className="h-8 w-14 shrink-0" />
      <span
        className="whitespace-nowrap text-sm font-semibold"
        style={{ color: labelColor }}
      >
        {BELT_LABELS[belt]} пояс
      </span>
    </div>
  );
}
