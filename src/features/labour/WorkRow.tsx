import type { LabourProfile, LabourRequest } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { bookingStatusLabel } from "../resources/labels";
import { skillLabels } from "../../data/mock/labour";
import { farmLabelForUser } from "../../data/mock/farms";
import { formatDate, formatINR } from "../../utils/format";

/** A work request / assignment with the crew's next action. */
export function WorkRow({ request, profile }: { request: LabourRequest; profile?: LabourProfile }) {
  const { update } = useAppStore();
  const toast = useToast();
  const farm = farmLabelForUser(request.requesterUserId);
  const wages = profile ? request.workers * request.days * profile.dailyWage : 0;
  const set = (status: LabourRequest["status"], message: string) => {
    update("labourRequests", request.id, { status });
    toast(message);
  };

  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium">
          {skillLabels[request.skill]} · {farm}
        </div>
        <div className="text-ink-muted">
          {request.workers} workers × {request.days} day{request.days > 1 ? "s" : ""} from {formatDate(request.date, { weekday: "short", day: "numeric", month: "short" })}
          {wages > 0 && ` · est. ${formatINR(wages)} wages`}
        </div>
        {request.note && <div className="text-ink-muted">“{request.note}”</div>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {request.status === "requested" && (
          <>
            <Button size="sm" onClick={() => set("accepted", `Accepted. ${farm} can see your crew is coming.`)}>
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => set("declined", `Declined. ${farm} has been informed.`)}>
              Decline
            </Button>
          </>
        )}
        {request.status === "accepted" && (
          <>
            <Badge tone="success">Confirmed</Badge>
            <Button size="sm" variant="secondary" onClick={() => set("in-progress", "Marked as started.")}>
              Start work
            </Button>
          </>
        )}
        {request.status === "in-progress" && (
          <>
            <Badge tone="info">In progress</Badge>
            <Button size="sm" variant="secondary" onClick={() => set("completed", "Marked as completed. Thank you!")}>
              Mark done
            </Button>
          </>
        )}
        {(request.status === "completed" || request.status === "declined") && (
          <Badge tone={bookingStatusLabel[request.status].tone}>{bookingStatusLabel[request.status].label}</Badge>
        )}
      </div>
    </li>
  );
}
