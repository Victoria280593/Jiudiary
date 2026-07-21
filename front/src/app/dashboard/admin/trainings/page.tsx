import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/Card";
import { TrainingCalendar } from "@/components/TrainingCalendar";

export default async function AdminTrainingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/dashboard");

  const trainings = await prisma.training.findMany({
    orderBy: { date: "desc" },
    include: { coach: { select: { name: true } } },
  });

  const calendarTrainings = trainings.map((t) => ({
    id: t.id,
    title: t.title,
    date: t.date.toISOString(),
    coachName: t.coach.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/admin"
          className="text-sm text-accent hover:text-accent-hover hover:underline"
        >
          ← К администрированию
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          Календарь тренировок
        </h1>
        <p className="text-sm text-muted">
          Все тренировки всех тренеров ({trainings.length})
        </p>
      </div>

      <Card>
        <TrainingCalendar
          trainings={calendarTrainings}
          linkBase="/dashboard/admin/trainings"
          showCreateForm={false}
        />
      </Card>
    </div>
  );
}
