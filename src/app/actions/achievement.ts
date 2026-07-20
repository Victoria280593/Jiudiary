"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function addAchievementAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Доступ запрещён" };
  }

  const description = String(formData.get("description") || "").trim();
  const dateStr = String(formData.get("date") || "").trim();

  if (!description) {
    return { error: "Опишите достижение" };
  }
  if (description.length > 500) {
    return { error: "Слишком длинное описание (максимум 500 символов)" };
  }

  let date: Date | null = null;
  if (dateStr) {
    date = new Date(dateStr);
    if (Number.isNaN(date.getTime()) || date > new Date()) {
      return { error: "Некорректная дата турнира" };
    }
  }

  await prisma.achievement.create({
    data: { userId: user.id, description, date },
  });

  revalidatePath("/dashboard/profile");
  return undefined;
}

export async function deleteAchievementAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.achievement.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/profile");
}
