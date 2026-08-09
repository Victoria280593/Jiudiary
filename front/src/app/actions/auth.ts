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
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const middleName = String(formData.get("middleName") || "").trim();
  const login = String(formData.get("login") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "COACH") as RegistrationRole;

  if (!firstName || !lastName || login.length < 12 || password.length < 8 || !["COACH", "STUDENT"].includes(role)) {
    return { error: "Введите имя, фамилию, логин не короче 12 символов и пароль не короче 8 символов" };
  }

  const result = await registerWithBackend(login, firstName, lastName, middleName || null, password, role);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/login?registered=success");
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const login = String(formData.get("login") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "COACH") as RegistrationRole;

  if (login.length < 12 || !password || !["COACH", "STUDENT"].includes(role)) {
    return { error: "Введите логин не короче 12 символов, пароль и выберите роль" };
  }

  const result = await loginWithBackend(login, password, role);
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
