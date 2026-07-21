import Link from "next/link";
import { prisma } from "@/lib/db";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { AuthCard } from "@/components/AuthCard";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  const valid = !!resetToken && resetToken.expiresAt > new Date();

  return (
    <AuthCard
      title="Новый пароль"
      subtitle={
        valid
          ? "Задайте новый пароль для входа в аккаунт."
          : "Ссылка недействительна или срок её действия истёк."
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Link href="/forgot-password" className="font-medium text-accent hover:text-accent-hover">
          Запросить новую ссылку
        </Link>
      )}
    </AuthCard>
  );
}
