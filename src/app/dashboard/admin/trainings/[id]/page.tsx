import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { Card } from "@/components/Card";
import { formatDateTime } from "@/lib/format";

export default async function AdminTrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;

  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      coach: { select: { name: true } },
      attendances: true,
    },
  });

  if (!training) notFound();

  const students = await prisma.user.findMany({
    where: { coachId: training.coachId },
    orderBy: { name: "asc" },
  });

  const attendanceByStudent = new Map(
    training.attendances.map((a) => [a.studentId, a])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/admin/trainings"
          className="text-sm text-accent hover:text-accent-hover hover:underline"
        >
          ← К календарю тренировок
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{training.title}</h1>
        <p className="text-sm text-muted">
          {formatDateTime(training.date)} · Тренер: {training.coach.name}
          {training.location ? ` · ${training.location}` : ""}
        </p>
        {training.notes && (
          <p className="mt-1 text-sm text-foreground/70">{training.notes}</p>
        )}
      </div>

      <Card title="Посещаемость">
        {students.length === 0 ? (
          <p className="text-sm text-muted">У тренера пока нет учеников.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {students.map((s) => {
              const attendance = attendanceByStudent.get(s.id);
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    {attendance?.comment && (
                      <p className="text-sm text-muted">{attendance.comment}</p>
                    )}
                  </div>
                  <AttendanceBadge attended={attendance?.attended ?? null} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
