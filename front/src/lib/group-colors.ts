export type GroupColorStyle = {
  badge: string;
  activeBadge: string;
  dot: string;
  swatch: string;
};

const defaultStyle: GroupColorStyle = {
  badge: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  activeBadge: "border-red-600 bg-red-600 text-white",
  dot: "bg-red-500",
  swatch: "bg-red-500 ring-red-200",
};

const groupColorStyles: Record<string, GroupColorStyle> = {
  Red: defaultStyle,
  Blue: {
    badge: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    activeBadge: "border-blue-600 bg-blue-600 text-white",
    dot: "bg-blue-500",
    swatch: "bg-blue-500 ring-blue-200",
  },
  Green: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    activeBadge: "border-emerald-600 bg-emerald-600 text-white",
    dot: "bg-emerald-500",
    swatch: "bg-emerald-500 ring-emerald-200",
  },
  Yellow: {
    badge: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    activeBadge: "border-amber-500 bg-amber-500 text-white",
    dot: "bg-amber-500",
    swatch: "bg-amber-500 ring-amber-200",
  },
  Purple: {
    badge: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
    activeBadge: "border-purple-600 bg-purple-600 text-white",
    dot: "bg-purple-500",
    swatch: "bg-purple-500 ring-purple-200",
  },
};

export function getGroupColorStyle(colorName: string): GroupColorStyle {
  return groupColorStyles[colorName] ?? defaultStyle;
}
