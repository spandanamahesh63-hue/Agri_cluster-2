// Demo API. Screens call these async functions instead of importing mock data
// directly, so this file is the only thing to replace when a real backend
// (the Express server, PostgreSQL, weather/market APIs, sensors) is connected.

import type {
  BuyerRequirement,
  Cluster,
  ClusterFarm,
  ClusterSupply,
  CropCycle,
  Expert,
  ExternalProvider,
  ImpactMetric,
  InfrastructurePoint,
  Farm,
  Field,
  IrrigationEvent,
  LabourProfile,
  Machinery,
  Recommendation,
  ResourceDemand,
  SensorReading,
  Technology,
  User,
  WeatherForecast,
} from "../../types";
import { cluster, externalProviders, impactComparison, impactMetrics } from "../../data/mock/cluster";
import { clusterFarms, infrastructure, villages } from "../../data/mock/clusterFarms";
import { DEMO_NOW } from "../../data/mock/clock";
import { cropCycles, farms, fields, irrigationSchedule } from "../../data/mock/farms";
import { energyHistory, waterHistory, type EnergyDay, type WaterDay } from "../../data/mock/history";
import { experts } from "../../data/mock/experts";
import { labourProfiles } from "../../data/mock/labour";
import { technologies } from "../../data/mock/technology";
import { buyerRequirements, clusterSupply, priceChannels } from "../../data/mock/market";
import { machinery, resourceDemand } from "../../data/mock/resources";
import { forecast, sensorHistory } from "../../data/mock/sensing";
import { users } from "../../data/mock/users";
import { analyzeCluster, analyzeFarm } from "../intelligence/engine";

const LATENCY_MS = 350;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

export interface FarmerOverview {
  user: User;
  cluster: Cluster;
  farm: Farm;
  fields: Field[];
  cycles: CropCycle[];
  latestReadings: Record<string, SensorReading>;
  sensorHistory: Record<string, SensorReading[]>;
  irrigation: IrrigationEvent[];
  waterHistory: WaterDay[];
  energyHistory: EnergyDay[];
  forecast: WeatherForecast;
  recommendations: Recommendation[];
  tractors: { total: number; booked: number };
}

export async function getFarmerOverview(userId: string): Promise<FarmerOverview> {
  const user = users.find((u) => u.id === userId);
  const farm = farms.find((f) => f.ownerUserId === userId);
  if (!user || !farm) throw new Error("Farm profile not found for this account.");

  const farmFields = fields.filter((f) => f.farmId === farm.id);
  const cycles = cropCycles.filter((c) => farmFields.some((f) => f.activeCropCycleId === c.id));
  const irrigation = irrigationSchedule.filter((e) => farmFields.some((f) => f.id === e.fieldId));
  const recommendations = analyzeFarm({
    now: DEMO_NOW,
    farm,
    fields: farmFields,
    cycles,
    sensorHistory,
    irrigation,
    forecast,
    buyerRequirements,
    resourceDemand,
  });

  const latestReadings = Object.fromEntries(
    farmFields.map((f) => [f.id, sensorHistory[f.id][sensorHistory[f.id].length - 1]]),
  );
  const tractors = machinery.filter((m) => m.kind === "tractor");

  return delay({
    user,
    cluster,
    farm,
    fields: farmFields,
    cycles,
    latestReadings,
    sensorHistory: Object.fromEntries(farmFields.map((f) => [f.id, sensorHistory[f.id]])),
    irrigation,
    waterHistory,
    energyHistory,
    forecast,
    recommendations,
    tractors: { total: tractors.length, booked: tractors.filter((m) => m.status === "booked").length },
  });
}

export interface ResourceCatalog {
  machinery: Machinery[];
  demand: ResourceDemand[];
  labour: LabourProfile[];
  technologies: Technology[];
}

export async function getResourceCatalog(): Promise<ResourceCatalog> {
  return delay({ machinery, demand: resourceDemand, labour: labourProfiles, technologies });
}

export async function getExperts(): Promise<Expert[]> {
  return delay(experts);
}

export interface MarketOverview {
  requirements: BuyerRequirement[];
  channels: typeof priceChannels;
  supply: ClusterSupply[];
}

export async function getMarketOverview(): Promise<MarketOverview> {
  return delay({ requirements: buyerRequirements, channels: priceChannels, supply: clusterSupply });
}

/** Raw cluster data. Live state (decisions, bookings, listings) is layered on by features/cluster. */
export interface ClusterData {
  cluster: Cluster;
  forecast: WeatherForecast;
  farms: ClusterFarm[];
  villages: typeof villages;
  infrastructure: InfrastructurePoint[];
  machinery: Machinery[];
  labour: LabourProfile[];
  resourceDemand: ResourceDemand[];
  externalProviders: ExternalProvider[];
  supply: ClusterSupply[];
  buyerRequirements: BuyerRequirement[];
  impactMetrics: ImpactMetric[];
  impactComparison: typeof impactComparison;
  /** Recommendations generated for member farms with detailed data (Farm #27). */
  memberRecommendations: Recommendation[];
}

export async function getClusterData(): Promise<ClusterData> {
  const farm = farms[0];
  const farmFields = fields.filter((f) => f.farmId === farm.id);
  const memberRecommendations = analyzeFarm({
    now: DEMO_NOW,
    farm,
    fields: farmFields,
    cycles: cropCycles.filter((c) => farmFields.some((f) => f.activeCropCycleId === c.id)),
    sensorHistory,
    irrigation: irrigationSchedule,
    forecast,
    buyerRequirements,
    resourceDemand,
  });
  return delay({
    cluster,
    forecast,
    farms: clusterFarms,
    villages,
    infrastructure,
    machinery,
    labour: labourProfiles,
    resourceDemand,
    externalProviders,
    supply: clusterSupply,
    buyerRequirements,
    impactMetrics,
    impactComparison,
    memberRecommendations,
  });
}

export { analyzeCluster };

export interface HarvestOutlookRow {
  crop: string;
  grade: "A" | "B" | "C";
  window: { start: string; end: string };
  farms: number;
  expectedTonnes: number;
}

/** What active member farms expect to harvest, grouped by crop, grade and window (indicative). */
export async function getHarvestOutlook(): Promise<HarvestOutlookRow[]> {
  const groups = new Map<string, HarvestOutlookRow>();
  for (const f of clusterFarms.filter((x) => x.active)) {
    const key = `${f.crop}|${f.grade}|${f.harvestWindow.start}`;
    const row = groups.get(key) ?? { crop: f.crop, grade: f.grade, window: f.harvestWindow, farms: 0, expectedTonnes: 0 };
    row.farms += 1;
    row.expectedTonnes = Math.round((row.expectedTonnes + f.expectedTonnes) * 10) / 10;
    groups.set(key, row);
  }
  return delay([...groups.values()].sort((a, b) => a.window.start.localeCompare(b.window.start)));
}
