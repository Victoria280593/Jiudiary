import Link from "next/link";

const MAIN_ARTICLE_URL = "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/";
const PUBMED_REVIEW_URL = "https://pubmed.ncbi.nlm.nih.gov/30684032/";

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

function FactList({ items }: { items: string[] }) {
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

export default function MagnesiumPage() {
  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Навигационная цепочка" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/dashboard/knowledge" className="transition-colors hover:text-accent">База знаний</Link>
        <ChevronIcon />
        <Link href="/dashboard/knowledge/supplements" className="transition-colors hover:text-accent">Добавки</Link>
        <ChevronIcon />
        <span aria-current="page" className="font-medium text-foreground">Магний</span>
      </nav>

      <section className="card-shadow overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-semibold text-accent-foreground">Mg</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">БАДы</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">Магний</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Краткий ориентир по данным NIH и публикациям из PubMed: что известно, какие есть ограничения и почему добавку не стоит подбирать «на всякий случай».</p>
          </div>
        </div>
        <div className="border-t border-border bg-surface-muted px-5 py-4 sm:px-6">
          <a href={MAIN_ARTICLE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft">
            Открыть основную статью на английском
            <ExternalLinkIcon />
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Что это</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Магний — минерал, который поступает с пищей и участвует во множестве процессов организма. Он содержится, например, в орехах, семенах, бобовых, цельных злаках и зелёных листовых овощах. Добавки не заменяют полноценный рацион.</p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Когда имеет смысл обсудить добавку</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Причину, форму и дозу стоит определять вместе с врачом, особенно если есть симптомы или хронические заболевания.</p>
        <FactList items={[
          "При подтверждённом дефиците или устойчиво недостаточном поступлении магния с пищей.",
          "При состояниях и лекарствах, которые могут влиять на уровень магния; это оценивает специалист по конкретной ситуации.",
          "Не как универсальное средство для сна, восстановления, судорог или снижения веса: данные по этим целям неоднородны и не заменяют диагностику.",
        ]} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Что говорят исследования</h2>
        <p className="mb-4 mt-1 text-sm text-muted">В исследованиях есть отдельные перспективные результаты для некоторых состояний, но они не делают магний универсальной профилактикой или лечением.</p>
        <FactList items={[
          "Обзор систематических обзоров и метаанализов из PubMed отмечает, что убедительность доказательств различается в зависимости от исхода и дизайна исследований.",
          "NIH указывает, что данные по ряду целей, включая профилактику мигрени, ограничены; приём в лечебных дозах должен контролировать медицинский специалист.",
          "Если нет дефицита, ожидаемый эффект от добавки может быть небольшим или отсутствовать — особенно когда цель сформулирована неспецифично.",
        ]} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Безопасность и взаимодействия</h2>
        <FactList items={[
          "Избыток магния из добавок чаще всего вызывает диарею, тошноту и спазмы в животе.",
          "При нарушенной функции почек риск накопления магния выше; самостоятельный приём особенно нежелателен.",
          "Магний может влиять на всасывание некоторых антибиотиков и бисфосфонатов, а часть диуретиков и ингибиторов протонной помпы — на уровень магния. Совместимость нужно проверять с врачом или фармацевтом.",
          "Рекомендации по дозировке на этой странице не приводятся намеренно: они зависят от питания, целей, анализов, формы добавки и лекарств.",
        ]} />
      </section>

      <section className="rounded-2xl border border-accent/20 bg-accent-soft/70 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-accent-foreground">Источники на английском</h2>
        <div className="mt-3 grid gap-2.5 text-sm leading-6">
          <a href={MAIN_ARTICLE_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 font-semibold text-accent hover:text-accent-foreground">
            NIH Office of Dietary Supplements — Magnesium: Health Professional Fact Sheet
            <ExternalLinkIcon />
          </a>
          <a href={PUBMED_REVIEW_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 font-semibold text-accent hover:text-accent-foreground">
            PubMed — Magnesium and health outcomes: umbrella review of systematic reviews and meta-analyses
            <ExternalLinkIcon />
          </a>
        </div>
      </section>
    </div>
  );
}
