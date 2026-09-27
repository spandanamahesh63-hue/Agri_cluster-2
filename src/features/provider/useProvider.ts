import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { useMachinery } from "../shared/useMerged";

/** The signed-in owner's equipment and the bookings made against it. */
export function useProvider() {
  const { session, bookings } = useAppStore();
  const machinery = useMachinery();
  return useMemo(() => {
    const equipment = machinery.filter((m) => m.ownerUserId === session?.userId);
    const ids = new Set(equipment.map((m) => m.id));
    const mine = bookings.filter((b) => ids.has(b.machineryId)).sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
    return {
      equipment,
      bookings: mine,
      requests: mine.filter((b) => b.status === "requested"),
      upcoming: mine.filter((b) => b.status === "accepted" || b.status === "in-progress"),
      past: mine.filter((b) => b.status === "completed" || b.status === "declined"),
    };
  }, [machinery, bookings, session]);
}
