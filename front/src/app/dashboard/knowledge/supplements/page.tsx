import Link from "next/link";
import { KnowledgeSectionNavigation } from "@/components/KnowledgeSectionNavigation";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

export default function SupplementsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">База знаний</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">Проверенная информация о правилах соревнований и спортивных добавках.</p>
      </div>

      <KnowledgeSectionNavigation />

      <section aria-labelledby="supplements-title">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">БАДы</p>
          <h2 id="supplements-title" className="mt-1 text-lg font-semibold text-foreground sm:text-xl">Добавки</h2>
          <p className="mt-1 text-sm text-muted">Материалы основаны на англоязычных медицинских источниках. Это справочная информация, а не назначение лечения.</p>
        </div>

        <Link
          href="/dashboard/knowledge/supplements/magnesium"
          className="card-shadow group flex min-h-40 items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent/45 hover:shadow-lg sm:p-5"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-semibold text-accent-foreground">Mg</span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-foreground">Магний</span>
            <span className="mt-1 block text-sm leading-5 text-muted">Роль в организме, когда стоит обсудить добавку с врачом, безопасность и лекарственные взаимодействия.</span>
            <span className="mt-3 block text-xs font-medium text-accent">NIH Office of Dietary Supplements · PubMed</span>
          </span>
          <span className="shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-1"><ArrowIcon /></span>
        </Link>
      </section>
    </div>
  );
}
