import { BELT_COLORS, BELT_LABELS } from "@/lib/belt";
import type { Belt as BeltType } from "@prisma/client";

const SIZES = {
  xs: { width: 39, height: 29 },
  sm: { width: 68, height: 50 },
  md: { width: 108, height: 79 },
  lg: { width: 164, height: 120 },
};

export function Belt({
  belt,
  size = "md",
  className = "",
}: {
  belt: BeltType;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const colors = BELT_COLORS[belt];
  const { width, height } = SIZES[size];
  const isWhiteBelt = belt === "WHITE";
  const outline = isWhiteBelt ? "#bcc3cf" : "rgba(255,255,255,0.9)";
  const secondaryColor =
    colors.pattern === "split" && colors.accent ? colors.accent : colors.main;

  return (
    <svg
      viewBox="0 0 120 88"
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={`${BELT_LABELS[belt]} пояс`}
    >
      {/* Замкнутая часть пояса — как пояс вокруг талии. */}
      <ellipse
        cx="60"
        cy="35"
        rx="47"
        ry="22"
        fill="none"
        stroke={colors.main}
        strokeWidth="11"
      />
      <path
        d="M60 13c26 0 47 10 47 22S86 57 60 57"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="11"
      />
      <ellipse
        cx="60"
        cy="35"
        rx="47"
        ry="22"
        fill="none"
        stroke={outline}
        strokeWidth="1.2"
      />

      {/* Узел и два коротких конца находятся впереди кольца. */}
      <polygon
        points="60,45 72,55 60,65 48,55"
        fill={colors.main}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon
        points="60,45 72,55 60,65"
        fill={secondaryColor}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon
        points="55,61 63,64 51,86 42,82"
        fill={colors.main}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon
        points="65,61 57,64 69,86 78,82"
        fill={secondaryColor}
        stroke={outline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon points="46,75 55,78 51,86 42,82" fill="#111827" />
      <polygon points="65,78 74,75 78,82 69,86" fill="#111827" />

    </svg>
  );
}
