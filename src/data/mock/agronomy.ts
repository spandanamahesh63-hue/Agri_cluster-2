import type { CropStage, CropStageProfile } from "../../types";

// Simplified, prototype-grade thresholds. A production system would calibrate
// these per soil type and variety with agronomists.
export const cropStageProfiles: CropStageProfile[] = [
  { crop: "Tomato", stage: "vegetative", minSoilMoisture: 50, irrigationDepthMm: 4 },
  { crop: "Tomato", stage: "flowering", minSoilMoisture: 55, irrigationDepthMm: 5 },
  { crop: "Tomato", stage: "fruit-development", minSoilMoisture: 55, irrigationDepthMm: 6 },
  { crop: "Chilli", stage: "vegetative", minSoilMoisture: 38, irrigationDepthMm: 4 },
  { crop: "Chilli", stage: "flowering", minSoilMoisture: 40, irrigationDepthMm: 5 },
  { crop: "Onion", stage: "vegetative", minSoilMoisture: 45, irrigationDepthMm: 4 },
];

/** Worker-days per acre across a harvest window (prototype-grade planning figure). */
export const harvestLabourPerAcre: Record<string, number> = { Tomato: 8, Chilli: 10, Onion: 6 };

/** Drip irrigation events per week used for planning water demand. */
export const IRRIGATION_EVENTS_PER_WEEK = 3;

export function stageProfile(crop: string, stage: CropStage): CropStageProfile | undefined {
  return cropStageProfiles.find((p) => p.crop === crop && p.stage === stage);
}
