// AgriCluster IntelligenceEngine — deterministic, explainable rules.
//
// Each rule receives a snapshot of farm / weather / sensor / resource / market
// data and returns Recommendations that carry their own evidence, so the UI can
// always answer "why?". An ML or LLM layer can later sit behind the same
// interface without changing any screen.

import type {
  BuyerRequirement,
  ClusterAlert,
  ClusterFarm,
  ClusterSupply,
  CropCycle,
  Farm,
  Field,
  IrrigationEvent,
  Priority,
  Recommendation,
  ResourceDemand,
  SensorReading,
  WeatherForecast,
} from "../../types";
import { stageProfile } from "../../data/mock/agronomy";
import {
  daysBetween,
  formatDate,
  formatDateRange,
  formatHour,
  formatINR,
  formatKg,
  formatLitres,
  formatTime,
  hoursBetween,
} from "../../utils/format";

const SQ_M_PER_ACRE = 4046.86;
const RAIN_PROBABILITY_THRESHOLD = 70;
const MEANINGFUL_RAIN_MM = 10;
const HEALTH_DROP_ALERT = 10;
const HEALTH_FLOOR = 70;

export interface FarmSnapshot {
  now: Date;
  farm: Farm;
  fields: Field[];
  cycles: CropCycle[];
  sensorHistory: Record<string, SensorReading[]>;
  irrigation: IrrigationEvent[];
  forecast: WeatherForecast;
  buyerRequirements: BuyerRequirement[];
  resourceDemand: ResourceDemand[];
}

export interface ClusterSnapshot {
  now: Date;
  forecast: WeatherForecast;
  /** Roster with live changes applied (e.g. a farm that already delayed irrigation). */
  farms: ClusterFarm[];
  /** Farms that accepted a delay suggestion today. */
  farmsDelayed: number;
  /** Stressed farms whose farmer has already contacted an expert. */
  stressFarmsWithExpert: number;
  resourceDemand: ResourceDemand[];
  supply: ClusterSupply[];
  buyerRequirements: BuyerRequirement[];
  /** Tonnes already listed by farmers, per crop. */
  listedTonnes: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Farm-level analysis
// ---------------------------------------------------------------------------

export function analyzeFarm(s: FarmSnapshot): Recommendation[] {
  const recs = [...waterAndEnergyRules(s), ...cropHealthRules(s), ...harvestRules(s), ...marketRules(s)];
  return recs.sort(byPriority);
}

function waterAndEnergyRules(s: FarmSnapshot): Recommendation[] {
  const out: Recommendation[] = [];
  const { forecast, farm, now } = s;
  const hoursToRain = forecast.rainStartsAt ? hoursBetween(now, new Date(forecast.rainStartsAt)) : Infinity;
  const rainSoon =
    hoursToRain <= 24 &&
    forecast.rainProbabilityPct >= RAIN_PROBABILITY_THRESHOLD &&
    forecast.rainfallMm[0] >= MEANINGFUL_RAIN_MM;
  const hasSolar = farm.pump.energy !== "grid";
  const [solarStart, solarEnd] = forecast.solarPeak;

  for (const event of s.irrigation) {
    if (event.status !== "scheduled") continue;
    const scheduled = new Date(event.scheduledAt);
    if (hoursBetween(now, scheduled) > 24) continue;

    const field = s.fields.find((f) => f.id === event.fieldId);
    const cycle = s.cycles.find((c) => c.id === field?.activeCropCycleId);
    const reading = latest(s.sensorHistory[event.fieldId]);
    const profile = cycle && stageProfile(cycle.crop, cycle.stage);
    if (!field || !cycle || !reading || !profile) continue;

    const moisture = reading.soilMoisturePct;
    const adequate = moisture >= profile.minSoilMoisture;
    const litres = field.acres * SQ_M_PER_ACRE * profile.irrigationDepthMm;
    const pumpHours = litres / farm.pump.flowLitresPerHour;
    const kWh = pumpHours * farm.pump.powerKw;
    const scheduledHour = hourOf(scheduled);

    const baseEvidence = [
      { label: "Soil moisture", value: `${moisture}% (crop needs ≥ ${profile.minSoilMoisture}%)`, source: reading.source },
      { label: "Crop stage", value: `${cycle.crop} · ${stageLabel(cycle.stage)}`, source: "demo" as const },
      { label: "Irrigation scheduled", value: `Today, ${formatTime(event.scheduledAt)}`, source: "demo" as const },
    ];
    const rainEvidence = {
      label: "Rain forecast",
      value: `${forecast.rainProbabilityPct}% chance, ${forecast.rainfallMm[0]}–${forecast.rainfallMm[1]} mm from ${formatTime(forecast.rainStartsAt!)}`,
      source: forecast.source,
    };

    if (rainSoon && adequate) {
      out.push({
        id: `water-delay-${field.id}`,
        domain: "water",
        priority: "high",
        title: `Consider delaying ${field.name} irrigation by 24 hours`,
        situation: `Rain is expected in about ${Math.round(hoursToRain)} hours and ${field.name} soil moisture is already adequate.`,
        whyItMatters: `Irrigating just before ${forecast.rainfallMm[0]}–${forecast.rainfallMm[1]} mm of rain uses water and pumping energy the crop is unlikely to need, and can waterlog the root zone during fruiting.`,
        evidence: [rainEvidence, ...baseEvidence],
        impact: `Could avoid about ${formatLitres(litres)} of water and ~${kWh.toFixed(0)} kWh of pumping (indicative estimate).`,
        action: { label: "Review irrigation", to: `/farmer/intelligence/water-delay-${field.id}` },
        fieldId: field.id,
        farmId: farm.id,
        effect: {
          kind: "reschedule-irrigation",
          eventId: event.id,
          newTime: toIstIso(new Date(scheduled.getTime() + 24 * 36e5)),
          durationHours: event.durationHours,
          summary: `Delayed to tomorrow, ${formatTime(event.scheduledAt)}`,
        },
        impactEstimate: { waterLitres: litres, gridKwhAvoided: kWh },
      });
    } else if (!adequate && hasSolar && (scheduledHour < solarStart || scheduledHour >= solarEnd)) {
      const shortened = rainSoon;
      const plannedLitres = shortened ? litres / 2 : litres;
      out.push({
        id: `energy-solar-${field.id}`,
        domain: "energy",
        priority: "medium",
        title: shortened
          ? `Consider a shorter ${field.name} irrigation in the ${formatHour(solarStart)}–${formatHour(solarEnd)} solar window`
          : `Consider moving ${field.name} irrigation to the ${formatHour(solarStart)}–${formatHour(solarEnd)} solar window`,
        situation: `${field.name} soil moisture (${moisture}%) is below what ${cycle.crop.toLowerCase()} at ${stageLabel(cycle.stage).toLowerCase()} needs, and irrigation is planned on grid power at ${formatTime(event.scheduledAt)}.`,
        whyItMatters: shortened
          ? `The crop needs some water now, but evening rain should cover the rest. A half-depth irrigation during peak solar hours meets the need without grid energy.`
          : `Running the pump during peak solar hours reduces grid electricity use for the same water delivered.`,
        evidence: [
          ...baseEvidence,
          { label: "Solar generation", value: `Expected high ${formatHour(solarStart)}–${formatHour(solarEnd)}`, source: forecast.source },
          { label: "Pump", value: `${farm.pump.powerKw} kW, ${farm.pump.energy.replace("+", " + ")}`, source: "demo" },
          ...(shortened ? [rainEvidence] : []),
        ],
        impact: `About ${(plannedLitres / farm.pump.flowLitresPerHour * farm.pump.powerKw).toFixed(1)} kWh on solar instead of grid${
          shortened ? `, and ~${formatLitres(litres - plannedLitres)} less water` : ""
        } (indicative estimate).`,
        action: { label: "Review pumping schedule", to: `/farmer/intelligence/energy-solar-${field.id}` },
        fieldId: field.id,
        farmId: farm.id,
        effect: {
          kind: "reschedule-irrigation",
          eventId: event.id,
          newTime: `${event.scheduledAt.slice(0, 10)}T${String(solarStart).padStart(2, "0")}:00:00+05:30`,
          durationHours: Math.round((plannedLitres / farm.pump.flowLitresPerHour) * 4) / 4,
          summary: `${shortened ? "Shortened and moved" : "Moved"} to ${formatHour(solarStart)} (solar)`,
        },
        impactEstimate: {
          waterLitres: litres - plannedLitres,
          gridKwhAvoided: (litres / farm.pump.flowLitresPerHour) * farm.pump.powerKw,
        },
      });
    } else if (!adequate && !rainSoon) {
      out.push({
        id: `water-irrigate-${field.id}`,
        domain: "water",
        priority: "high",
        title: `${field.name} is likely to need irrigation today`,
        situation: `Soil moisture has dropped to ${moisture}% and no meaningful rain is forecast.`,
        whyItMatters: `Water stress at ${stageLabel(cycle.stage).toLowerCase()} can reduce yield and quality.`,
        evidence: baseEvidence,
        action: { label: "Review irrigation", to: `/farmer/intelligence/water-irrigate-${field.id}` },
        fieldId: field.id,
        farmId: farm.id,
      });
    }
  }
  return out;
}

function cropHealthRules(s: FarmSnapshot): Recommendation[] {
  const out: Recommendation[] = [];
  for (const field of s.fields) {
    const history = s.sensorHistory[field.id];
    const now = latest(history);
    const cycle = s.cycles.find((c) => c.id === field.activeCropCycleId);
    if (!history || !now || !cycle) continue;

    const earlier = history[0];
    const drop = earlier.cropHealthScore - now.cropHealthScore;
    if (drop < HEALTH_DROP_ALERT && now.cropHealthScore >= HEALTH_FLOOR) continue;

    const fungalConditions = now.leafWetnessHours >= 10 && now.humidityPct >= 85;
    const days = daysBetween(new Date(earlier.at), new Date(now.at));
    out.push({
      id: `crop-inspect-${field.id}`,
      domain: "crop",
      priority: "high",
      title: `${field.name} shows possible crop stress — inspection suggested`,
      situation: `The crop health index for ${field.name} (${cycle.crop}) fell from ${earlier.cropHealthScore} to ${now.cropHealthScore} over ${days} days.`,
      whyItMatters: fungalConditions
        ? `Long leaf-wetness periods and high humidity favour fungal leaf diseases such as early blight. Early inspection limits spread to neighbouring plants and fields.`
        : `A sustained decline can indicate pest, nutrient or water problems that are cheaper to address early.`,
      evidence: [
        { label: "Crop health index", value: `${earlier.cropHealthScore} → ${now.cropHealthScore} (${days} days)`, source: now.source },
        { label: "Leaf wetness", value: `${now.leafWetnessHours} h/day`, source: now.source },
        { label: "Humidity", value: `${now.humidityPct}%`, source: now.source },
        { label: "Crop stage", value: `${cycle.crop} · ${stageLabel(cycle.stage)}`, source: "demo" },
      ],
      impact: "Early detection can reduce avoidable crop loss. Confirm on the ground before any treatment.",
      action: { label: `Inspect ${field.name}`, to: `/farmer/intelligence/crop-inspect-${field.id}` },
      fieldId: field.id,
      farmId: s.farm.id,
    });
  }
  return out;
}

/** One harvest per crop and grade: fields of the same crop are one harvest, not separate ones. */
export interface HarvestGroup {
  crop: string;
  grade: CropCycle["expectedGrade"];
  window: { start: string; end: string };
  tonnes: number;
  cycleIds: string[];
  fieldIds: string[];
  fieldNames: string[];
}

export function harvestGroups(cycles: CropCycle[], fields: Field[]): HarvestGroup[] {
  const groups = new Map<string, HarvestGroup>();
  for (const c of cycles) {
    const key = `${c.crop}|${c.expectedGrade}`;
    const g = groups.get(key) ?? { crop: c.crop, grade: c.expectedGrade, window: { ...c.harvestWindow }, tonnes: 0, cycleIds: [], fieldIds: [], fieldNames: [] };
    g.cycleIds.push(c.id);
    g.window.start = c.harvestWindow.start < g.window.start ? c.harvestWindow.start : g.window.start;
    g.window.end = c.harvestWindow.end > g.window.end ? c.harvestWindow.end : g.window.end;
    g.tonnes = Math.round((g.tonnes + c.expectedYieldTonnes) * 10) / 10;
    g.fieldIds.push(c.fieldId);
    g.fieldNames.push(fields.find((f) => f.id === c.fieldId)?.name ?? c.fieldId);
    groups.set(key, g);
  }
  return [...groups.values()];
}

const whereLabel = (g: HarvestGroup) => (g.fieldNames.length > 1 ? `${g.fieldNames.join(" and ")}` : g.fieldNames[0]);

function harvestRules(s: FarmSnapshot): Recommendation[] {
  const out: Recommendation[] = [];
  for (const g of harvestGroups(s.cycles, s.fields)) {
    const daysToHarvest = daysBetween(s.now, new Date(g.window.start));
    if (daysToHarvest < 0 || daysToHarvest > 10) continue;
    const transport = s.resourceDemand.find((d) => d.kind === "transport" && d.date >= g.window.start && d.date <= g.window.end);
    const constrained = transport && transport.requested > transport.available;
    out.push({
      id: `harvest-plan-${g.crop.toLowerCase()}`,
      domain: "resource",
      priority: constrained ? "medium" : "low",
      title: constrained
        ? `Consider booking harvest transport early for your ${g.crop.toLowerCase()}`
        : `${g.crop} harvest window opens in ${daysToHarvest} days`,
      situation: `Your ${g.crop.toLowerCase()} harvest (${whereLabel(g)}) is due ${formatDateRange(g.window.start, g.window.end)}, in ${daysToHarvest} days, with about ${formatKg(g.tonnes)} expected.`,
      whyItMatters: constrained
        ? `Many farms in the cluster harvest in the same window, so transport is already over-requested. Booking early reduces the risk of produce waiting in the field.`
        : `Planning labour, crates and transport ahead of the window helps avoid post-harvest loss.`,
      evidence: [
        { label: "Harvest window", value: formatDateRange(g.window.start, g.window.end), source: "demo" },
        { label: "Expected harvest", value: `${formatKg(g.tonnes)}, Grade ${g.grade}`, source: "indicative" },
        ...(transport
          ? [{ label: `Cluster transport on ${formatDate(transport.date)}`, value: `${transport.requested} requests · ${transport.available} vehicles`, source: "demo" as const }]
          : []),
      ],
      action: { label: "Request transport", to: "/farmer/resources?tab=machinery&kind=transport" },
      fieldId: g.fieldIds[0],
      fieldIds: g.fieldIds,
      farmId: s.farm.id,
    });
  }
  return out;
}

function marketRules(s: FarmSnapshot): Recommendation[] {
  const out: Recommendation[] = [];
  for (const g of harvestGroups(s.cycles, s.fields)) {
    for (const req of s.buyerRequirements) {
      if (req.status !== "open" || req.crop !== g.crop || req.grade !== g.grade) continue;
      if (!overlaps(g.window, req.window)) continue;
      const [lo, hi] = req.indicativePricePerKg;
      const kg = g.tonnes * 1000;
      out.push({
        id: `market-${req.id}-${g.crop.toLowerCase()}`,
        domain: "market",
        priority: "medium",
        title: `Buyer demand for Grade ${req.grade} ${req.crop.toLowerCase()} matches your harvest`,
        situation: `A ${req.buyerLabel.toLowerCase()} is looking for ${req.quantityTonnes} t of Grade ${req.grade} ${req.crop.toLowerCase()} for ${formatDateRange(req.window.start, req.window.end)}, the same window as your expected harvest.`,
        whyItMatters: `Listing expected produce before harvest lets the cluster pool supply for larger buyers and plan transport together.`,
        evidence: [
          { label: "Buyer requirement", value: `${req.quantityTonnes} t · Grade ${req.grade} · ${formatDateRange(req.window.start, req.window.end)}`, source: req.source },
          { label: "Indicative price", value: `₹${lo}–${hi}/kg`, source: "indicative" },
          { label: "Your expected harvest", value: `${formatKg(g.tonnes)}, Grade ${g.grade} (${whereLabel(g)})`, source: "indicative" },
        ],
        impact: `Indicative value ${formatINR(kg * lo)}–${formatINR(kg * hi)}. Not a confirmed sale.`,
        action: { label: "View buyer request", to: "/farmer/market" },
        fieldId: g.fieldIds[0],
        fieldIds: g.fieldIds,
        farmId: s.farm.id,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cluster-level analysis
// ---------------------------------------------------------------------------

export function analyzeCluster(s: ClusterSnapshot): ClusterAlert[] {
  const alerts: ClusterAlert[] = [];
  const { forecast } = s;
  const active = s.farms.filter((f) => f.active);
  const irrigating = active.filter((f) => f.irrigationBeforeRain);

  if (forecast.rainStartsAt && forecast.rainProbabilityPct >= RAIN_PROBABILITY_THRESHOLD && irrigating.length > 0) {
    const hours = Math.round(hoursBetween(s.now, new Date(forecast.rainStartsAt)));
    const adequate = irrigating.filter((f) => f.soilMoisturePct >= f.minSoilMoisture).length;
    alerts.push({
      id: "cl-water-rain",
      domain: "water",
      priority: "high",
      title: `Rain expected in ${hours} hours — ${irrigating.length} farms still plan to irrigate first`,
      detail: `${adequate} of them already have adequate soil moisture. Each farm has been sent a delay suggestion; the farmer decides.`,
      evidence: [
        {
          label: "Rain forecast",
          value: `${forecast.rainProbabilityPct}% chance, ${forecast.rainfallMm[0]}–${forecast.rainfallMm[1]} mm from ${formatTime(forecast.rainStartsAt)}`,
          source: forecast.source,
        },
        { label: "Farms with irrigation before the rain", value: `${irrigating.length}`, source: "demo" },
        { label: "Of these, soil moisture adequate", value: `${adequate}`, source: "simulated" },
        { label: "Farms that already delayed today", value: `${s.farmsDelayed}`, source: "demo" },
      ],
      action: { label: "Review irrigation schedule", to: "/cluster/water" },
      affectedFarms: irrigating.length,
    });
  }

  const stressed = active.filter((f) => f.possibleStress);
  if (stressed.length > 0) {
    const avg = Math.round(stressed.reduce((sum, f) => sum + f.healthScore, 0) / stressed.length);
    alerts.push({
      id: "cl-crop-stress",
      domain: "crop",
      priority: "high",
      title: `Possible crop stress detected in ${stressed.length} farms`,
      detail: `All are tomato farms in humid, wet-leaf conditions that favour fungal disease. Inspection suggested before it spreads between neighbouring fields.`,
      evidence: [
        { label: "Farms affected", value: `${stressed.length} (${[...new Set(stressed.map((f) => f.village))].join(", ")})`, source: "simulated" },
        { label: "Average health index", value: `${avg} (cluster average ${Math.round(active.reduce((sum, f) => sum + f.healthScore, 0) / active.length)})`, source: "simulated" },
        { label: "Farmers who contacted an expert", value: `${s.stressFarmsWithExpert} of ${stressed.length}`, source: "demo" },
      ],
      action: { label: "Inspect affected farms", to: "/cluster/crops" },
      affectedFarms: stressed.length,
    });
  }

  for (const d of s.resourceDemand) {
    if (d.requested <= d.available) continue;
    alerts.push({
      id: `cl-resource-${d.kind}-${d.date}`,
      domain: "resource",
      priority: "medium",
      title: `${capitalize(d.kind)} demand exceeds availability on ${formatDate(d.date)}`,
      detail: `${d.requested} requests for ${d.available} available — a gap of ${d.requested - d.available}. Consider external providers or staggering slots.`,
      evidence: [
        { label: "Requests", value: `${d.requested}`, source: "demo" },
        { label: "Available in cluster", value: `${d.available}`, source: "demo" },
        { label: "Gap", value: `${d.requested - d.available}`, source: "demo" },
      ],
      action: { label: "Find additional providers", to: "/cluster/resources" },
    });
  }

  for (const supply of s.supply) {
    const demand = s.buyerRequirements
      .filter((r) => r.status === "open" && r.crop === supply.crop && r.grade === supply.grade && overlaps(r.window, supply.window))
      .reduce((sum, r) => sum + r.quantityTonnes, 0);
    if (demand === 0) continue;
    const listed = s.listedTonnes[supply.crop] ?? 0;
    alerts.push({
      id: `cl-market-${supply.crop}-${supply.grade}`,
      domain: "market",
      priority: "medium",
      title: `Buyer demand for Grade ${supply.grade} ${supply.crop.toLowerCase()}: ${demand} t`,
      detail: `The cluster expects ${supply.expectedTonnes} t for ${formatDateRange(supply.window.start, supply.window.end)}; ${listed} t listed by farmers so far. No sale is confirmed until buyer and farmer agree.`,
      evidence: [
        { label: "Open buyer demand", value: `${demand} t`, source: "demo" },
        { label: "Expected cluster supply", value: `${supply.expectedTonnes} t`, source: supply.source },
        { label: "Listed by farmers so far", value: `${listed} t`, source: "demo" },
      ],
      action: { label: "View buyer requests", to: "/cluster/market" },
    });
  }

  const [solarStart, solarEnd] = forecast.solarPeak;
  const solarCandidates = active.filter((f) => f.solarPump && f.soilMoisturePct < f.minSoilMoisture);
  if (solarCandidates.length > 0) {
    alerts.push({
      id: "cl-energy-solar",
      domain: "energy",
      priority: "low",
      title: `${solarCandidates.length} solar-pump farms need water today`,
      detail: `Irrigating them in the ${formatHour(solarStart)}–${formatHour(solarEnd)} solar window instead of evening grid hours reduces grid use.`,
      evidence: [
        { label: "Solar-pump farms below crop need", value: `${solarCandidates.length}`, source: "simulated" },
        { label: "Strong solar expected", value: `${formatHour(solarStart)}–${formatHour(solarEnd)}`, source: forecast.source },
      ],
      action: { label: "Review energy", to: "/cluster/energy" },
      affectedFarms: solarCandidates.length,
    });
  }

  return alerts.sort(byPriority);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
function byPriority(a: { priority: Priority }, b: { priority: Priority }) {
  return priorityRank[a.priority] - priorityRank[b.priority];
}

function latest<T>(list: T[] | undefined): T | undefined {
  return list?.[list.length - 1];
}

/** ISO string in India Standard Time, e.g. "2026-09-28T17:00:00+05:30". */
function toIstIso(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 36e5);
  return ist.toISOString().slice(0, 19) + "+05:30";
}

export function hourOf(date: Date): number {
  return Number(date.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
}

function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return a.start <= b.end && b.start <= a.end;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function stageLabel(stage: CropCycle["stage"]): string {
  return {
    nursery: "Nursery",
    vegetative: "Vegetative",
    flowering: "Flowering",
    "fruit-development": "Fruit development",
    harvest: "Harvest",
    "post-harvest": "Post-harvest",
  }[stage];
}
