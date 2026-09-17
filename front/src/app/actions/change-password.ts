"use server";

import { redirect } from "next/navigation";
import { destroySession, getSession } from "@/lib/auth";
import { changeBackendPassword } from "@/lib/backend-auth";

export type ChangePasswordState = { error?: string } | undefined;

export async function changePasswordAction(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (!currentPassword || newPassword.length < 8 || newPassword.length > 128) return { error: "Новый пароль должен содержать от 8 до 128 символов." };
  if (newPassword !== confirmPassword) return { error: "Пароли не совпадают." };
  const session = await getSession();
  if (!session) return { error: "Сессия истекла. Войдите снова." };
  const result = await changeBackendPassword(session.accessToken, currentPassword, newPassword);
  if (!result.ok) return { error: result.error };
  await destroySession();
  redirect("/login?password=changed");
}
