"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function createTrainingAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") {
    return { error: "Доступ запрещён" };
  }

  const title = String(formData.get("title") || "").trim();
  const dateStr = String(formData.get("date") || "");
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!title || !dateStr) {
    return { error: "Укажите название и дату тренировки" };
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { error: "Некорректная дата" };
  }

  await prisma.training.create({
    data: {
      coachId: user.id,
      title,
      date,
      location: location || null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/coach");
  return undefined;
}

export async function updateAttendanceAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") return;

  const trainingId = String(formData.get("trainingId") || "");
  const studentId = String(formData.get("studentId") || "");
  if (!trainingId || !studentId) return;

  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training || training.coachId !== user.id) return;

  const attendedRaw = String(formData.get("attended") || "");
  const comment = String(formData.get("comment") || "").trim();
  const attended = attendedRaw === "present" ? true : attendedRaw === "absent" ? false : null;

  await prisma.attendance.upsert({
    where: { trainingId_studentId: { trainingId, studentId } },
    update: { attended, comment: comment || null },
    create: { trainingId, studentId, attended, comment: comment || null },
  });

  revalidatePath(`/dashboard/coach/trainings/${trainingId}`);
}
