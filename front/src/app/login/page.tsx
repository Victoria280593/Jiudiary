import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { AuthCard } from "@/components/AuthCard";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; registered?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { reset, registered } = await searchParams;

  return (
    <AuthCard
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить работу в JiuDiary"
      footer={
        <>
          <Link href="/forgot-password" className="font-medium text-accent hover:text-accent-hover">
            Забыли пароль?
          </Link>
          <p>
            Нет аккаунта?{" "}
            <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
              Зарегистрироваться
            </Link>
          </p>
        </>
      }
    >
      {reset === "success" && (
        <p className="mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">
          Пароль обновлён. Войдите с новым паролем.
        </p>
      )}
      {registered === "success" && (
        <p className="mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">
          Аккаунт тренера создан. Теперь войдите с указанными данными.
        </p>
      )}
      <LoginForm />
    </AuthCard>
  );
}
