import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import {
  StudentRequestDeleteButton,
  StudentTrainerRemoveButton,
  StudentTrainerRequestButton,
} from "@/components/StudentTrainerRequestButton";
import { getSession } from "@/lib/auth";
import {
  getBackendStudentTrainerRequests,
  getBackendStudentTrainers,
  getBackendTrainers,
  type BackendStudentRequestStatus,
} from "@/lib/backend-auth";
import { inputClass } from "@/lib/ui";

const ITEMS_PER_PAGE = 10;

const STATUS_LABELS: Record<BackendStudentRequestStatus, string> = {
  Pending: "На рассмотрении",
  Accepted: "Принята",
  Rejected: "Отклонена",
};

function pageHref(page: number, search: string): string {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set("search", search);
  return `/dashboard/student/coach?${query}`;
}

export default async function StudentCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/dashboard");

  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const search = (params.search ?? "").trim();
  const [trainers, myTrainers, myRequests] = await Promise.all([
    getBackendTrainers(session.accessToken, { page, itemsPerPage: ITEMS_PER_PAGE, search }),
    getBackendStudentTrainers(session.accessToken),
    getBackendStudentTrainerRequests(session.accessToken),
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
          Тренеры
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
              <div key={trainer.id} className="flex items-center gap-3 rounded-2xl bg-surface-muted/65 p-4">
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
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Имя или email тренера"
            aria-label="Поиск тренеров"
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Найти
          </button>
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
                  href={pageHref(trainers.page - 1, search)}
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
                  href={pageHref(trainers.page + 1, search)}
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
