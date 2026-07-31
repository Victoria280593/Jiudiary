"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, getSession } from "@/lib/auth";
import { createBackendTraining, type BackendTraining } from "@/lib/backend-auth";

export type FormState = { error?: string; success?: boolean; training?: BackendTraining } | undefined;

export async function createTrainingAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session || session.user.role !== "COACH") {
    return { error: "Доступ запрещён" };
  }

  const groupId = String(formData.get("groupId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const time = String(formData.get("time") || "").trim();

  if (!groupId) {
    return { error: "Выберите группу" };
  }

  if (description.length > 300) {
    return { error: "Описание тренировки не должно превышать 300 символов" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Укажите корректные дату и время тренировки" };
  }

  const result = await createBackendTraining(session.accessToken, {
    groupId,
    description: description || null,
    time: `${date}T${time}:00`,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/");
  return { success: true, training: result.training };
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
