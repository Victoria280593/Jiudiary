export function Card({
  title,
  children,
  className = "",
  id,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`card-shadow scroll-mt-4 rounded-xl border border-border bg-surface p-4 sm:p-5 ${className}`}
    >
      {title && <h2 className="mb-3 font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  );
}
