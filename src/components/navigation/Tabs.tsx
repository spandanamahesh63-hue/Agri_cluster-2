import clsx from "clsx";
import { NavLink } from "react-router-dom";

interface Tab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/** In-page tabs (state-driven). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label={label} className="inline-flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={tabClass(value === t.id)}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 text-ink-subtle">{t.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Sub-navigation between related routes (URL-driven). */
export function LinkTabs({ tabs, label }: { tabs: { to: string; label: string; end?: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => tabClass(isActive)}>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function tabClass(active: boolean) {
  return clsx(
    "-mb-px whitespace-nowrap border-b-2 px-3 pb-2 pt-1 text-[13px] transition-colors",
    active ? "border-brand-700 font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
  );
}
