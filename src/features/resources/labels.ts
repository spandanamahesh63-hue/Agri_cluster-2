import type { BookingStatus, Machinery, ResourceKind } from "../../types";
import { personById } from "../shared/people";

export const kindLabels: Record<ResourceKind, string> = {
  tractor: "Tractor",
  harvester: "Harvester",
  sprayer: "Sprayer",
  drone: "Drone",
  tiller: "Tiller",
  seeder: "Seeder",
  transport: "Transport",
  "cold-storage": "Cold storage",
  irrigation: "Irrigation",
};

export const bookingStatusLabel: Record<BookingStatus, { label: string; tone: "info" | "success" | "danger" | "neutral" }> = {
  requested: { label: "Awaiting owner response", tone: "info" },
  accepted: { label: "Confirmed", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  "in-progress": { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "neutral" },
};

/** Registered service businesses are shown by name; private owners only by village (privacy). */
export function ownerLabel(m: Machinery): string {
  const owner = personById(m.ownerUserId);
  if (owner?.role !== "provider") return `Private owner · ${m.village}`;
  return owner.name;
}
