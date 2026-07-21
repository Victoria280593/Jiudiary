"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  ADULT_BELTS,
  KIDS_BELTS,
  MAX_BLACK_BELT_DEGREE,
  MAX_STRIPES,
  calculateAge,
  isKidsAge,
} from "@/lib/belt";
import { getCountryList } from "@/lib/countries";
import type { Belt } from "@prisma/client";

export type FormState = { error?: string } | undefined;

const ALL_BELTS = new Set<Belt>([...KIDS_BELTS, ...ADULT_BELTS]);

export async function updateAthleteProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Доступ запрещён" };
  }

  const countryCode = String(formData.get("countryCode") || "").trim();
  const birthDateStr = String(formData.get("birthDate") || "").trim();
  const belt = String(formData.get("belt") || "").trim() as Belt;
  const stripesRaw = String(formData.get("stripes") || "").trim();
  const blackBeltDegreeRaw = String(formData.get("blackBeltDegree") || "").trim();
  const blackBeltAwardedAtStr = String(formData.get("blackBeltAwardedAt") || "").trim();
  const blackBeltProfessor = String(formData.get("blackBeltProfessor") || "").trim();

  if (countryCode) {
    const validCodes = new Set(getCountryList().map((c) => c.code));
    if (!validCodes.has(countryCode)) {
      return { error: "Некорректная страна" };
    }
  }

  let birthDate: Date | null = null;
  if (birthDateStr) {
    birthDate = new Date(birthDateStr);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      return { error: "Некорректная дата рождения" };
    }
  }

  if (!belt || !ALL_BELTS.has(belt)) {
    return { error: "Выберите пояс" };
  }

  if (birthDate) {
    const age = calculateAge(birthDate);
    const allowed = isKidsAge(age) ? KIDS_BELTS : ADULT_BELTS;
    if (!allowed.includes(belt)) {
      return {
        error: isKidsAge(age)
          ? "Для указанного возраста доступны только детские пояса"
          : "Для указанного возраста доступны только взрослые пояса",
      };
    }
  }

  let stripes: number | null = null;
  let blackBeltDegree: number | null = null;
  let blackBeltAwardedAt: Date | null = null;

  if (belt === "BLACK") {
    const degree = Number(blackBeltDegreeRaw);
    if (!Number.isInteger(degree) || degree < 0 || degree > MAX_BLACK_BELT_DEGREE) {
      return { error: `Степень чёрного пояса — число от 0 до ${MAX_BLACK_BELT_DEGREE}` };
    }
    blackBeltDegree = degree;

    if (blackBeltAwardedAtStr) {
      blackBeltAwardedAt = new Date(blackBeltAwardedAtStr);
      if (Number.isNaN(blackBeltAwardedAt.getTime()) || blackBeltAwardedAt > new Date()) {
        return { error: "Некорректная дата присвоения чёрного пояса" };
      }
    }
  } else {
    const s = Number(stripesRaw);
    if (!Number.isInteger(s) || s < 0 || s > MAX_STRIPES) {
      return { error: `Количество страйпов — число от 0 до ${MAX_STRIPES}` };
    }
    stripes = s;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      countryCode: countryCode || null,
      birthDate,
      belt,
      stripes,
      blackBeltDegree,
      blackBeltAwardedAt,
      blackBeltProfessor: belt === "BLACK" ? blackBeltProfessor || null : null,
    },
  });

  revalidatePath("/dashboard", "layout");
  return undefined;
}
