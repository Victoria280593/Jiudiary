import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { Avatar } from "@/components/Avatar";
import { Belt } from "@/components/Belt";
import { Card } from "@/components/Card";
import { BELT_LABELS } from "@/lib/belt";

export default async function ParentDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/dashboard");

  const links = await prisma.parentChild.findMany({
    where: { parentId: user.id },
    include: { student: { include: { coach: { select: { name: true } } } } },
  });

  if (links.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          К вам пока не привязан ни один ребёнок. Свяжитесь с тренером или
          зарегистрируйтесь заново, указав ребёнка.
        </p>
      </Card>
    );
  }

  const childrenWithTrainings = await Promise.all(
    links.map(async (link) => {
      const trainings = link.student.coachId
        ? await prisma.training.findMany({
            where: { coachId: link.student.coachId },
            orderBy: { date: "desc" },
            include: { attendances: { where: { studentId: link.student.id } } },
          })
        : [];
      return { student: link.student, trainings };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Мои дети</h1>

      {childrenWithTrainings.map(({ student, trainings }) => (
        <Card key={student.id}>
          <div className="mb-3 flex items-center gap-3">
            <Avatar src={student.avatarUrl} name={student.name} size={40} />
            <div>
              <h2 className="font-semibold text-foreground">{student.name}</h2>
              <p className="text-sm text-muted">
                Тренер: {student.coach?.name ?? "не назначен"}
              </p>
            </div>
            {student.belt && (
              <span className="ml-auto flex items-center gap-2">
                <Belt
                  belt={student.belt}
                  size="sm"
                />
                <span className="text-xs text-muted">{BELT_LABELS[student.belt]}</span>
              </span>
            )}
          </div>

          {trainings.length === 0 ? (
            <p className="text-sm text-muted">Тренировок пока нет.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {trainings.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">{t.title}</p>
                    <p className="text-sm text-muted">
                      {formatDateTime(t.date)}
                      {t.location ? ` · ${t.location}` : ""}
                    </p>
                    {t.attendances[0]?.comment && (
                      <p className="mt-1 text-sm text-foreground/70">
                        {t.attendances[0].comment}
                      </p>
                    )}
                  </div>
                  <AttendanceBadge attended={t.attendances[0]?.attended ?? null} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
