import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Belt } from "@/components/Belt";
import { BELT_LABELS } from "@/lib/belt";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentsPage() {
  const coach = await getCurrentUser();
  if (!coach) redirect("/login");
  if (coach.role !== "COACH") redirect("/");

  const students = await prisma.user.findMany({
    where: { coachId: coach.id },
    orderBy: { name: "asc" },
  });

  return (
    <main className="w-full flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-7">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
              Ученики
            </h1>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-foreground">
              {students.length}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Здесь будет собрана ваша команда: профили учеников, их пояса и прогресс в тренировках.
          </p>
        </section>

        {students.length === 0 ? (
          <section className="calendar-shadow rounded-[1.85rem] border border-white bg-white/92 px-6 py-12 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 20v-1.5A3.5 3.5 0 0012.5 15h-5A3.5 3.5 0 004 18.5V20m13-9a3 3 0 110-6 3 3 0 010 6zM10 11a3 3 0 110-6 3 3 0 010 6zm8.5 4.5A3.5 3.5 0 0122 19" />
              </svg>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">Учеников пока нет</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Когда к вам прикрепят первого ученика, он появится здесь. Позже добавим приглашения и управление командой.
            </p>
          </section>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <li key={student.id} className="calendar-shadow flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white bg-white/92 p-4">
                <Avatar src={student.avatarUrl} name={student.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
                  <p className="truncate text-xs text-muted">{student.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-center">
                  <Belt
                    belt={student.belt ?? "WHITE"}
                    size="xs"
                  />
                  <span className="mt-0.5 text-[10px] text-muted">
                    {BELT_LABELS[student.belt ?? "WHITE"]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
