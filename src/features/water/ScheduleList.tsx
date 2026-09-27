import { Link } from "react-router-dom";
import { Sun, Zap } from "lucide-react";
import type { ScheduleRow } from "./schedule";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { formatDate, formatLitres, formatTime } from "../../utils/format";
import { DEMO_TODAY } from "../../data/mock/clock";

/** Irrigation events with any accepted change and any pending suggestion. */
export function ScheduleList({ rows, showEnergy = false }: { rows: ScheduleRow[]; showEnergy?: boolean }) {
  if (rows.length === 0) return <EmptyState title="No irrigation scheduled" description="Nothing is planned for the next 24 hours." />;
  return (
    <ul className="divide-y divide-line px-5 pb-2 pt-1">
      {rows.map((row) => {
        const day = row.time.slice(0, 10) === DEMO_TODAY ? "Today" : formatDate(row.time, { weekday: "short", day: "numeric", month: "short" });
        return (
          <li key={row.event.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {row.field.name}
                <span className="font-normal text-ink-muted"> · {row.cycle?.crop}</span>
              </div>
              <div className="text-[13px] text-ink-muted">
                {day}, {formatTime(row.time)} · {row.durationHours} h · about {formatLitres(row.litres)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showEnergy && (
                <Badge
                  tone={row.energy === "Solar" ? "energy" : "neutral"}
                  icon={row.energy === "Solar" ? <Sun aria-hidden className="size-3" /> : <Zap aria-hidden className="size-3" />}
                >
                  {row.energy}
                </Badge>
              )}
              {row.change ? (
                <Badge tone="success">You accepted: {row.change.summary.toLowerCase()}</Badge>
              ) : (
                <Badge>Scheduled</Badge>
              )}
              {row.pending && (
                <Link to={`/farmer/intelligence/${row.pending.id}`} className="text-[13px] font-medium text-brand-700 hover:underline">
                  Suggestion to review
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
