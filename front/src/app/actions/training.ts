"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, getSession } from "@/lib/auth";
import { createBackendTraining, updateBackendTraining, type BackendTraining, type BackendTrainingInput } from "@/lib/backend-auth";

export type FormState = { error?: string; success?: boolean; training?: BackendTraining } | undefined;

function readTrainingInput(formData: FormData): { error: string } | { input: BackendTrainingInput } {
  const groupId = String(formData.get("groupId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();

  if (!groupId) return { error: "Выберите группу" };
  if (description.length > 300) return { error: "Описание тренировки не должно превышать 300 символов" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { error: "Укажите корректные дату и время тренировки" };
  }
  if (`${date}T${endTime}:00` <= `${date}T${startTime}:00`) {
    return { error: "Время окончания должно быть позже времени начала" };
  }

  return {
    input: {
      groupId,
      description: description || null,
      startTime: `${date}T${startTime}:00`,
      endTime: `${date}T${endTime}:00`,
    },
  };
}

export async function createTrainingAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session || session.user.role !== "COACH") {
    return { error: "Доступ запрещён" };
  }

  const parsed = readTrainingInput(formData);
  if ("error" in parsed) return parsed;
  const repeatEveryWeek = formData.get("repeatEveryWeek") === "on";
  const result = await createBackendTraining(session.accessToken, { ...parsed.input, repeatEveryWeek });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/");
  return { success: true, training: result.training };
}

export async function updateTrainingAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session || session.user.role !== "COACH") {
    return { error: "Доступ запрещён" };
  }

  const trainingId = String(formData.get("trainingId") || "").trim();
  if (!trainingId) return { error: "Тренировка не указана" };

  const parsed = readTrainingInput(formData);
  if ("error" in parsed) return parsed;
  const result = await updateBackendTraining(session.accessToken, trainingId, parsed.input);
  if (!result.ok) return { error: result.error };

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
