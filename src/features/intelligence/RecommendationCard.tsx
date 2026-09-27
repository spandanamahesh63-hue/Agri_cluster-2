import { useId, useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { Recommendation } from "../../types";
import { Badge, PriorityBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { useAppStore } from "../../store/AppStore";
import { domainMeta } from "./domain";
import { EvidenceList } from "./EvidenceList";
import { DecisionControls } from "./DecisionControls";

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const decided = !!useAppStore().decisions[rec.id];
  const domain = domainMeta[rec.domain];

  return (
    <article className={clsx("rounded-xl border border-line bg-surface shadow-card", decided && "opacity-75")}>
      <div className="p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={domain.tone} icon={<domain.icon aria-hidden className="size-3" />}>
            {domain.label}
          </Badge>
          <PriorityBadge priority={rec.priority} />
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-ink">{rec.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{rec.situation}</p>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:text-brand-800"
        >
          Why this recommendation?
          <ChevronDown aria-hidden className={clsx("size-4 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div id={panelId} className="mt-3 space-y-3 rounded-lg bg-canvas p-3">
            <p className="text-[13px] leading-relaxed text-ink">{rec.whyItMatters}</p>
            <EvidenceList evidence={rec.evidence} />
            {rec.impact && (
              <p className="text-[13px] text-ink-muted">
                <span className="font-medium text-ink">Potential impact: </span>
                {rec.impact}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 sm:px-5">
        <ButtonLink to={rec.action.to} size="sm" variant={decided ? "secondary" : "primary"}>
          {rec.action.label}
        </ButtonLink>
        <DecisionControls rec={rec} />
      </div>
    </article>
  );
}
