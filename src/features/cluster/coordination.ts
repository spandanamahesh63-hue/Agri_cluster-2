import type { ClusterFarm } from "../../types";

// Planning figures shared by the cluster water / energy / crops / market screens.
// All indicative.
const SQ_M_PER_ACRE = 4046.86;
const TYPICAL_DEPTH_MM = 5;
const PUMP_KW = 3.7;
const PUMP_LPH = 12000;
export const PICKUP_TONNES = 1.5;
export const HARVEST_WORKER_DAYS_PER_ACRE: Record<string, number> = { Tomato: 8, Chilli: 10, Onion: 6, "Leafy vegetables": 4 };

export const irrigationLitres = (f: ClusterFarm) => f.acres * SQ_M_PER_ACRE * TYPICAL_DEPTH_MM;
export const pumpingKwh = (f: ClusterFarm) => (irrigationLitres(f) / PUMP_LPH) * PUMP_KW;
export const needsWater = (f: ClusterFarm) => f.active && f.soilMoisturePct < f.minSoilMoisture;

export function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    (acc[key(item)] ??= []).push(item);
    return acc;
  }, {});
}
