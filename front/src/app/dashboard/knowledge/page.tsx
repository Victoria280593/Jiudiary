import Link from "next/link";
import { RULE_ORGANIZATIONS } from "@/lib/knowledge";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

export default function KnowledgePage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">База знаний</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">
          Проверенная информация о правилах соревнований.
        </p>
      </div>

      <section aria-labelledby="organizations-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="organizations-title" className="text-lg font-semibold text-foreground sm:text-xl">Правила соревнований</h2>
            <p className="mt-1 text-sm text-muted">Выберите организацию, чтобы открыть структуру её правил.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {RULE_ORGANIZATIONS.map((organization) => (
            <Link
              key={organization.slug}
              href={`/dashboard/knowledge/${organization.slug}`}
              className="card-shadow group flex min-h-40 items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:shadow-lg sm:p-5"
            >
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${organization.badgeClassName}`}>
                {organization.shortName}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-foreground">{organization.shortName}</span>
                <span className="mt-0.5 block text-xs font-medium text-accent">{organization.fullName}</span>
                <span className="mt-1 block text-sm leading-5 text-muted">{organization.description}</span>
                <span className="mt-3 block text-xs font-medium text-accent">Возраст, уровни, время, баллы и ограничения</span>
              </span>
              <span className="shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm leading-5 text-muted">
        Справочник составлен по официальным источникам. Перед регистрацией всегда проверяйте положение конкретного турнира и актуальную редакцию регламента.
      </div>
    </div>
  );
}
