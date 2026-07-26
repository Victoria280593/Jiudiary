import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";
import { AuthCard } from "@/components/AuthCard";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <AuthCard
      title="Регистрация тренера"
      subtitle="Создайте аккаунт для ведения спортивного дневника"
      footer={
        <p>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
            Войти
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
