import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Add the subtle farming motif behind the heading (see .agri-header). */
  decorated?: boolean;
}

export function PageHeader({ eyebrow, title, description, actions, decorated }: PageHeaderProps) {
  return (
    <header className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between${decorated ? " agri-header" : ""}`}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[12px] font-medium text-ink-subtle">{eyebrow}</div>}
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
