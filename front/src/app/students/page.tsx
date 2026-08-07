import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { CoachStudentRequestActions } from "@/components/CoachStudentRequestActions";
import { CoachStudentRemoveButton } from "@/components/CoachStudentRemoveButton";
import { getSession } from "@/lib/auth";
import {
  getBackendCoachStudentRequests,
  getBackendCoachStudents,
} from "@/lib/backend-auth";
import { formatDateTime } from "@/lib/format";

export default async function StudentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH") redirect("/");

  const [requests, students] = await Promise.all([
    getBackendCoachStudentRequests(session.accessToken),
    getBackendCoachStudents(session.accessToken),
  ]);

  return (
    <main className="w-full flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 xl:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
        <section>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
              Ученики
            </h1>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-foreground">
              {students?.length ?? 0}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Принимайте заявки и управляйте списком своих учеников.
          </p>
        </section>

        <Card title={`Заявки на присоединение${requests?.length ? ` · ${requests.length}` : ""}`}>
          {!requests ? (
            <p className="text-sm text-muted">Не удалось загрузить заявки.</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted">Новых заявок пока нет.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <Avatar src={null} name={request.studentName} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{request.studentName}</p>
                    <p className="truncate text-sm text-muted">{request.studentLogin}</p>
                    <p className="mt-1 text-xs text-muted">
                      Отправлена {formatDateTime(new Date(request.createDate))}
                    </p>
                  </div>
                  <CoachStudentRequestActions
                    requestId={request.id}
                    studentName={request.studentName}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Мои ученики">
          {!students ? (
            <p className="text-sm text-muted">Не удалось загрузить список учеников.</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted">
              Учеников пока нет. Принятые заявки появятся в этом списке.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {students.map((student) => (
                <li
                  key={student.id}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-white p-4"
                >
                  <Avatar src={null} name={student.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
                    <p className="truncate text-xs text-muted">{student.login}</p>
                    {student.beltName && (
                      <p className="mt-1 truncate text-xs text-muted">Пояс: {student.beltName}</p>
                    )}
                  </div>
                  <CoachStudentRemoveButton
                    studentId={student.id}
                    studentName={student.name}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
