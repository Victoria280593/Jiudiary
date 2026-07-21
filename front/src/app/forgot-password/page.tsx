import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthCard } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Восстановление пароля"
      subtitle="Укажите email, указанный при регистрации — мы вышлем ссылку для сброса пароля."
      footer={
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Вернуться ко входу
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
