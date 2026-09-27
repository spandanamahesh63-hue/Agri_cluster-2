import type { Cluster, ExternalProvider, ImpactMetric } from "../../types";
import { CLUSTER_ID } from "./users";
import { clusterFarms } from "./clusterFarms";

const round1 = (n: number) => Math.round(n * 10) / 10;

export const cluster: Cluster = {
  id: CLUSTER_ID,
  name: "Mysuru Vegetable Cluster",
  region: "Mysuru & Chamarajanagara districts, Karnataka",
  farmerCount: clusterFarms.length,
  cultivatedAcres: round1(clusterFarms.reduce((s, f) => s + f.acres, 0)),
  mainCrops: ["Tomato", "Chilli", "Onion", "Leafy vegetables"],
  source: "demo",
};

/** Aggregates across all farms, derived from the roster. */
export const clusterAggregates = {
  farmsWithIrrigationBeforeRain: clusterFarms.filter((f) => f.irrigationBeforeRain).length,
  farmsWithPossibleCropStress: clusterFarms.filter((f) => f.possibleStress).length,
  activeFarmers: clusterFarms.filter((f) => f.active).length,
};

/** Equipment providers outside the cluster the coordinator can approach (fictional). */
export const externalProviders: ExternalProvider[] = [
  { id: "ext-1", name: "Nanjangud Farm Machinery Hub", kind: "tractor", units: 3, location: "Nanjangud", distanceKm: 18, ratePerHour: 1000 },
  { id: "ext-2", name: "T. Narasipura Custom Hiring Centre", kind: "tractor", units: 4, location: "T. Narasipura", distanceKm: 26, ratePerHour: 950 },
  { id: "ext-3", name: "Mysuru Agri Logistics", kind: "transport", units: 5, location: "Mysuru city", distanceKm: 14, ratePerHour: 700 },
];

// Pilot targets are illustrative goals, not guaranteed outcomes. "current" values
// are prototype values for the season to date.
export const impactMetrics: ImpactMetric[] = [
  { id: "water", label: "Avoidable water use", unit: "% reduction", baseline: 0, current: 11, targetRange: [15, 20], source: "prototype" },
  { id: "inputs", label: "Input efficiency", unit: "% improvement", baseline: 0, current: 6, targetRange: [10, 15], source: "prototype" },
  { id: "loss", label: "Crop loss", unit: "% reduction", baseline: 0, current: 4, targetRange: [10, 10], source: "prototype" },
  { id: "market", label: "Market realisation", unit: "% improvement", baseline: 0, current: 3, targetRange: [5, 10], source: "prototype" },
];

/** Baseline season vs pilot season to date, in absolute terms (prototype values). */
export const impactComparison = [
  { metric: "Water per acre (kL/week)", short: "Water", baseline: 118, pilot: 105, better: "lower" as const },
  { metric: "Pumping energy per acre (kWh/week)", short: "Energy", baseline: 36, pilot: 31, better: "lower" as const },
  { metric: "Crop loss (% of harvest)", short: "Crop loss", baseline: 14, pilot: 13.4, better: "lower" as const },
  { metric: "Avg. realised price, tomato (₹/kg)", short: "Tomato price", baseline: 19.5, pilot: 20.1, better: "higher" as const },
  { metric: "Tractor utilisation (hrs/day)", short: "Tractor use", baseline: 4.2, pilot: 5.6, better: "higher" as const },
];
