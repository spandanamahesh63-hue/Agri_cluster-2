import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { CircleCheck, CircleDot, TriangleAlert } from "lucide-react";
import type { Status } from "./useClusterView";

const statusStyle: Record<Status, { label: string; icon: ReactNode; className: string }> = {
  healthy: { label: "Healthy", icon: <CircleCheck aria-hidden className="size-3.5" />, className: "text-success" },
  moderate: { label: "Moderate", icon: <CircleDot aria-hidden className="size-3.5" />, className: "text-warning" },
  alert: { label: "Alert", icon: <TriangleAlert aria-hidden className="size-3.5" />, className: "text-danger" },
};

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  status?: Status;
  to?: string;
}

/** One cluster indicator. Status is shown with icon + word, never colour alone. */
export function StatTile({ label, value, sub, status, to }: StatTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-ink-muted">{label}</span>
        {status && (
          <span className={clsx("inline-flex items-center gap-1 text-[12px] font-medium", statusStyle[status].className)}>
            {statusStyle[status].icon}
            {statusStyle[status].label}
          </span>
        )}
      </div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-ink-muted">{sub}</div>}
    </>
  );
  const cls = "block rounded-xl border border-line bg-surface p-4 shadow-card";
  return to ? (
    <Link to={to} className={clsx(cls, "transition-colors hover:border-line-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
