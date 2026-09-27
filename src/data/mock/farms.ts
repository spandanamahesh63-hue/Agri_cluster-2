import type { CropCycle, Farm, Field, IrrigationEvent } from "../../types";
import { CLUSTER_ID } from "./users";

export const farms: Farm[] = [
  {
    id: "farm-27",
    label: "Farm #27",
    ownerUserId: "u-farmer-27",
    clusterId: CLUSTER_ID,
    village: "Varuna",
    totalAcres: 2.5,
    irrigation: "drip",
    pump: { powerKw: 3.7, flowLitresPerHour: 12000, energy: "solar+grid", gridHours: [16, 22] },
    fieldIds: ["f27-1", "f27-2", "f27-3"],
  },
];

/** Public label of the farm owned by a user ("Farm #27"), never the person's name. */
export function farmLabelForUser(userId: string): string {
  const detailed = farms.find((f) => f.ownerUserId === userId);
  if (detailed) return detailed.label;
  const n = /^u-farmer-(\d+)$/.exec(userId)?.[1];
  return n ? `Farm #${n}` : "Member farm";
}

export const fields: Field[] = [
  { id: "f27-1", farmId: "farm-27", name: "Field 1", acres: 1.5, activeCropCycleId: "cc-27-1" },
  { id: "f27-2", farmId: "farm-27", name: "Field 2", acres: 0.5, activeCropCycleId: "cc-27-2" },
  { id: "f27-3", farmId: "farm-27", name: "Field 3", acres: 0.5, activeCropCycleId: "cc-27-3" },
];

export const cropCycles: CropCycle[] = [
  {
    id: "cc-27-1",
    fieldId: "f27-1",
    crop: "Tomato",
    variety: "Arka Rakshak",
    sowingDate: "2026-06-28",
    stage: "fruit-development",
    harvestWindow: { start: "2026-10-04", end: "2026-10-07" },
    expectedYieldTonnes: 3.2,
    expectedGrade: "A",
  },
  {
    id: "cc-27-2",
    fieldId: "f27-2",
    crop: "Tomato",
    variety: "Arka Rakshak",
    sowingDate: "2026-07-25",
    stage: "flowering",
    harvestWindow: { start: "2026-10-26", end: "2026-11-04" },
    expectedYieldTonnes: 1.1,
    expectedGrade: "A",
  },
  {
    id: "cc-27-3",
    fieldId: "f27-3",
    crop: "Chilli",
    variety: "Byadgi",
    sowingDate: "2026-07-10",
    stage: "flowering",
    harvestWindow: { start: "2026-11-10", end: "2026-11-30" },
    expectedYieldTonnes: 0.6,
    expectedGrade: "B",
  },
];

export const irrigationSchedule: IrrigationEvent[] = [
  { id: "ir-1", fieldId: "f27-1", scheduledAt: "2026-09-27T17:00:00+05:30", durationHours: 3, status: "scheduled" },
  { id: "ir-3", fieldId: "f27-3", scheduledAt: "2026-09-27T17:00:00+05:30", durationHours: 1, status: "scheduled" },
];
