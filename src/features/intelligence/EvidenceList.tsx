import type { Evidence } from "../../types";
import { SourceBadge } from "../../components/ui/Badge";

/** The data behind a recommendation, each value labelled with its source. */
export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  return (
    <dl className="divide-y divide-line rounded-lg border border-line bg-surface">
      {evidence.map((e) => (
        <div key={e.label} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <dt className="text-[13px] text-ink-muted">{e.label}</dt>
          <dd className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink sm:justify-end sm:text-right">
            {e.value}
            <SourceBadge source={e.source} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
