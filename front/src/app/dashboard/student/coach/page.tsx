import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { CoachStudentCards } from "@/components/CoachStudentCards";
import { SubmitButton } from "@/components/SubmitButton";
import {
  StudentRequestDeleteButton,
  StudentTrainerRemoveButton,
  StudentTrainerRequestButton,
} from "@/components/StudentTrainerRequestButton";
import { getSession } from "@/lib/auth";
import {
  getBackendStudentTrainerRequests,
  getBackendStudentTrainers,
  getBackendStudents,
  getBackendTrainers,
  type BackendStudentRequestStatus,
} from "@/lib/backend-auth";
import { inputClass } from "@/lib/ui";

const ITEMS_PER_PAGE = 10;
const STUDENTS_PER_PAGE = 25;

const STATUS_LABELS: Record<BackendStudentRequestStatus, string> = {
  Pending: "На рассмотрении",
  Accepted: "Принята",
  Rejected: "Отклонена",
};

function pageHref(page: number, studentsPage: number, search: string): string {
  const query = new URLSearchParams({ page: String(page) });
  if (studentsPage > 1) query.set("studentsPage", String(studentsPage));
  if (search) query.set("search", search);
  return `/dashboard/student/coach?${query}`;
}

function studentsPageHref(studentsPage: number, page: number, search: string): string {
  const query = new URLSearchParams({ studentsPage: String(studentsPage) });
  if (page > 1) query.set("page", String(page));
  if (search) query.set("search", search);
  return `/dashboard/student/coach?${query}`;
}

export default async function StudentCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; studentsPage?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/dashboard");

  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedStudentsPage = Number.parseInt(params.studentsPage ?? "1", 10);
  const studentsPage = Number.isFinite(parsedStudentsPage) && parsedStudentsPage > 0 ? parsedStudentsPage : 1;
  const search = (params.search ?? "").trim();
  const [trainers, myTrainers, myRequests, students] = await Promise.all([
    getBackendTrainers(session.accessToken, { page, itemsPerPage: ITEMS_PER_PAGE, search }),
    getBackendStudentTrainers(session.accessToken),
    getBackendStudentTrainerRequests(session.accessToken),
    getBackendStudents(session.accessToken, { page: studentsPage, itemsPerPage: STUDENTS_PER_PAGE }),
  ]);

  const latestRequestByCoach = new Map<string, BackendStudentRequestStatus>();
  for (const request of myRequests ?? []) {
    if (!latestRequestByCoach.has(request.coachId)) {
      latestRequestByCoach.set(request.coachId, request.status);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
          Команда
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Найдите тренера и отправьте заявку на присоединение
        </p>
      </div>

      <Card title="Мои тренеры">
        {!myTrainers ? (
          <p className="text-sm text-muted">Не удалось загрузить ваших тренеров.</p>
        ) : myTrainers.length === 0 ? (
          <p className="text-sm text-muted">У вас пока нет подтверждённых тренеров.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myTrainers.map((trainer) => (
              <div key={trainer.id} className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-surface-muted/65 p-4">
                <Avatar src={null} name={trainer.name} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{trainer.name}</p>
                  <p className="truncate text-sm text-muted">{trainer.login}</p>
                  {trainer.beltName && <p className="text-xs text-muted">Пояс: {trainer.beltName}</p>}
                </div>
                <StudentTrainerRemoveButton coachId={trainer.id} coachName={trainer.name} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="overflow-hidden rounded-xl border border-border bg-surface card-shadow">
        <div className="border-b border-border/70 px-4 py-4 sm:px-5">
          <h2 className="font-semibold text-foreground">Ученики</h2>
          <p className="mt-1 text-sm text-muted">Ученики, которые занимаются у ваших тренеров.</p>
        </div>
        {!students ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Не удалось загрузить список учеников.</p>
        ) : students.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">В вашей команде пока нет других учеников.</p>
        ) : (
          <CoachStudentCards students={students.items} trainerGroups={null} canManage={false} />
        )}
        {students && students.totalPages > 1 && (
          <nav aria-label="Страницы учеников" className="flex items-center justify-center gap-3 border-t border-border/70 px-4 py-4">
            {students.page > 1 ? (
              <Link href={studentsPageHref(students.page - 1, page, search)} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
                Назад
              </Link>
            ) : (
              <span className="rounded-md border border-border px-4 py-2 text-sm text-muted opacity-50">Назад</span>
            )}
            <span className="text-sm text-muted">{students.page} из {students.totalPages}</span>
            {students.page < students.totalPages ? (
              <Link href={studentsPageHref(students.page + 1, page, search)} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
                Далее
              </Link>
            ) : (
              <span className="rounded-md border border-border px-4 py-2 text-sm text-muted opacity-50">Далее</span>
            )}
          </nav>
        )}
      </section>

      {(myRequests?.length ?? 0) > 0 && (
        <Card title="Мои заявки">
          <div className="flex flex-col divide-y divide-border">
            {myRequests!.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{request.coachName}</p>
                  <p className="truncate text-sm text-muted">{request.coachLogin}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
                    {STATUS_LABELS[request.status]}
                  </span>
                  <StudentRequestDeleteButton requestId={request.id} coachName={request.coachName} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Поиск тренеров">
        <form method="get" className="flex flex-col gap-2 sm:flex-row">
          {studentsPage > 1 && <input type="hidden" name="studentsPage" value={studentsPage} />}
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Имя или email тренера"
            aria-label="Поиск тренеров"
            className={`${inputClass} flex-1`}
          />
          <SubmitButton
            pendingText="Поиск…"
            className="rounded-md bg-accent px-5 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
          >
            Найти
          </SubmitButton>
        </form>

        {!trainers ? (
          <p className="mt-4 text-sm text-muted">Не удалось загрузить список тренеров.</p>
        ) : trainers.items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {search ? "По вашему запросу тренеры не найдены." : "Список тренеров пока пуст."}
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">Найдено тренеров: {trainers.totalItems}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {trainers.items.map((trainer) => (
                <div key={trainer.id} className="rounded-2xl border border-border/70 bg-white p-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={null} name={trainer.name} size={52} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{trainer.name}</p>
                      <p className="truncate text-sm text-muted">{trainer.login}</p>
                      {trainer.beltName && (
                        <p className="mt-1 text-xs text-muted">Пояс: {trainer.beltName}</p>
                      )}
                    </div>
                  </div>
                  <StudentTrainerRequestButton
                    coachId={trainer.id}
                    coachName={trainer.name}
                    status={latestRequestByCoach.get(trainer.id)}
                  />
                </div>
              ))}
            </div>

            <nav aria-label="Страницы тренеров" className="mt-5 flex items-center justify-center gap-3">
              {trainers.page > 1 ? (
                <Link
                  href={pageHref(trainers.page - 1, studentsPage, search)}
                  className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  Назад
                </Link>
              ) : (
                <span className="rounded-md border border-border px-4 py-2 text-sm text-muted opacity-50">
                  Назад
                </span>
              )}

              <span className="text-sm text-muted">
                {trainers.page} из {Math.max(trainers.totalPages, 1)}
              </span>

              {trainers.page < trainers.totalPages ? (
                <Link
                  href={pageHref(trainers.page + 1, studentsPage, search)}
                  className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  Далее
                </Link>
              ) : (
                <span className="rounded-md border border-border px-4 py-2 text-sm text-muted opacity-50">
                  Далее
                </span>
              )}
            </nav>
          </>
        )}
      </Card>
    </div>
  );
}
