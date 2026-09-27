import clsx from "clsx";

/** Mark: three farms (nodes) joined into one cluster. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={clsx("size-8", className)}>
      <rect width="32" height="32" rx="8" className="fill-brand-700" />
      <path d="M10 21.5 16 10.5l6 11z" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-brand-200" strokeLinejoin="round" />
      <circle cx="16" cy="10.5" r="3" className="fill-white" />
      <circle cx="10" cy="21.5" r="3" className="fill-white" />
      <circle cx="22" cy="21.5" r="3" className="fill-brand-200" />
    </svg>
  );
}

export function Logo({ subtitle = true, inverted = false }: { subtitle?: boolean; inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-tight">
        <div className={clsx("text-[15px] font-semibold tracking-tight", inverted ? "text-white" : "text-ink")}>AgriCluster</div>
        {subtitle && <div className={clsx("text-[11px]", inverted ? "text-brand-200" : "text-ink-subtle")}>Cluster Intelligence</div>}
      </div>
    </div>
  );
}
