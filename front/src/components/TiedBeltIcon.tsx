import { BELT_COLORS, BELT_LABELS } from "@/lib/belt";
import type { Belt } from "@prisma/client";

export function TiedBeltIcon({
  belt,
  stripes = 0,
  className = "",
  stretch = false,
}: {
  belt: Belt;
  stripes?: number;
  className?: string;
  stretch?: boolean;
}) {
  const colors = BELT_COLORS[belt];
  const secondary = colors.accent ?? colors.main;
  const rankColor = belt === "BLACK" || belt === "BLACK_RED" ? "#DC2626" : "#111827";
  const outline = belt === "WHITE" ? "#CBD5E1" : "rgba(15, 23, 42, 0.18)";
  const stripeCount = Math.max(0, Math.min(stripes, 4));

  return (
    <svg
      viewBox="0 0 120 64"
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      className={className}
      role="img"
      aria-label={`${BELT_LABELS[belt]} пояс`}
    >
      <path
        d="M5 21.5 45 20l4.5 12L5 33.5Z"
        fill={colors.main}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="m71 20 44 1.5v12L70.5 32Z"
        fill={secondary}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      <path
        d="m52 31 10 4-13 24-12-6Z"
        fill={colors.main}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="m68 31-10 4 13 24 12-6Z"
        fill={secondary}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      <path d="m37 53 12 6 4-7.5-12-6Z" fill={rankColor} />
      <path d="m67 51.5 4 7.5 12-6-4-7.5Z" fill={rankColor} />

      <path
        d="M60 11 77 24.5 60 40 43 24.5Z"
        fill={colors.main}
        stroke={outline}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {colors.accent && (
        <path
          d="M60 11 77 24.5 60 40Z"
          fill={secondary}
          opacity={belt === "BLACK_RED" ? 1 : 0.72}
        />
      )}
      <path
        d="M60 11 77 24.5 60 40 43 24.5Z"
        fill="none"
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {Array.from({ length: stripeCount }).map((_, index) => (
        <line
          key={index}
          x1={39.5 + index * 2.5}
          y1={50.2 + index * 1.25}
          x2={46.5 + index * 2.5}
          y2={53.7 + index * 1.25}
          stroke="#ffffff"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
