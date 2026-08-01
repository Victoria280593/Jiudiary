export type GroupColorStyle = {
  badge: string;
  activeBadge: string;
  dot: string;
  swatch: string;
};

const defaultStyle: GroupColorStyle = {
  badge: "border-[#dcc9b5] bg-[#f8f2eb] text-[#765233] hover:bg-[#f1e5d8]",
  activeBadge: "border-[#c6a17c] bg-[#ead9c8] text-[#684629] ring-2 ring-[#ead9c8]/70",
  dot: "bg-[#a9794d]",
  swatch: "bg-[#a9794d] ring-[#ddc7b0]",
};

const groupColorStyles: Record<string, GroupColorStyle> = {
  Brown: defaultStyle,
  Red: {
    badge: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    activeBadge: "border-red-300 bg-red-100 text-red-800 ring-2 ring-red-100",
    dot: "bg-red-500",
    swatch: "bg-red-500 ring-red-200",
  },
  Blue: {
    badge: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    activeBadge: "border-blue-300 bg-blue-100 text-blue-800 ring-2 ring-blue-100",
    dot: "bg-blue-500",
    swatch: "bg-blue-500 ring-blue-200",
  },
  Green: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    activeBadge: "border-emerald-300 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-100",
    dot: "bg-emerald-500",
    swatch: "bg-emerald-500 ring-emerald-200",
  },
  Yellow: {
    badge: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    activeBadge: "border-amber-300 bg-amber-100 text-amber-900 ring-2 ring-amber-100",
    dot: "bg-amber-500",
    swatch: "bg-amber-500 ring-amber-200",
  },
  Purple: {
    badge: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
    activeBadge: "border-purple-300 bg-purple-100 text-purple-800 ring-2 ring-purple-100",
    dot: "bg-purple-500",
    swatch: "bg-purple-500 ring-purple-200",
  },
};

export function getGroupColorStyle(colorName: string): GroupColorStyle {
  return groupColorStyles[colorName] ?? defaultStyle;
}
