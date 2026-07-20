"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ADULT_BELTS, KIDS_BELTS, calculateAge, isKidsAge } from "@/lib/belt";
import type { Belt, Role } from "@prisma/client";

export type FormState = { error?: string } | undefined;

const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "COACH", "STUDENT", "PARENT"];
const ALL_BELTS = new Set<Belt>([...KIDS_BELTS, ...ADULT_BELTS]);

export async function changeUserRoleAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { error: "Доступ запрещён" };
  }

  const userId = String(formData.get("userId") || "");
  const newRole = String(formData.get("role") || "") as Role;

  if (!userId || !ASSIGNABLE_ROLES.includes(newRole)) {
    return { error: "Некорректные данные" };
  }

  if (userId === admin.id) {
    return { error: "Нельзя изменить собственную роль" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "Пользователь не найден" };
  }

  if (target.role === newRole) {
    return undefined;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        coachId: newRole === "STUDENT" ? target.coachId : null,
      },
    });

    if (target.role === "STUDENT" && newRole !== "STUDENT") {
      await tx.parentChild.deleteMany({ where: { studentId: userId } });
    }
    if (target.role === "PARENT" && newRole !== "PARENT") {
      await tx.parentChild.deleteMany({ where: { parentId: userId } });
    }
  });

  revalidatePath("/dashboard/admin");
  return undefined;
}

export async function changeUserBeltAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { error: "Доступ запрещён" };
  }

  const userId = String(formData.get("userId") || "");
  const belt = String(formData.get("belt") || "") as Belt;

  if (!userId || !ALL_BELTS.has(belt)) {
    return { error: "Некорректные данные" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "Пользователь не найден" };
  }

  if (target.birthDate) {
    const age = calculateAge(target.birthDate);
    const allowed = isKidsAge(age) ? KIDS_BELTS : ADULT_BELTS;
    if (!allowed.includes(belt)) {
      return {
        error: isKidsAge(age)
          ? "Для указанного возраста доступны только детские пояса"
          : "Для указанного возраста доступны только взрослые пояса",
      };
    }
  }

  if (target.belt === belt) {
    return undefined;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      belt,
      stripes: belt === "BLACK" || belt === "BLACK_RED" || belt === "RED"
        ? null
        : target.stripes ?? 0,
      blackBeltDegree: belt === "BLACK" ? target.blackBeltDegree ?? 0 : null,
      blackBeltAwardedAt: belt === "BLACK" ? target.blackBeltAwardedAt : null,
      blackBeltProfessor: belt === "BLACK" ? target.blackBeltProfessor : null,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  return undefined;
}
