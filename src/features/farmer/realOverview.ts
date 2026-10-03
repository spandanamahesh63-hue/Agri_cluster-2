import type { CropCycle, CropStage, FarmPlan } from "../../types";
import type { FarmerOverview } from "../../services/api/demoApi";
import type { Session } from "../../store/AppStore";
import { cropCatalogue } from "../../data/catalog/crops";
import { CLUSTER_ID } from "../../data/mock/users";
import { realFarmLabel } from "../shared/people";
import { memberById } from "../../services/mode";

const DAY = 86_400_000;
const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY).toISOString().slice(0, 10);

/** Rough stage from days since planting, as a share of the crop's growing period. */
function stageAt(share: number): CropStage {
  if (share < 0.15) return "nursery";
  if (share < 0.45) return "vegetative";
  if (share < 0.65) return "flowering";
  if (share < 0.85) return "fruit-development";
  if (share <= 1.1) return "harvest";
  return "post-harvest";
}

/**
 * A real farmer's farm, built only from what they told us in their plan: no
 * sensors, no weather feed, no sample data. Screens that need sensor readings
 * show "no sensor data yet" for real accounts instead.
 */
export function realFarmerOverview(session: Session, plan: FarmPlan, now: Date): FarmerOverview {
  const a = plan.assessment;
  const member = memberById(session.userId);
  const farmId = `farm-${session.userId}`;
  const fieldId = `${farmId}-1`;
  const acres = a?.landAcres ?? 0;

  const crop = cropCatalogue.find((c) => c.id === plan.cropId);
  let cycles: CropCycle[] = [];
  if (crop && plan.plantDate) {
    const [minDays, maxDays] = crop.growingDays;
    const days = (now.getTime() - new Date(plan.plantDate).getTime()) / DAY;
    const tonnes = Math.round(((crop.yieldPerAcreKg[0] + crop.yieldPerAcreKg[1]) / 2) * acres) / 1000;
    cycles = [
      {
        id: `cc-${session.userId}`,
        fieldId,
        crop: crop.name,
        sowingDate: plan.plantDate,
        stage: stageAt(days / ((minDays + maxDays) / 2)),
        harvestWindow: { start: addDays(plan.plantDate, minDays), end: addDays(plan.plantDate, maxDays) },
        expectedYieldTonnes: Math.round(tonnes * 10) / 10,
        expectedGrade: "A",
      },
    ];
  }

  return {
    user: { id: session.userId, role: "farmer", name: session.name, displayLabel: realFarmLabel(session.userId), clusterId: CLUSTER_ID, location: a?.location ?? member?.location ?? "" },
    cluster: { id: CLUSTER_ID, name: "AgriCluster", region: "Karnataka", farmerCount: 0, cultivatedAcres: 0, mainCrops: [], source: "live" },
    farm: {
      id: farmId,
      label: realFarmLabel(session.userId),
      ownerUserId: session.userId,
      clusterId: CLUSTER_ID,
      village: a?.location ?? member?.location ?? "",
      totalAcres: acres,
      irrigation: a?.irrigation ?? "rainfed",
      pump: { powerKw: 0, flowLitresPerHour: 0, energy: a?.solar ? "solar" : "grid" },
      fieldIds: [fieldId],
    },
    fields: [{ id: fieldId, farmId, name: "My farm", acres, activeCropCycleId: cycles[0]?.id }],
    cycles,
    latestReadings: {},
    sensorHistory: {},
    irrigation: [],
    waterHistory: [],
    energyHistory: [],
    forecast: null,
    recommendations: [],
    tractors: { total: 0, booked: 0 },
  };
}
