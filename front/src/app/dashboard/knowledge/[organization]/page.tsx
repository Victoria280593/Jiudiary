import Link from "next/link";
import { notFound } from "next/navigation";
import { getRuleOrganization, RULE_ORGANIZATIONS, RULE_TOPICS } from "@/lib/knowledge";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function generateStaticParams() {
  return RULE_ORGANIZATIONS.map((organization) => ({ organization: organization.slug }));
}

export default async function OrganizationRulesPage({
  params,
}: {
  params: Promise<{ organization: string }>;
}) {
  const { organization: slug } = await params;
  const organization = getRuleOrganization(slug);
  if (!organization) notFound();

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Навигационная цепочка" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/dashboard/knowledge" className="transition-colors hover:text-accent">Знания</Link>
        <ChevronIcon />
        <span aria-current="page" className="font-medium text-foreground">{organization.name}</span>
      </nav>

      <section className="card-shadow overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${organization.badgeClassName}`}>
            {organization.name}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Правила организации</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">{organization.name}</h1>
            <p className="mt-1.5 text-sm text-muted sm:text-base">{organization.description}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="rules-title">
        <div className="mb-3">
          <h2 id="rules-title" className="text-lg font-semibold text-foreground sm:text-xl">Разделы правил</h2>
          <p className="mt-1 text-sm text-muted">Откройте нужный раздел, чтобы перейти к его содержимому.</p>
        </div>

        <div className="grid gap-3">
          {RULE_TOPICS.map((topic, index) => (
            <details key={topic.title} className="group rounded-2xl border border-border bg-surface open:border-accent/35">
              <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-accent-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{topic.title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-muted">{topic.description}</span>
                </span>
                <span className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90">
                  <ChevronIcon />
                </span>
              </summary>
              <div className="border-t border-border px-4 py-4 text-sm leading-6 text-muted sm:px-5">
                Здесь будет размещена актуальная редакция раздела «{topic.title}» для {organization.name}. Содержимое добавим после проверки официального регламента организации.
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm leading-5 text-muted">
        Перед участием в турнире необходимо сверяться с последней официальной редакцией регламента организатора.
      </div>
    </div>
  );
}
