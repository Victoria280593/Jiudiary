"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  changeBackendClientBelt,
  getBackendClientInfo,
  updateBackendClientInfo,
} from "@/lib/backend-auth";
import {
  ADULT_BELTS,
  KIDS_BELTS,
  MAX_BLACK_BELT_DEGREE,
  BELT_ID_BY_NAME,
  calculateAge,
  isKidsAge,
} from "@/lib/belt";
import type { Belt } from "@prisma/client";

export type FormState = { error?: string; success?: boolean; belt?: Belt | null } | undefined;

const ALL_BELTS = new Set<Belt>([...KIDS_BELTS, ...ADULT_BELTS]);

export async function updateAthleteProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Доступ запрещён" };
  }

  const birthDateStr = String(formData.get("birthDate") || "").trim();
  const beltValue = String(formData.get("belt") || "").trim();
  const belt = beltValue ? (beltValue as Belt) : null;
  const blackBeltDegreeRaw = String(formData.get("blackBeltDegree") || "").trim();
  const blackBeltAwardedAtStr = String(formData.get("blackBeltAwardedAt") || "").trim();
  const blackBeltProfessor = String(formData.get("blackBeltProfessor") || "").trim();

  let birthDate: Date | null = null;
  if (birthDateStr) {
    birthDate = new Date(birthDateStr);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      return { error: "Некорректная дата рождения" };
    }
  }

  if (belt && !ALL_BELTS.has(belt)) {
    return { error: "Некорректный пояс" };
  }

  if (birthDate) {
    const age = calculateAge(birthDate);
    const allowed = isKidsAge(age) ? KIDS_BELTS : ADULT_BELTS;
    if (belt && !allowed.includes(belt)) {
      return {
        error: isKidsAge(age)
          ? "Для указанного возраста доступны только детские пояса"
          : "Для указанного возраста доступны только взрослые пояса",
      };
    }
  }

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
  }

  const currentClientInfo = await getBackendClientInfo(session.accessToken);
  if (!currentClientInfo) {
    return { error: "Не удалось получить данные профиля с сервера" };
  }

  const saved = await updateBackendClientInfo(session.accessToken, {
    firstName: currentClientInfo.firstName,
    lastName: currentClientInfo.lastName,
    middleName: currentClientInfo.middleName,
    birthDate: birthDateStr || null,
    beltId: belt ? BELT_ID_BY_NAME[belt] : null,
  });

  if (!saved) {
    return { error: "Не удалось сохранить спортивные данные на сервере" };
  }

  return { success: true, belt };
}

export async function changeClientBeltAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Доступ запрещён" };
  }

  const clientInfoId = String(formData.get("clientInfoId") || "");
  const belt = String(formData.get("belt") || "") as Belt;
  const receivedDate = String(formData.get("receivedDate") || "").trim();
  const stripesCount = Number(formData.get("stripesCount"));

  if (!clientInfoId || !ALL_BELTS.has(belt)) {
    return { error: "Выберите пояс" };
  }

  if (!Number.isInteger(stripesCount) || stripesCount < 0) {
    return { error: "Количество страйпов должно быть целым неотрицательным числом" };
  }

  if (receivedDate) {
    const parsedDate = new Date(`${receivedDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      return { error: "Некорректная дата получения пояса" };
    }
  }

  const result = await changeBackendClientBelt(session.accessToken, clientInfoId, {
    beltId: BELT_ID_BY_NAME[belt],
    receivedDate: receivedDate || null,
    stripesCount,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/profile");
  return { success: true, belt };
}
