"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import type { Role } from "@prisma/client";

export type FormState = { error?: string } | undefined;

const ROLES: Role[] = ["COACH", "STUDENT", "PARENT"];

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as Role;
  const coachId = String(formData.get("coachId") || "") || undefined;
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);

  if (!name || !email || !password || !role) {
    return { error: "Заполните все обязательные поля" };
  }
  if (!ROLES.includes(role)) {
    return { error: "Некорректная роль" };
  }
  if (password.length < 6) {
    return { error: "Пароль должен быть не короче 6 символов" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Пользователь с таким email уже зарегистрирован" };
  }

  if (role === "STUDENT" && coachId) {
    const coach = await prisma.user.findUnique({ where: { id: coachId } });
    if (!coach || coach.role !== "COACH") {
      return { error: "Выбранный тренер не найден" };
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      coachId: role === "STUDENT" ? coachId : undefined,
    },
  });

  if (role === "PARENT" && studentIds.length > 0) {
    const validStudents = await prisma.user.findMany({
      where: { id: { in: studentIds }, role: "STUDENT" },
      select: { id: true },
    });
    if (validStudents.length > 0) {
      await prisma.parentChild.createMany({
        data: validStudents.map((s) => ({ parentId: user.id, studentId: s.id })),
      });
    }
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Неверный email или пароль" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Неверный email или пароль" };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
