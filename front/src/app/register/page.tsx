import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RegisterForm } from "@/components/RegisterForm";
import { AuthCard } from "@/components/AuthCard";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const [coaches, students] = await Promise.all([
    prisma.user.findMany({
      where: { role: "COACH" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuthCard
      title="Регистрация"
      subtitle="Создайте аккаунт тренера, ученика или родителя"
      footer={
        <p>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
            Войти
          </Link>
        </p>
      }
    >
      <RegisterForm coaches={coaches} students={students} />
    </AuthCard>
  );
}
