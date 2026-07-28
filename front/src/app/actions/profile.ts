"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { updateBackendClientInfo } from "@/lib/backend-auth";
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

export type FormState = { error?: string; success?: boolean; belt?: Belt } | undefined;

const ALL_BELTS = new Set<Belt>([...KIDS_BELTS, ...ADULT_BELTS]);

const BELT_IDS: Record<Belt, number> = {
  WHITE: 1,
  GREY_WHITE: 2,
  GREY: 3,
  GREY_BLACK: 4,
  YELLOW_WHITE: 5,
  YELLOW: 6,
  YELLOW_BLACK: 7,
  ORANGE_WHITE: 8,
  ORANGE: 9,
  ORANGE_BLACK: 10,
  GREEN_WHITE: 11,
  GREEN: 12,
  GREEN_BLACK: 13,
  BLUE: 14,
  PURPLE: 15,
  BROWN: 16,
  BLACK: 17,
  BLACK_RED: 18,
  RED: 19,
};

export async function updateAthleteProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Доступ запрещён" };
  }

  const countryCode = "RU";
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

  const countryName = "Российская Федерация";

  const saved = await updateBackendClientInfo(session.accessToken, {
    country: countryName,
    birthDate: birthDateStr || null,
    beltId: BELT_IDS[belt],
    stripesCount: stripes ?? 0,
  });

  if (!saved) {
    return { error: "Не удалось сохранить спортивные данные на сервере" };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, belt };
}
