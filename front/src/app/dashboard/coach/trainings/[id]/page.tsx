import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateAttendanceAction } from "@/app/actions/training";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/Card";

export default async function TrainingAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") redirect("/dashboard");

  const training = await prisma.training.findUnique({
    where: { id },
    include: { attendances: true },
  });

  if (!training || training.coachId !== user.id) notFound();

  const students = await prisma.user.findMany({
    where: { coachId: user.id },
    orderBy: { name: "asc" },
  });

  const attendanceByStudent = new Map(
    training.attendances.map((a) => [a.studentId, a])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/coach"
          className="text-sm text-accent hover:text-accent-hover hover:underline"
        >
          ← К списку тренировок
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          {training.title}
        </h1>
        <p className="text-sm text-muted">
          {formatDateTime(training.date)}
          {training.location ? ` · ${training.location}` : ""}
        </p>
        {training.notes && (
          <p className="mt-1 text-sm text-foreground/70">{training.notes}</p>
        )}
      </div>

      <Card title="Посещаемость">
        {students.length === 0 ? (
          <p className="text-sm text-muted">
            У вас пока нет учеников, привязанных к вам.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {students.map((s) => {
              const attendance = attendanceByStudent.get(s.id);
              return (
                <li key={s.id} className="py-3">
                  <form
                    action={updateAttendanceAction}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <input type="hidden" name="trainingId" value={training.id} />
                    <input type="hidden" name="studentId" value={s.id} />
                    <p className="font-medium text-foreground sm:w-40">{s.name}</p>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="attended"
                          value="present"
                          defaultChecked={attendance?.attended === true}
                        />
                        Был
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="attended"
                          value="absent"
                          defaultChecked={attendance?.attended === false}
                        />
                        Не был
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="attended"
                          value=""
                          defaultChecked={
                            attendance === undefined || attendance.attended === null
                          }
                        />
                        Не отмечено
                      </label>
                    </div>
                    <input
                      type="text"
                      name="comment"
                      placeholder="Комментарий"
                      defaultValue={attendance?.comment ?? ""}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:w-48"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
                    >
                      Сохранить
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
