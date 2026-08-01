export type GroupColorStyle = {
  badge: string;
  activeBadge: string;
  dot: string;
  swatch: string;
};

const defaultStyle: GroupColorStyle = {
  badge: "border-[#dcc9b5] bg-[#f8f2eb] text-[#765233] hover:bg-[#f1e5d8]",
  activeBadge: "border-[#b8875d] bg-[#e2c9b0] text-[#5f3d22] ring-2 ring-[#d8b995]/80",
  dot: "bg-[#a9794d]",
  swatch: "bg-[#a9794d] ring-[#ddc7b0]",
};

const groupColorStyles: Record<string, GroupColorStyle> = {
  Brown: defaultStyle,
  Red: {
    badge: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    activeBadge: "border-red-400 bg-red-200 text-red-900 ring-2 ring-red-200/80",
    dot: "bg-red-500",
    swatch: "bg-red-500 ring-red-200",
  },
  Blue: {
    badge: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    activeBadge: "border-blue-400 bg-blue-200 text-blue-900 ring-2 ring-blue-200/80",
    dot: "bg-blue-500",
    swatch: "bg-blue-500 ring-blue-200",
  },
  Green: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    activeBadge: "border-emerald-400 bg-emerald-200 text-emerald-900 ring-2 ring-emerald-200/80",
    dot: "bg-emerald-500",
    swatch: "bg-emerald-500 ring-emerald-200",
  },
  Yellow: {
    badge: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    activeBadge: "border-amber-400 bg-amber-200 text-amber-950 ring-2 ring-amber-200/80",
    dot: "bg-amber-500",
    swatch: "bg-amber-500 ring-amber-200",
  },
  Purple: {
    badge: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
    activeBadge: "border-purple-400 bg-purple-200 text-purple-900 ring-2 ring-purple-200/80",
    dot: "bg-purple-500",
    swatch: "bg-purple-500 ring-purple-200",
  },
};

export function getGroupColorStyle(colorName: string): GroupColorStyle {
  return groupColorStyles[colorName] ?? defaultStyle;
}
