"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

export type FormState = { error?: string; success?: string } | undefined;

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordResetAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Введите email" };
  }

  const genericSuccess = {
    success:
      "Если аккаунт с таким email существует, на него отправлено письмо со ссылкой для восстановления пароля.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Не раскрываем, существует ли аккаунт с таким email.
    return genericSuccess;
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password/${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error("Не удалось отправить письмо восстановления пароля:", err);
    return {
      error:
        "Не удалось отправить письмо. Проверьте настройки SMTP на сервере и попробуйте снова.",
    };
  }

  return genericSuccess;
}

export async function resetPasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) {
    return { error: "Некорректная ссылка восстановления пароля" };
  }
  if (!password || !confirmPassword) {
    return { error: "Заполните оба поля пароля" };
  }
  if (password.length < 6) {
    return { error: "Пароль должен быть не короче 6 символов" };
  }
  if (password !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return {
      error: "Ссылка недействительна или истекла. Запросите восстановление ещё раз.",
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  redirect("/login?reset=success");
}
