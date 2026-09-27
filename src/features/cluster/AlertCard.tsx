import { useId, useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { ClusterAlert } from "../../types";
import { Badge, PriorityBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { domainMeta } from "../intelligence/domain";
import { EvidenceList } from "../intelligence/EvidenceList";

/** A cluster-level alert: what's happening, the data behind it, and a coordination action. */
export function AlertCard({ alert, compact = false, defaultOpen = false }: { alert: ClusterAlert; compact?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const domain = domainMeta[alert.domain];

  return (
    <article className="rounded-xl border border-line bg-surface shadow-card">
      <div className={clsx("flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between", !compact && "sm:p-5")}>
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={domain.tone} icon={<domain.icon aria-hidden className="size-3" />}>
              {domain.label}
            </Badge>
            <PriorityBadge priority={alert.priority} />
          </div>
          <h3 className="text-[15px] font-semibold leading-snug">{alert.title}</h3>
          {!compact && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{alert.detail}</p>}
          {!compact && alert.evidence.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((o) => !o)}
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700"
            >
              Data behind this alert
              <ChevronDown aria-hidden className={clsx("size-4 transition-transform", open && "rotate-180")} />
            </button>
          )}
        </div>
        <ButtonLink to={alert.action.to} size="sm" variant="secondary" className="shrink-0 self-start">
          {alert.action.label}
        </ButtonLink>
      </div>
      {open && !compact && (
        <div id={panelId} className="border-t border-line bg-canvas p-4 sm:px-5">
          <EvidenceList evidence={alert.evidence} />
        </div>
      )}
    </article>
  );
}
