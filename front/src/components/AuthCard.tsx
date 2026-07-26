export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="card-shadow relative w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-1 text-center text-xl font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mb-6 text-center text-sm text-muted">{subtitle}</p>
        )}
        {children}
        {footer && (
          <div className="mt-4 flex flex-col items-center gap-2 text-center text-sm text-muted">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
