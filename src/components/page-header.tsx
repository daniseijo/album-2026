import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-brand-accent/30 bg-brand text-brand-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-2xl items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-brand-foreground/60">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
