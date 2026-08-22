import type { Belt } from "@prisma/client";

export const BELT_BY_ID: Record<number, Belt> = {
  1: "WHITE",
  2: "GREY_WHITE",
  3: "GREY",
  4: "GREY_BLACK",
  5: "YELLOW_WHITE",
  6: "YELLOW",
  7: "YELLOW_BLACK",
  8: "ORANGE_WHITE",
  9: "ORANGE",
  10: "ORANGE_BLACK",
  11: "GREEN_WHITE",
  12: "GREEN",
  13: "GREEN_BLACK",
  14: "BLUE",
  15: "PURPLE",
  16: "BROWN",
  17: "BLACK",
  18: "BLACK_RED",
  19: "RED",
};

export const BELT_ID_BY_NAME = Object.fromEntries(
  Object.entries(BELT_BY_ID).map(([id, name]) => [name, Number(id)])
) as Record<Belt, number>;

export const BELT_LABELS: Record<Belt, string> = {
  WHITE: "Белый",
  GREY_WHITE: "Серо-белый",
  GREY: "Серый",
  GREY_BLACK: "Серо-чёрный",
  YELLOW_WHITE: "Жёлто-белый",
  YELLOW: "Жёлтый",
  YELLOW_BLACK: "Жёлто-чёрный",
  ORANGE_WHITE: "Оранжево-белый",
  ORANGE: "Оранжевый",
  ORANGE_BLACK: "Оранжево-чёрный",
  GREEN_WHITE: "Зелёно-белый",
  GREEN: "Зелёный",
  GREEN_BLACK: "Зелёно-чёрный",
  BLUE: "Синий",
  PURPLE: "Фиолетовый",
  BROWN: "Коричневый",
  BLACK: "Чёрный",
  BLACK_RED: "Чёрно-красный",
  RED: "Красный",
};

export type BeltColors = {
  main: string;
  accent?: string;
  textOnMain: string;
  // "split" — пояс поровну разделён на два цвета (чёрно-красный)
  pattern?: "split";
};

export const BELT_COLORS: Record<Belt, BeltColors> = {
  WHITE: { main: "#f4f4f2", textOnMain: "#1f2937" },
  GREY_WHITE: { main: "#9CA3AF", accent: "#f4f4f2", textOnMain: "#1f2937" },
  GREY: { main: "#6B7280", textOnMain: "#ffffff" },
  GREY_BLACK: { main: "#6B7280", accent: "#111827", textOnMain: "#ffffff" },
  YELLOW_WHITE: { main: "#FDE047", accent: "#f4f4f2", textOnMain: "#1f2937" },
  YELLOW: { main: "#EAB308", textOnMain: "#1f2937" },
  YELLOW_BLACK: { main: "#EAB308", accent: "#111827", textOnMain: "#1f2937" },
  ORANGE_WHITE: { main: "#FB923C", accent: "#f4f4f2", textOnMain: "#1f2937" },
  ORANGE: { main: "#F97316", textOnMain: "#ffffff" },
  ORANGE_BLACK: { main: "#F97316", accent: "#111827", textOnMain: "#ffffff" },
  GREEN_WHITE: { main: "#4ADE80", accent: "#f4f4f2", textOnMain: "#1f2937" },
  GREEN: { main: "#16A34A", textOnMain: "#ffffff" },
  GREEN_BLACK: { main: "#16A34A", accent: "#111827", textOnMain: "#ffffff" },
  BLUE: { main: "#2563EB", textOnMain: "#ffffff" },
  PURPLE: { main: "#7C3AED", textOnMain: "#ffffff" },
  BROWN: { main: "#78350F", textOnMain: "#ffffff" },
  BLACK: { main: "#111827", textOnMain: "#ffffff" },
  BLACK_RED: { main: "#111827", accent: "#DC2626", textOnMain: "#ffffff", pattern: "split" },
  RED: { main: "#DC2626", textOnMain: "#ffffff" },
};

// Детская система поясов IBJJF (до 16 лет): белый + 4 базовых цвета,
// каждый в трёх вариантах (цвет/белый, сплошной, цвет/чёрный).
export const KIDS_BELTS: Belt[] = [
  "WHITE",
  "GREY_WHITE",
  "GREY",
  "GREY_BLACK",
  "YELLOW_WHITE",
  "YELLOW",
  "YELLOW_BLACK",
  "ORANGE_WHITE",
  "ORANGE",
  "ORANGE_BLACK",
  "GREEN_WHITE",
  "GREEN",
  "GREEN_BLACK",
];

// Взрослая система поясов IBJJF (от 16 лет).
// BLACK_RED (коралловый, 7-я степень чёрного) и RED (9–10-я степень,
// грандмастер) — почётные пояса старших тренеров, присваиваются вручную.
export const ADULT_BELTS: Belt[] = [
  "WHITE",
  "BLUE",
  "PURPLE",
  "BROWN",
  "BLACK",
  "BLACK_RED",
  "RED",
];

export const ADULT_MIN_AGE = 16;
export const MAX_BLACK_BELT_DEGREE = 6;

export function calculateAge(birthDate: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    at.getMonth() > birthDate.getMonth() ||
    (at.getMonth() === birthDate.getMonth() && at.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

export function isKidsAge(age: number): boolean {
  return age < ADULT_MIN_AGE;
}

export function beltsForAge(age: number): Belt[] {
  return isKidsAge(age) ? KIDS_BELTS : ADULT_BELTS;
}
