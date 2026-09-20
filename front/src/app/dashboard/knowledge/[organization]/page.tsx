import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeSectionNavigation } from "@/components/KnowledgeSectionNavigation";
import { getRuleOrganization, RULE_ORGANIZATIONS } from "@/lib/knowledge";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5m0-5-8 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
    </svg>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted">
          <span className="text-accent"><CheckIcon /></span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function generateStaticParams() {
  return RULE_ORGANIZATIONS.map((organization) => ({ organization: organization.slug }));
}

export default async function OrganizationRulesPage({ params }: { params: Promise<{ organization: string }> }) {
  const { organization: slug } = await params;
  const organization = getRuleOrganization(slug);
  if (!organization) notFound();

  const sections = [
    ["ages", "Возраст"],
    ["levels", "Пояса и уровни"],
    ["duration", "Время"],
    ["scoring", "Баллы"],
    ["restrictions", "Ограничения"],
    ["victory", "Победа"],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Навигационная цепочка" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/dashboard/knowledge" className="transition-colors hover:text-accent">База знаний</Link>
        <ChevronIcon />
        <span aria-current="page" className="font-medium text-foreground">{organization.shortName}</span>
      </nav>

      <KnowledgeSectionNavigation />

      <section className="card-shadow overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-base font-semibold ${organization.badgeClassName}`}>
            {organization.shortName}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{organization.discipline}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">{organization.fullName}</h1>
            <p className="mt-1 text-sm font-medium text-foreground">{organization.russianName}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{organization.description}</p>
          </div>
        </div>
        <div className="border-t border-border bg-surface-muted px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{organization.sourceVersion}</p>
              <p className="mt-0.5 text-xs text-muted">Русскоязычная структурированная выжимка из официального первоисточника.</p>
            </div>
            <a href={organization.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft">
              {organization.sourceLabel}
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </section>

      <nav aria-label="Разделы правил" className="flex flex-wrap gap-2">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-muted transition-colors hover:border-accent/35 hover:bg-accent-soft hover:text-accent-foreground">
            {label}
          </a>
        ))}
      </nav>

      <section id="ages" className="scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Возрастные категории</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Возраст определяет доступную категорию, время схватки и часть технических ограничений.</p>
        <RuleList items={organization.ages} />
      </section>

      <section id="levels" className="scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Пояса и уровни подготовки</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Организации используют пояса BJJ, уровни опыта или сочетание этих критериев.</p>
        <RuleList items={organization.levels} />
      </section>

      <section id="duration" className="scroll-mt-32 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="p-4 pb-3 sm:p-5 sm:pb-3">
          <h2 className="text-lg font-semibold text-foreground">Длительность схватки</h2>
          <p className="mt-1 text-sm text-muted">Основное время без учёта перерывов и специальных условий конкретного турнира.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3 font-semibold sm:px-5">Категория</th><th className="px-4 py-3 font-semibold sm:px-5">Время</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organization.durations.map((row) => (
                <tr key={row.category}><td className="px-4 py-3 leading-5 text-foreground sm:px-5">{row.category}</td><td className="whitespace-nowrap px-4 py-3 font-semibold text-accent sm:px-5">{row.duration}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="scoring" className="scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Система баллов</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Ключевые оценки позиций и технических действий.</p>
        <RuleList items={organization.scoring} />
      </section>

      <section id="restrictions" className="scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Ограничения и запрещённые приёмы</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Чем младше возраст и ниже уровень, тем строже технические ограничения.</p>
        <div className="grid gap-3">
          {organization.restrictions.map((restriction) => (
            <div key={restriction.group} className="rounded-xl bg-danger-soft/55 p-3.5 sm:p-4">
              <h3 className="mb-2.5 font-semibold text-foreground">{restriction.group}</h3>
              <RuleList items={restriction.items} />
            </div>
          ))}
        </div>
      </section>

      <section id="victory" className="scroll-mt-32 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Как определяется победитель</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Основные способы завершения схватки.</p>
        <RuleList items={organization.victories} />
      </section>

      <section className="rounded-2xl border border-accent/20 bg-accent-soft/70 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-accent-foreground">Важно перед соревнованием</h2>
        <div className="mt-3"><RuleList items={organization.notes} /></div>
        <p className="mt-3 text-sm leading-6 text-muted">Этот материал помогает быстро разобраться в структуре правил, но не заменяет официальный регламент и положение конкретного турнира.</p>
      </section>
    </div>
  );
}
