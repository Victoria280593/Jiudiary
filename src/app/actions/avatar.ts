"use server";

import { unlink, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

async function deleteAvatarFile(avatarUrl: string | null) {
  if (!avatarUrl || !avatarUrl.startsWith("/avatars/")) return;
  const filePath = path.join(process.cwd(), "public", avatarUrl);
  try {
    await unlink(filePath);
  } catch {
    // файл мог быть уже удалён — не критично
  }
}

export async function updateAvatarAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Доступ запрещён" };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите изображение" };
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return { error: "Поддерживаются только изображения JPEG, PNG и WebP" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Файл слишком большой (максимум 3 МБ)" };
  }

  await mkdir(AVATAR_DIR, { recursive: true });

  const filename = `${user.id}-${randomBytes(6).toString("hex")}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATAR_DIR, filename), bytes);

  await deleteAvatarFile(user.avatarUrl);

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: `/avatars/${filename}` },
  });

  revalidatePath("/dashboard", "layout");
  return undefined;
}

export async function removeAvatarAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await deleteAvatarFile(user.avatarUrl);

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: null },
  });

  revalidatePath("/dashboard", "layout");
}
