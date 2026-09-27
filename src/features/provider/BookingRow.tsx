import type { Booking, Machinery } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { bookingStatusLabel } from "../resources/labels";
import { farmLabelForUser } from "../../data/mock/farms";
import { formatDate, formatHour, formatINR } from "../../utils/format";

/** One booking as the equipment owner sees it, with the next sensible action. */
export function BookingRow({ booking, machine }: { booking: Booking; machine?: Machinery }) {
  const { update } = useAppStore();
  const toast = useToast();
  const farm = farmLabelForUser(booking.requesterUserId);
  const set = (status: Booking["status"], message: string) => {
    update("bookings", booking.id, { status });
    toast(message);
  };

  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium">
          {machine?.name ?? "Equipment"} <span className="font-normal text-ink-muted">· {farm}</span>
        </div>
        <div className="text-ink-muted">
          {formatDate(booking.date, { weekday: "short", day: "numeric", month: "short" })}, {formatHour(booking.startHour)}–{formatHour(booking.startHour + booking.hours)} ·{" "}
          {booking.purpose} · est. {formatINR(booking.estimatedCost)}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {booking.status === "requested" ? (
          <>
            <Button size="sm" onClick={() => set("accepted", `Booking confirmed for ${farm}. The farmer can see it now.`)}>
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => set("declined", `Declined. ${farm} has been informed.`)}>
              Decline
            </Button>
          </>
        ) : booking.status === "accepted" ? (
          <>
            <Badge tone="success">Confirmed</Badge>
            <Button size="sm" variant="secondary" onClick={() => set("completed", "Marked as completed.")}>
              Mark completed
            </Button>
          </>
        ) : (
          <Badge tone={bookingStatusLabel[booking.status].tone}>{bookingStatusLabel[booking.status].label}</Badge>
        )}
      </div>
    </li>
  );
}
