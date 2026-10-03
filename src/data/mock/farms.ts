import { isRealMode } from "../../services/mode";
import { realFarmLabel } from "../../features/shared/people";
import type { CropCycle, Farm, Field, IrrigationEvent } from "../../types";
import { CLUSTER_ID } from "./users";

// The demo farm: Spandana's 1 acre of tomato near Chamarajanagara (spec §38).
// Figures are prototype demo values, not agricultural predictions.
export const farms: Farm[] = [
  {
    id: "farm-27",
    label: "Farm #27",
    ownerUserId: "u-farmer-27",
    clusterId: CLUSTER_ID,
    village: "Chamarajanagara",
    totalAcres: 1,
    irrigation: "drip",
    pump: { powerKw: 3.7, flowLitresPerHour: 12000, energy: "solar+grid", gridHours: [16, 22] },
    fieldIds: ["f27-1", "f27-2"],
  },
];

/** Public label of the farm owned by a user ("Farm #27"), never the person's name. */
export function farmLabelForUser(userId: string): string {
  if (isRealMode()) return realFarmLabel(userId);
  const detailed = farms.find((f) => f.ownerUserId === userId);
  if (detailed) return detailed.label;
  const n = /^u-farmer-(\d+)$/.exec(userId)?.[1];
  return n ? `Farm #${n}` : "Member farm";
}

export const fields: Field[] = [
  { id: "f27-1", farmId: "farm-27", name: "Field 1", acres: 0.6, activeCropCycleId: "cc-27-1" },
  { id: "f27-2", farmId: "farm-27", name: "Field 2", acres: 0.4, activeCropCycleId: "cc-27-2" },
];

// Both fields are one tomato crop (precision farming on drip), transplanted a
// week apart. Together they are expected to give 2,000 kg of Grade A tomato.
export const cropCycles: CropCycle[] = [
  {
    id: "cc-27-1",
    fieldId: "f27-1",
    crop: "Tomato",
    variety: "Arka Rakshak",
    sowingDate: "2026-06-28",
    stage: "fruit-development",
    harvestWindow: { start: "2026-10-04", end: "2026-10-07" },
    expectedYieldTonnes: 1.2,
    expectedGrade: "A",
  },
  {
    id: "cc-27-2",
    fieldId: "f27-2",
    crop: "Tomato",
    variety: "Arka Rakshak",
    sowingDate: "2026-07-05",
    stage: "fruit-development",
    harvestWindow: { start: "2026-10-04", end: "2026-10-07" },
    expectedYieldTonnes: 0.8,
    expectedGrade: "A",
  },
];

export const irrigationSchedule: IrrigationEvent[] = [
  { id: "ir-1", fieldId: "f27-1", scheduledAt: "2026-09-27T17:00:00+05:30", durationHours: 1.25, status: "scheduled" },
  { id: "ir-2", fieldId: "f27-2", scheduledAt: "2026-09-27T17:00:00+05:30", durationHours: 1, status: "scheduled" },
];
