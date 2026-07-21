"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { loginWithBackend } from "@/lib/backend-auth";

export type FormState = { error?: string } | undefined;

export async function registerAction(): Promise<FormState> {
  return { error: "Регистрация временно отключена" };
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

  const result = await loginWithBackend(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  await createSession(result.session);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
