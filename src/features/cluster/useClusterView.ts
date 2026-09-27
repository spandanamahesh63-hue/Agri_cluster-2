import { useMemo } from "react";
import type { ClusterAlert, ClusterFarm, CropListing, ResourceDemand } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useAppStore, type State } from "../../store/AppStore";
import { analyzeCluster, getClusterData, type ClusterData } from "../../services/api/demoApi";
import { DEMO_NOW } from "../../data/mock/clock";

export type Status = "healthy" | "moderate" | "alert";

export interface ClusterView extends ClusterData {
  /** Roster with live changes from member activity applied. */
  farms: ClusterFarm[];
  alerts: ClusterAlert[];
  /** Resource demand including requests made in the app. */
  demand: ResourceDemand[];
  supplyView: { crop: string; grade: string; window: { start: string; end: string }; expectedTonnes: number; demandTonnes: number; listedTonnes: number }[];
  listings: CropListing[];
  waterStatus: Status;
  belowNeedShare: number;
  avgHealth: number;
  farmsDelayed: number;
  /** Farms whose farmer accepted a delay suggestion today. */
  delayedFarms: ClusterFarm[];
  /** Impact of suggestions accepted by member farmers today (indicative). */
  accepted: { count: number; waterLitres: number; gridKwh: number };
  activity: { decisions: number; accepted: number; listings: number; bookings: number; labourRequests: number; consultations: number; serviceRequests: number };
}

/** Cluster data + everything members have done in this session, as one view model. */
export function useClusterView() {
  const data = useAsync(getClusterData, []);
  const store = useAppStore();

  const view = useMemo(
    () => (data.status === "success" ? buildView(data.data, store) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.status === "success" ? data.data : null, store.decisions, store.listings, store.bookings, store.labourRequests, store.consultations, store.serviceRequests],
  );

  if (data.status !== "success") return data;
  return { status: "success" as const, data: view!, retry: data.retry };
}

function buildView(d: ClusterData, s: State): ClusterView {
  const accepted = d.memberRecommendations.filter((r) => s.decisions[r.id]?.status === "accepted");
  const delayedFarm27 = accepted.some((r) => r.domain === "water" && r.effect);
  const expertOnStress = s.consultations.some((c) => c.fieldId === "f27-2");

  // Live roster: Farm #27 reflects the farmer's own decisions.
  const farms = d.farms.map((f) =>
    f.label === "Farm #27" && delayedFarm27 ? { ...f, irrigationBeforeRain: false } : f,
  );

  // Live demand: every booking made in the app adds to the request count
  // (seeded demo bookings are already part of the base figures).
  const demand = d.resourceDemand.map((dem) => {
    const extra = s.bookings.filter(
      (b) => !b.seeded && b.date === dem.date && d.machinery.find((m) => m.id === b.machineryId)?.kind === dem.kind,
    ).length;
    return { ...dem, requested: dem.requested + extra };
  });
  const buyerRequirements = [...s.requirements, ...d.buyerRequirements];

  const listedTonnes: Record<string, number> = {};
  s.listings.forEach((l) => (listedTonnes[l.crop] = Math.round(((listedTonnes[l.crop] ?? 0) + l.quantityTonnes) * 10) / 10));

  const alerts = analyzeCluster({
    now: DEMO_NOW,
    forecast: d.forecast,
    farms,
    farmsDelayed: delayedFarm27 ? 1 : 0,
    stressFarmsWithExpert: expertOnStress ? 1 : 0,
    resourceDemand: demand,
    supply: d.supply,
    buyerRequirements,
    listedTonnes,
  });

  const supplyView = d.supply.map((sup) => ({
    crop: sup.crop,
    grade: sup.grade,
    window: sup.window,
    expectedTonnes: sup.expectedTonnes,
    demandTonnes: buyerRequirements
      .filter((r) => r.status === "open" && r.crop === sup.crop && r.grade === sup.grade)
      .reduce((sum, r) => sum + r.quantityTonnes, 0),
    listedTonnes: listedTonnes[sup.crop] ?? 0,
  }));

  const active = farms.filter((f) => f.active);
  const belowNeedShare = active.filter((f) => f.soilMoisturePct < f.minSoilMoisture).length / active.length;
  const waterStatus: Status = belowNeedShare > 0.4 ? "alert" : belowNeedShare > 0.2 ? "moderate" : "healthy";

  const fresh = <T extends { seeded?: boolean }>(list: T[]) => list.filter((x) => !x.seeded).length;

  return {
    ...d,
    buyerRequirements,
    farms,
    alerts,
    demand,
    supplyView,
    listings: s.listings,
    waterStatus,
    belowNeedShare,
    avgHealth: Math.round(active.reduce((sum, f) => sum + f.healthScore, 0) / active.length),
    farmsDelayed: delayedFarm27 ? 1 : 0,
    delayedFarms: delayedFarm27 ? d.farms.filter((f) => f.label === "Farm #27") : [],
    accepted: {
      count: accepted.length,
      waterLitres: accepted.reduce((sum, r) => sum + (r.impactEstimate?.waterLitres ?? 0), 0),
      gridKwh: accepted.reduce((sum, r) => sum + (r.impactEstimate?.gridKwhAvoided ?? 0), 0),
    },
    activity: {
      decisions: Object.keys(s.decisions).length,
      accepted: Object.values(s.decisions).filter((x) => x.status === "accepted").length,
      // Activity created in this demo session (seeded demo records excluded).
      listings: fresh(s.listings),
      bookings: fresh(s.bookings),
      labourRequests: fresh(s.labourRequests),
      consultations: fresh(s.consultations),
      serviceRequests: fresh(s.serviceRequests),
    },
  };
}
