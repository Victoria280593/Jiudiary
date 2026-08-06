import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/auth";
import { getBackendTrainers } from "@/lib/backend-auth";
import { inputClass } from "@/lib/ui";

const ITEMS_PER_PAGE = 10;

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
  const trainers = await getBackendTrainers(session.accessToken, {
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    search,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
          Тренеры
        </h1>
        <p className="mt-1.5 text-sm text-muted">Найдите тренера по имени или электронной почте</p>
      </div>

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
        <Card>
          <p className="text-sm text-muted">Не удалось загрузить список тренеров.</p>
        </Card>
      ) : trainers.items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            {search ? "По вашему запросу тренеры не найдены." : "Список тренеров пока пуст."}
          </p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted">Найдено тренеров: {trainers.totalItems}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {trainers.items.map((trainer) => (
              <Card key={trainer.id} className="flex items-center gap-4">
                <Avatar src={null} name={trainer.name} size={52} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{trainer.name}</span>
                  <span className="block truncate text-sm text-muted">{trainer.login}</span>
                  {trainer.beltName && (
                    <span className="mt-1 block text-xs text-muted">Пояс: {trainer.beltName}</span>
                  )}
                </span>
              </Card>
            ))}
          </div>

          <nav aria-label="Страницы тренеров" className="flex items-center justify-center gap-3">
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
    </div>
  );
}
