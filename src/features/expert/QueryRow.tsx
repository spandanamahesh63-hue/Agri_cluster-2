import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Consultation } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { farmLabelForUser } from "../../data/mock/farms";
import { formatDate, formatTime } from "../../utils/format";

const statusStyle: Record<Consultation["status"], { label: string; tone: "info" | "success" | "market" | "neutral" }> = {
  sent: { label: "New", tone: "info" },
  answered: { label: "Answered", tone: "success" },
  scheduled: { label: "Scheduled", tone: "market" },
  completed: { label: "Completed", tone: "neutral" },
};

export function QueryRow({ c }: { c: Consultation }) {
  return (
    <li>
      <Link to={`/expert/requests/${c.id}`} className="flex items-center gap-3 px-5 py-3 text-[13px] hover:bg-canvas">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{farmLabelForUser(c.requesterUserId)}</span>
            <Badge tone={statusStyle[c.status].tone}>{statusStyle[c.status].label}</Badge>
            <span className="text-ink-subtle">{c.kind === "consultation" ? "Consultation request" : "Question"}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-ink-muted">{c.message}</p>
          {c.status === "scheduled" && c.scheduledAt && (
            <p className="mt-0.5 font-medium text-ink">
              {c.mode === "field-visit" ? "Field visit" : "Call"} · {formatDate(c.scheduledAt, { weekday: "short", day: "numeric", month: "short" })}, {formatTime(c.scheduledAt)}
            </p>
          )}
        </div>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-subtle" />
      </Link>
    </li>
  );
}
