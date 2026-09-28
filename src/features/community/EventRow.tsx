import { CalendarDays, MapPin, Users } from "lucide-react";
import type { CommunityEvent, CommunityGroup } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { publicLabel } from "../shared/identity";
import { eventKindLabels } from "../../data/mock/community";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatHour } from "../../utils/format";

export const registeredCount = (e: CommunityEvent) => e.baseRegistered + e.attendeeUserIds.length;
export const memberCount = (g: CommunityGroup) => g.baseMembers + g.memberUserIds.length;

/** An event with register / cancel for members, and a head count for the organiser. */
export function EventRow({ event: e, compact = false }: { event: CommunityEvent; compact?: boolean }) {
  const { session, update, notify } = useAppStore();
  const toast = useToast();
  const me = session!.userId;
  const organiser = e.organiserUserId === me;
  const going = e.attendeeUserIds.includes(me);
  const count = registeredCount(e);
  const full = count >= e.seats;

  const toggle = () => {
    if (going) {
      update("events", e.id, { attendeeUserIds: e.attendeeUserIds.filter((id) => id !== me) });
      toast(`Registration for ${e.title} cancelled.`);
      return;
    }
    update("events", e.id, { attendeeUserIds: [...e.attendeeUserIds, me] });
    notify({
      userId: e.organiserUserId,
      kind: "community",
      title: `${publicLabel(me, session!.role)} registered for ${e.title}`,
      body: `${count + 1} of ${e.seats} seats taken.`,
      link: "/community/events",
    });
    toast(`Registered for ${e.title} on ${formatDate(e.date)}.`);
  };

  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{eventKindLabels[e.kind]}</Badge>
          <span className="font-medium">{e.title}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden className="size-3.5" />
            {formatDate(e.date, { weekday: "short", day: "numeric", month: "short" })}, {formatHour(e.startHour)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3.5" />
            {e.village}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="size-3.5" />
            {count} of {e.seats}
          </span>
        </div>
        {!compact && (
          <>
            <p className="mt-1 text-ink-muted">{e.description}</p>
            <p className="text-[12px] text-ink-subtle">Hosted by {e.hostLabel}</p>
          </>
        )}
      </div>
      {organiser ? (
        <Badge tone={full ? "warning" : "success"} className="self-start sm:self-auto">
          {full ? "Full" : `${e.seats - count} seats left`}
        </Badge>
      ) : (
        <Button size="sm" variant={going ? "ghost" : "secondary"} className="self-start sm:self-auto" disabled={!going && full} onClick={toggle}>
          {going ? "Cancel registration" : full ? "Full" : "Register"}
        </Button>
      )}
    </li>
  );
}

/** A farmer group with join / leave for members. */
export function GroupRow({ group: g }: { group: CommunityGroup }) {
  const { session, update, notify } = useAppStore();
  const toast = useToast();
  const me = session!.userId;
  const organiser = g.organiserUserId === me;
  const joined = g.memberUserIds.includes(me);

  const toggle = () => {
    if (joined) {
      update("groups", g.id, { memberUserIds: g.memberUserIds.filter((id) => id !== me) });
      toast(`You left ${g.name}.`);
      return;
    }
    update("groups", g.id, { memberUserIds: [...g.memberUserIds, me] });
    notify({ userId: g.organiserUserId, kind: "community", title: `${publicLabel(me, session!.role)} joined ${g.name}`, link: "/community/groups" });
    toast(`You joined ${g.name}. Meetings: ${g.meets}.`);
  };

  return (
    <li className="flex flex-col gap-2 px-5 py-3.5 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-medium">{g.name}</div>
        <div className="text-ink-muted">
          {g.village} · {g.focus} · {memberCount(g)} members · {g.meets}
        </div>
        <p className="mt-0.5 text-ink-muted">{g.description}</p>
      </div>
      {organiser ? (
        <Badge tone="brand" className="self-start sm:self-auto">
          You organise this
        </Badge>
      ) : (
        <Button size="sm" variant={joined ? "ghost" : "secondary"} className="self-start sm:self-auto" onClick={toggle}>
          {joined ? "Leave group" : "Join group"}
        </Button>
      )}
    </li>
  );
}
