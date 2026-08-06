"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { loginWithBackend, registerWithBackend } from "@/lib/backend-auth";

export type FormState = { error?: string } | undefined;
type RegistrationRole = "COACH" | "STUDENT";

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "COACH") as RegistrationRole;

  if (!name || !email || password.length < 8 || !["COACH", "STUDENT"].includes(role)) {
    return { error: "Введите имя, email и пароль не короче 8 символов" };
  }

  const result = await registerWithBackend(email, name, password, role);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/login?registered=success");
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
