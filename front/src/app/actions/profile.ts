"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  changeBackendCurrentBelt,
  createBackendClientBelt,
  updateBackendClientBelt,
} from "@/lib/backend-auth";
import { ADULT_BELTS, BELT_ID_BY_NAME, KIDS_BELTS } from "@/lib/belt";
import type { Belt } from "@prisma/client";

export type FormState = { error?: string; success?: boolean; belt?: Belt | null } | undefined;

const ALL_BELTS = new Set<Belt>([...KIDS_BELTS, ...ADULT_BELTS]);

export async function saveStoredClientBeltAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Доступ запрещён" };
  }

  const clientInfoId = String(formData.get("clientInfoId") || "");
  const clientBeltId = String(formData.get("clientBeltId") || "");
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

  const input = {
    beltId: BELT_ID_BY_NAME[belt],
    receivedDate: receivedDate || null,
    stripesCount,
  };
  const result = clientBeltId
    ? await updateBackendClientBelt(session.accessToken, clientInfoId, clientBeltId, input)
    : await createBackendClientBelt(session.accessToken, clientInfoId, input);

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function changeCurrentClientBeltAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Доступ запрещён" };
  }

  const clientInfoId = String(formData.get("clientInfoId") || "");
  const beltValue = String(formData.get("belt") || "");
  const belt = beltValue ? (beltValue as Belt) : null;

  if (!clientInfoId || (belt && !ALL_BELTS.has(belt))) {
    return { error: "Некорректный пояс" };
  }

  const result = await changeBackendCurrentBelt(
    session.accessToken,
    clientInfoId,
    belt ? BELT_ID_BY_NAME[belt] : null
  );

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/profile");
  return { success: true, belt };
}
