import { BELT_COLORS } from "@/lib/belt";
import type { Belt as BeltType } from "@prisma/client";

const SIZES = {
  xs: { width: 36, height: 27 },
  sm: { width: 64, height: 46 },
  md: { width: 104, height: 74 },
  lg: { width: 160, height: 114 },
};

const VIEW_W = 120;
const VIEW_H = 100;

export function Belt({
  belt,
  stripes = 0,
  size = "md",
  className = "",
}: {
  belt: BeltType;
  stripes?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const colors = BELT_COLORS[belt];
  const { width, height } = SIZES[size];
  // Белый пояс сливается с белым фоном без обводки — обводим серым;
  // остальные пояса обводим белым, чтобы отделить узел/концы/наконечники друг от друга.
  const isWhiteBelt = belt === "WHITE";
  const edgeStroke = isWhiteBelt ? "#c9c9c6" : "#ffffff";
  const edgeStrokeWidth = isWhiteBelt ? 1.2 : 1.5;
  const isSplit = colors.pattern === "split" && colors.accent;
  const isStripe = colors.pattern === "stripe" && colors.accent;
  const rightColor = isSplit ? colors.accent! : colors.main;
  const tickCount = Math.max(0, Math.min(stripes, 4));

  const stripeTicks = (cx: number) =>
    Array.from({ length: tickCount }).map((_, i) => (
      <rect
        key={i}
        x={cx - 4}
        y={78 + i * 3}
        width={8}
        height={1.4}
        fill="#ffffff"
      />
    ));

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="пояс"
    >
      {/* пояс, обёрнутый вокруг пояса кимоно */}
      <rect x={0} y={26} width={60} height={14} fill={colors.main} stroke={edgeStroke} strokeWidth={edgeStrokeWidth} />
      <rect x={60} y={26} width={60} height={14} fill={rightColor} stroke={edgeStroke} strokeWidth={edgeStrokeWidth} />
      {isStripe && <rect x={0} y={31} width={VIEW_W} height={4} fill={colors.accent} />}

      {/* узел */}
      <polygon
        points="60,22 74,35 60,48 46,35"
        fill={colors.main}
        stroke={edgeStroke}
        strokeWidth={edgeStrokeWidth}
        strokeLinejoin="round"
      />
      {isSplit && (
        <polygon
          points="60,22 74,35 60,48"
          fill={rightColor}
          stroke={edgeStroke}
          strokeWidth={edgeStrokeWidth}
          strokeLinejoin="round"
        />
      )}
      <line x1={46} y1={35} x2={74} y2={35} stroke="rgba(0,0,0,0.18)" strokeWidth={1.5} />

      {/* свисающие концы, перекрещённые под узлом */}
      <polygon
        points="66,46 56,46 36,92 46,92"
        fill={colors.main}
        stroke={edgeStroke}
        strokeWidth={edgeStrokeWidth}
        strokeLinejoin="round"
      />
      <polygon
        points="54,46 64,46 84,92 74,92"
        fill={rightColor}
        stroke={edgeStroke}
        strokeWidth={edgeStrokeWidth}
        strokeLinejoin="round"
      />

      {/* чёрные наконечники со страйпами */}
      <polygon
        points="53,76 43,76 36,92 46,92"
        fill="#111827"
        stroke={edgeStroke}
        strokeWidth={edgeStrokeWidth}
        strokeLinejoin="round"
      />
      <polygon
        points="67,76 77,76 84,92 74,92"
        fill="#111827"
        stroke={edgeStroke}
        strokeWidth={edgeStrokeWidth}
        strokeLinejoin="round"
      />
      {stripeTicks(44)}
      {stripeTicks(76)}
    </svg>
  );
}
