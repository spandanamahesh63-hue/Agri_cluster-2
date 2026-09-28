// AgriCluster planner — transparent, rule-based recommendations for the
// farmer decision journey (AGRI CLUSTER master prompt §29).
//
// Every function returns its reasons alongside its result, so the UI can
// always answer "Why are we suggesting this?". The rules are deliberately
// simple and easy to replace with a real recommendation engine later.
// All money and yield figures are indicative sample values.

import type {
  BudgetCategory,
  BudgetLine,
  CalendarTask,
  CropProfile,
  ExpertCategory,
  FarmAssessment,
  Level,
  Machinery,
  MethodProfile,
  Vision,
} from "../../types";
import { cropCatalogue } from "../../data/catalog/crops";
import { equipmentBuyPrice, methodCatalogue } from "../../data/catalog/methods";
import { supportCatalogue, type SupportContext } from "../../data/catalog/support";
import { formatINR } from "../../utils/format";

const levelIndex: Record<Level, number> = { low: 0, moderate: 1, high: 2 };
const mid = ([a, b]: [number, number]) => (a + b) / 2;
const round100 = (n: number) => Math.round(n / 100) * 100;

/** Spandana's sample assessment (spec §38). Demo values, editable in the journey. */
export const DEMO_ASSESSMENT: FarmAssessment = {
  name: "Spandana",
  contact: "",
  location: "Chamarajanagara, Karnataka",
  landAcres: 1,
  tenure: "owned",
  currentCrop: "Tomato",
  previousCrop: "Ragi (finger millet)",
  soilType: "red",
  soilTestDone: false,
  water: "moderate",
  irrigation: "drip",
  electricity: "limited",
  solar: true,
  ownsMachinery: false,
  labourAvailable: "moderate",
  investment: 150000,
  needsLoan: false,
  experienceYears: 6,
  techFamiliarity: "moderate",
};

export const DEMO_VISION: Vision = { mode: "investment", amount: 150000 };

/** Money the plan works with: the vision amount for mode A, otherwise the assessment's investment. */
export function availableBudget(a: FarmAssessment, v?: Vision): number {
  return v?.mode === "investment" && v.amount ? v.amount : a.investment;
}

// ---------------------------------------------------------------------------
// Crops

export interface Estimate {
  investment: [number, number];
  yieldKg: [number, number];
  revenue: [number, number];
  net: [number, number];
}

export interface CropRecommendation {
  crop: CropProfile;
  score: number;
  fit: "good" | "possible" | "not-suited";
  reasons: string[];
  cautions: string[];
  estimate: Estimate;
  /** Income-goal mode: acres needed to reach the target at the midpoint estimate. */
  acresForTarget?: number;
}

export function estimateFor(crop: CropProfile, acres: number, methodFactor = 1): Estimate {
  const investment: [number, number] = [round100(crop.investmentPerAcre[0] * acres * methodFactor), round100(crop.investmentPerAcre[1] * acres * methodFactor)];
  const yieldKg: [number, number] = [Math.round(crop.yieldPerAcreKg[0] * acres), Math.round(crop.yieldPerAcreKg[1] * acres)];
  const revenue: [number, number] = [round100(yieldKg[0] * crop.priceRangePerKg[0]), round100(yieldKg[1] * crop.priceRangePerKg[1])];
  return { investment, yieldKg, revenue, net: [revenue[0] - investment[1], revenue[1] - investment[0]] };
}

const sameCrop = (a: string, b: string) => a.toLowerCase().startsWith(b.toLowerCase().split(" ")[0]);

export function recommendCrops(a: FarmAssessment, v: Vision): CropRecommendation[] {
  const budget = availableBudget(a, v);
  const scored = cropCatalogue
    .map((crop) => {
      let score = 50;
      let blockers = 0; // hard mismatches: soil, water, budget
      const reasons: string[] = [];
      const cautions: string[] = [];
      const est = estimateFor(crop, a.landAcres);

      if (crop.suitedSoils.includes(a.soilType)) {
        score += 12;
        reasons.push(`Grows well in ${a.soilType} soil like yours.`);
      } else {
        score -= 20;
        blockers++;
        cautions.push(`Not usually grown in ${a.soilType} soil.`);
      }

      const gap = levelIndex[crop.water] - levelIndex[a.water];
      if (gap > 0) {
        score -= 25;
        blockers++;
        cautions.push(`Needs more water than you said you have (${crop.water} vs ${a.water}).`);
      } else if (gap === 0) {
        score += 8;
        reasons.push(`Its water need (${crop.water}) matches what you have.`);
      } else {
        score += 5;
        reasons.push("Needs less water than you have, which lowers risk in a dry spell.");
      }
      if (a.irrigation === "drip" && crop.water !== "low") {
        score += 5;
        reasons.push("Your drip system suits it.");
      }

      if (est.investment[0] > budget) {
        score -= 30;
        blockers++;
        cautions.push(`Typical cost ${formatINR(est.investment[0])}–${formatINR(est.investment[1])} is above your ${formatINR(budget)}.`);
      } else if (est.investment[1] <= budget) {
        score += 10;
        reasons.push(`Typical cost (${formatINR(est.investment[0])}–${formatINR(est.investment[1])}) fits within your ${formatINR(budget)}.`);
      } else {
        score += 4;
        reasons.push(`Your ${formatINR(budget)} covers the lower end of the typical cost.`);
      }

      if (crop.labour === "high" && a.labourAvailable === "low") {
        score -= 12;
        cautions.push("Needs a lot of labour. Shared crews in the cluster can help.");
      }

      if (sameCrop(a.currentCrop, crop.name)) {
        score += 12;
        reasons.push(`You're growing ${crop.name.toLowerCase()} now, so you know it.`);
      } else if (sameCrop(a.previousCrop, crop.name)) {
        score += 6;
        reasons.push(`You have grown ${crop.name.toLowerCase()} before.`);
      }

      // Income potential per acre (indicative midpoint).
      const netMid = mid(estimateFor(crop, 1).net);
      score += Math.max(0, Math.min(12, Math.round(netMid / 10000)));
      if (netMid >= 80000) reasons.push(`Higher income potential per acre than most options (indicative).`);
      else if (netMid < 30000) cautions.push("Lower income potential per acre (indicative).");

      if (crop.demand === "high") {
        score += 8;
        reasons.push("Buyers in the cluster are asking for it.");
      }
      if (crop.techSuitability !== "low" && a.techFamiliarity !== "low") {
        score += 4;
        reasons.push("Benefits from the technology you're comfortable with.");
      }

      let acresForTarget: number | undefined;
      if (v.mode === "income" && v.amount) {
        const netPerAcre = mid(estimateFor(crop, 1).net);
        if (netPerAcre > 0) {
          acresForTarget = Math.round((v.amount / netPerAcre) * 10) / 10;
          if (acresForTarget <= a.landAcres) {
            score += 15;
            reasons.push(`Could reach a ${formatINR(v.amount)} income on about ${acresForTarget} acre${acresForTarget === 1 ? "" : "s"} (indicative).`);
          } else {
            score -= 10;
            cautions.push(`Would need about ${acresForTarget} acres to reach ${formatINR(v.amount)} (indicative); you have ${a.landAcres}.`);
          }
        }
      }
      if (v.mode === "guided" && crop.risks.length <= 2) {
        score += 5;
        reasons.push("Fewer major risks, which suits a first plan.");
      }

      return { crop, score, blockers, reasons, cautions: [...cautions, ...crop.risks.slice(0, 1)], estimate: est, acresForTarget };
    })
    .sort((x, y) => y.score - x.score);

  // Fit is relative to the best option for this farm, and capped by hard mismatches.
  const best = scored[0]?.score ?? 0;
  return scored.map(({ blockers, ...r }) => ({
    ...r,
    fit: blockers >= 2 ? "not-suited" : blockers === 1 ? "possible" : best - r.score <= 8 ? "good" : "possible",
  }));
}

// ---------------------------------------------------------------------------
// Methods

export interface MethodRecommendation {
  method: MethodProfile;
  score: number;
  reasons: string[];
  cautions: string[];
}

/** Only methods relevant to the crop, ranked for this farm (spec §8: don't show everything). */
export function recommendMethods(crop: CropProfile, a: FarmAssessment, budget: number): MethodRecommendation[] {
  const typical = estimateFor(crop, a.landAcres).investment;
  return methodCatalogue
    .filter((m) => crop.methodIds.includes(m.id))
    .map((method) => {
      let score = 50;
      const reasons: string[] = [];
      const cautions: string[] = [];
      const id = method.id;

      if (a.water === "low" && ["less-water", "drip", "smart-irrigation"].includes(id)) {
        score += 20;
        reasons.push("Makes the most of limited water.");
      }
      if (a.irrigation === "drip" && ["precision", "smart-irrigation", "drip"].includes(id)) {
        score += id === "drip" ? 5 : 18;
        reasons.push(id === "drip" ? "You already have drip; this keeps it simple." : "Builds on the drip system you already have.");
      }
      if (id === "protected" && budget < typical[1] * 1.8) {
        score -= 30;
        cautions.push("A net house or polyhouse usually needs much more investment than your budget.");
      }
      if (["precision", "smart-irrigation"].includes(id)) {
        if (a.techFamiliarity === "low") {
          score -= 12;
          cautions.push("Needs some comfort with phones and sensors. Training is available.");
        } else {
          score += 8;
          reasons.push("Suits the technology you're comfortable with.");
        }
      }
      if (id === "smart-irrigation" && a.solar) {
        score += 4;
        reasons.push("Pairs well with your solar pump to save grid power.");
      }
      if (id === "organic" && a.labourAvailable !== "low") {
        score += 4;
        reasons.push("You have labour for compost and weeding.");
      }
      if (crop.demand === "high" && id === "precision") {
        score += 6;
        reasons.push("Helps produce consistent Grade A quality that buyers ask for.");
      }
      return { method, score, reasons, cautions };
    })
    .sort((x, y) => y.score - x.score);
}

// ---------------------------------------------------------------------------
// Investment

/** Relative cost of each method compared with conventional practice (indicative). */
export const methodCostFactor: Record<string, number> = {
  precision: 1.1,
  drip: 1,
  "smart-irrigation": 1.05,
  protected: 2.5,
  organic: 0.9,
  "less-water": 0.85,
  integrated: 1,
};

const baseShares: Record<BudgetCategory, number> = {
  "Seeds & planting material": 10,
  "Soil preparation": 8,
  Irrigation: 10,
  Inputs: 22,
  Technology: 4,
  Labour: 26,
  Machinery: 7,
  Transport: 5,
  Storage: 3,
  Reserve: 5,
};

const methodShift: Record<string, Partial<Record<BudgetCategory, number>>> = {
  precision: { Technology: 5, Irrigation: 2, Inputs: -3, Labour: -4 },
  "smart-irrigation": { Technology: 5, Labour: -3, Irrigation: -2 },
  drip: { Irrigation: 4, Labour: -4 },
  organic: { Inputs: -6, Labour: 6, "Soil preparation": 3, Technology: -3 },
  protected: { Technology: 10, Irrigation: 4, Labour: -6, Inputs: -4, Reserve: -4 },
  "less-water": { Irrigation: -3, "Soil preparation": 3 },
  integrated: { "Soil preparation": 2, Inputs: -2 },
};

const budgetNotes: Partial<Record<BudgetCategory, string>> = {
  Machinery: "Rented through the cluster, not bought",
  Reserve: "For weather, pests or price dips",
  Technology: "Shared sensors and alerts",
  Storage: "Crates and short cold-room use",
};

/** Split a budget across categories for the chosen method. Always sums to the budget. */
export function allocateBudget(budget: number, method?: MethodProfile): BudgetLine[] {
  const shares = { ...baseShares };
  for (const [cat, delta] of Object.entries(method ? methodShift[method.id] ?? {} : {})) {
    shares[cat as BudgetCategory] = Math.max(1, shares[cat as BudgetCategory] + (delta ?? 0));
  }
  const total = Object.values(shares).reduce((s, x) => s + x, 0);
  const lines = (Object.keys(shares) as BudgetCategory[]).map((category) => ({
    category,
    amount: round100((budget * shares[category]) / total),
    note: budgetNotes[category],
  }));
  // Put rounding drift in Reserve so the lines always add up exactly.
  const drift = budget - lines.reduce((s, l) => s + l.amount, 0);
  lines.find((l) => l.category === "Reserve")!.amount += drift;
  return lines;
}

/** Typical cost for this crop, area and method (indicative). */
export function typicalCost(crop: CropProfile, acres: number, method?: MethodProfile): [number, number] {
  return estimateFor(crop, acres, method ? methodCostFactor[method.id] ?? 1 : 1).investment;
}

export interface RentOption {
  kind: string;
  label: string;
  buyPrice: number;
  seasonHours: number;
  rentForSeason: number;
  providers: number;
  ratePerHour: number;
}

/** Buy vs rent for the equipment the method needs (spec §10). */
export function buyVsRent(method: MethodProfile | undefined, acres: number, machinery: Machinery[]): RentOption[] {
  const kinds = (method?.needs ?? ["tractor"]).filter((k) => k in equipmentBuyPrice);
  return kinds.map((kind) => {
    const info = equipmentBuyPrice[kind];
    const offers = machinery.filter((m) => m.kind === kind && m.status !== "maintenance");
    const ratePerHour = offers.length ? Math.min(...offers.map((m) => m.ratePerHour)) : 900;
    const seasonHours = Math.max(1, Math.round(info.seasonHours * acres));
    return { kind, label: info.label, buyPrice: info.price, seasonHours, rentForSeason: ratePerHour * seasonHours, providers: offers.length, ratePerHour };
  });
}

// ---------------------------------------------------------------------------
// Cropping plan & calendar

// Date arithmetic on calendar dates, in UTC so time zones can't shift the day.
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Generate the season's calendar from the planting date (spec §21 cropping plan). */
export function buildCalendar(crop: CropProfile, method: MethodProfile | undefined, plantDate: string): CalendarTask[] {
  const harvest = crop.growingDays[0];
  const usesDrip = method ? ["precision", "drip", "smart-irrigation", "protected"].includes(method.id) : false;
  const t = (offset: number, title: string, stage: CalendarTask["stage"], resource?: string): CalendarTask => ({
    id: `${stage}-${offset}`,
    date: addDays(plantDate, offset),
    title,
    stage,
    resource,
  });
  const tasks: CalendarTask[] = [
    t(-21, "Soil test and field survey", "prepare", "Soil expert"),
    t(-14, "Plough and prepare beds", "prepare", "Tractor (rent)"),
    ...(usesDrip ? [t(-7, "Lay and test drip lines", "prepare", "Labour · irrigation")] : []),
    t(0, `Plant ${crop.name.toLowerCase()}`, "plant", "Labour · planting"),
    t(20, "First weeding and feeding", "grow", "Labour · weeding"),
    t(35, crop.labour === "high" ? "Stake and train plants" : "Second weeding", "grow", "Labour"),
    t(Math.round(harvest * 0.5), "Scout for pests and disease", "protect", "Crop expert (if needed)"),
    t(Math.round(harvest * 0.6), "Preventive spray if needed", "protect", "Sprayer (rent)"),
    t(harvest - 3, "Book harvest labour and crates", "harvest", "Labour · harvesting"),
    t(harvest - 2, "Arrange transport", "sell", "Transport (rent)"),
    t(harvest, "First harvest, grade and list", "harvest", "Buyer connection"),
    t(harvest + 2, "Deliver to buyer", "sell", "Transport"),
    t(crop.growingDays[1], "Final harvest and clear the field", "harvest", "Labour"),
  ];
  return tasks.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Resources & support

export interface ResourceNeeds {
  machinery: string[];
  labourTasks: string[];
  expertCategories: ExpertCategory[];
  technologyIds: string[];
}

export function resourceNeeds(crop: CropProfile, method: MethodProfile | undefined, a: FarmAssessment, budgetGap: number): ResourceNeeds {
  const needs = method?.needs ?? ["tractor"];
  const expertCategories: ExpertCategory[] = ["crop"];
  if (!a.soilTestDone) expertCategories.push("soil");
  if (method?.id === "precision") expertCategories.push("precision");
  if (method?.id === "organic") expertCategories.push("organic");
  if (method && ["precision", "drip", "smart-irrigation"].includes(method.id)) expertCategories.push("irrigation");
  if (["tomato", "chilli", "beans"].includes(crop.id)) expertCategories.push("pest");
  if (a.needsLoan || budgetGap > 0) expertCategories.push("finance");
  expertCategories.push("market");
  return {
    machinery: needs.filter((n) => !n.startsWith("tech-")),
    labourTasks: ["Planting", "Weeding", ...(crop.labour === "high" ? ["Harvesting", "Sorting & packing"] : ["Harvesting"])],
    expertCategories,
    technologyIds: needs.filter((n) => n.startsWith("tech-")),
  };
}

export function supportContext(a: FarmAssessment, crop: CropProfile | undefined, method: MethodProfile | undefined, budgetGap: number): SupportContext {
  return {
    cropId: crop?.id,
    methodIds: method ? [method.id] : [],
    irrigation: a.irrigation,
    water: a.water,
    electricity: a.electricity,
    solar: a.solar,
    soilTestDone: a.soilTestDone,
    needsLoan: a.needsLoan,
    budgetGap,
    techFamiliarity: a.techFamiliarity,
  };
}

/** Every support option with the reason it fits this farmer, or null when it isn't specially relevant. */
export function rankSupport(ctx: SupportContext) {
  return supportCatalogue.map((scheme) => ({ scheme, why: scheme.why(ctx) }));
}

/** Support options that fit the farmer's plan, government first. */
export function relevantSupport(a: FarmAssessment, crop: CropProfile | undefined, method: MethodProfile | undefined, budgetGap: number) {
  return rankSupport(supportContext(a, crop, method, budgetGap))
    .filter((r) => r.why)
    .sort((x, y) => (x.scheme.sector === y.scheme.sector ? 0 : x.scheme.sector === "government" ? -1 : 1));
}
