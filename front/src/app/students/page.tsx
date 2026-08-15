import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CoachStudentRequestActions } from "@/components/CoachStudentRequestActions";
import { CoachStudentRemoveButton } from "@/components/CoachStudentRemoveButton";
import { getSession } from "@/lib/auth";
import {
  getBackendCoachStudentRequests,
  getBackendCoachStudents,
} from "@/lib/backend-auth";
import { formatDateTime } from "@/lib/format";

type StudentsSection = "students" | "requests";
type RequestsSection = "pending" | "rejected";
type PageItem = number | "ellipsis";

const ITEMS_PER_PAGE = 6;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positivePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function paginationItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

function studentsHref(section: StudentsSection, status: RequestsSection, page = 1) {
  const query = new URLSearchParams({ section });
  if (section === "requests") query.set("status", status);
  if (page > 1) query.set("page", String(page));
  return `/students?${query.toString()}`;
}

function Pagination({
  currentPage,
  totalPages,
  section,
  status,
}: {
  currentPage: number;
  totalPages: number;
  section: StudentsSection;
  status: RequestsSection;
}) {
  const linkClass = "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition";
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <nav aria-label="Пагинация" className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border/70 px-4 py-4 sm:gap-2">
      {currentPage > 1 ? (
        <Link href={studentsHref(section, status, currentPage - 1)} aria-label="Предыдущая страница" className={`${linkClass} text-muted hover:bg-surface-muted hover:text-foreground`}>
          ‹
        </Link>
      ) : (
        <span aria-hidden="true" className={`${linkClass} cursor-not-allowed text-muted/35`}>‹</span>
      )}

      {paginationItems(currentPage, safeTotalPages).map((item, index) => item === "ellipsis" ? (
        <span key={`ellipsis-${index}`} className="flex h-10 min-w-8 items-center justify-center text-sm text-muted">…</span>
      ) : (
        <Link
          key={item}
          href={studentsHref(section, status, item)}
          aria-current={item === currentPage ? "page" : undefined}
          className={`${linkClass} ${item === currentPage ? "bg-accent text-white shadow-sm" : "text-foreground hover:bg-surface-muted"}`}
        >
          {item}
        </Link>
      ))}

      {currentPage < safeTotalPages ? (
        <Link href={studentsHref(section, status, currentPage + 1)} aria-label="Следующая страница" className={`${linkClass} text-muted hover:bg-surface-muted hover:text-foreground`}>
          ›
        </Link>
      ) : (
        <span aria-hidden="true" className={`${linkClass} cursor-not-allowed text-muted/35`}>›</span>
      )}
    </nav>
  );
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH") redirect("/");

  const query = await searchParams;
  const section: StudentsSection = firstValue(query.section) === "requests" ? "requests" : "students";
  const requestSection: RequestsSection = firstValue(query.status) === "rejected" ? "rejected" : "pending";
  const requestedPage = positivePage(firstValue(query.page));

  const [requests, students] = await Promise.all([
    getBackendCoachStudentRequests(session.accessToken),
    getBackendCoachStudents(session.accessToken),
  ]);

  const pendingRequests = requests?.filter((request) => request.status === "Pending") ?? [];
  const rejectedRequests = requests?.filter((request) => request.status === "Rejected") ?? [];
  const activeRequests = requestSection === "pending" ? pendingRequests : rejectedRequests;
  const totalItems = section === "students" ? students?.length ?? 0 : activeRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleStudents = (students ?? []).slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const visibleRequests = activeRequests.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <main className="w-full flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 xl:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:gap-6">
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">Ученики</h1>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-foreground">
              {students?.length ?? 0}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Управляйте своими учениками и заявками на присоединение.
          </p>
        </section>

        <nav
          aria-label="Разделы учеников"
          className="mx-auto grid w-full max-w-xl grid-cols-2 overflow-hidden rounded-xl border border-border/70 bg-surface-muted p-1 shadow-sm"
        >
          <Link
            href={studentsHref("students", requestSection)}
            aria-current={section === "students" ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-center text-sm font-semibold transition sm:px-5 ${
              section === "students"
                ? "bg-white text-accent-foreground shadow-sm"
                : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
            }`}
          >
            <span>Мои ученики</span>
            <span className="rounded-full bg-white/75 px-2 py-0.5 text-xs">{students?.length ?? 0}</span>
          </Link>
          <Link
            href={studentsHref("requests", "pending")}
            aria-current={section === "requests" ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-center text-sm font-semibold transition sm:px-5 ${
              section === "requests"
                ? "bg-white text-accent-foreground shadow-sm"
                : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
            }`}
          >
            <span>Заявки</span>
            <span className="rounded-full bg-white/75 px-2 py-0.5 text-xs">{pendingRequests.length}</span>
          </Link>
        </nav>

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_18px_50px_-36px_rgba(66,45,27,0.45)]">
          <div className="border-b border-border/70 px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {section === "students"
                ? `Мои ученики · ${students?.length ?? 0}`
                : `Заявки на присоединение · ${pendingRequests.length + rejectedRequests.length}`}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">
              {section === "students"
                ? "Ученики, которые сейчас занимаются у вас."
                : "Рассматривайте новые заявки и просматривайте историю отклонённых."}
            </p>
            {section === "requests" && (
              <nav
                aria-label="Статус заявок"
                className="relative mx-auto mt-4 grid w-full max-w-sm grid-cols-2 rounded-xl border border-border/70 bg-surface-muted p-1 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out ${
                    requestSection === "rejected" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <Link
                  href={studentsHref("requests", "pending")}
                  aria-current={requestSection === "pending" ? "page" : undefined}
                  className={`relative z-10 flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    requestSection === "pending" ? "text-accent-foreground" : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
                  }`}
                >
                  Входящие <span className="text-xs opacity-75">{pendingRequests.length}</span>
                </Link>
                <Link
                  href={studentsHref("requests", "rejected")}
                  aria-current={requestSection === "rejected" ? "page" : undefined}
                  className={`relative z-10 flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    requestSection === "rejected" ? "text-accent-foreground" : "text-muted hover:bg-accent/[0.05] hover:text-foreground"
                  }`}
                >
                  Отклонённые <span className="text-xs opacity-75">{rejectedRequests.length}</span>
                </Link>
              </nav>
            )}
          </div>

          {section === "students" ? (
            !students ? (
              <p className="px-5 py-10 text-center text-sm text-muted">Не удалось загрузить список учеников.</p>
            ) : visibleStudents.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">Учеников пока нет. Принятые заявки появятся здесь.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {visibleStudents.map((student) => (
                  <li key={student.id} className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-6">
                    <Avatar src={null} name={student.name} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground sm:text-base">{student.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{student.login}</p>
                      {student.beltName && <p className="mt-1 truncate text-xs text-muted">Пояс: {student.beltName}</p>}
                    </div>
                    <CoachStudentRemoveButton studentId={student.id} studentName={student.name} />
                  </li>
                ))}
              </ul>
            )
          ) : !requests ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Не удалось загрузить заявки.</p>
          ) : visibleRequests.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              {requestSection === "pending" ? "Новых заявок пока нет." : "Отклонённых заявок пока нет."}
            </p>
          ) : (
            <div className="divide-y divide-border/70">
              {visibleRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={null} name={request.studentName} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground sm:text-base">{request.studentName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{request.studentLogin}</p>
                      <p className="mt-1 text-xs text-muted">{formatDateTime(new Date(request.createDate))}</p>
                    </div>
                  </div>
                  {request.status === "Pending" ? (
                    <CoachStudentRequestActions requestId={request.id} studentName={request.studentName} />
                  ) : (
                    <span className="self-start rounded-full bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger sm:self-auto">Отклонена</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} section={section} status={requestSection} />
        </section>
      </div>
    </main>
  );
}
