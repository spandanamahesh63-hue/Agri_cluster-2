import type { FarmAssessment, IrrigationType, LandReport, Level, SupportContact } from "../../types";

/** How the farmer asked to be reached, as each side reads it. */
export const contactLabels: Record<SupportContact, { farmer: string; office: string }> = {
  call: { farmer: "Call me", office: "Call" },
  "rsk-visit": { farmer: "Meet at the RSK", office: "Meet at the RSK" },
  "farm-visit": { farmer: "Visit my farm", office: "Farm visit" },
};

export const soilLabels: Record<FarmAssessment["soilType"], string> = {
  red: "Red",
  black: "Black",
  alluvial: "Alluvial",
  sandy: "Sandy",
  laterite: "Laterite",
};

export const waterLabels: Record<Level, string> = { low: "Low", moderate: "Moderate", high: "Good" };

export const irrigationLabels: Record<IrrigationType, string> = {
  drip: "Drip",
  sprinkler: "Sprinkler",
  flood: "Flood / furrow",
  rainfed: "Rainfed only",
};

/** The land report as label/value rows, skipping anything the team didn't record. */
export function landReportRows(r: LandReport): [string, string][] {
  const rows: [string, string][] = [];
  if (r.soilType) rows.push(["Soil type", soilLabels[r.soilType]]);
  if (r.landAcres) rows.push(["Land size", `${r.landAcres} acre${r.landAcres === 1 ? "" : "s"}`]);
  if (r.water) rows.push(["Water for irrigation", waterLabels[r.water]]);
  if (r.irrigation) rows.push(["Irrigation", irrigationLabels[r.irrigation]]);
  if (r.soilTestDone) rows.push(["Soil test", "Sample tested"]);
  return rows;
}

/** A 10-digit Indian mobile number, spaces allowed. */
export const validPhone = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""));
