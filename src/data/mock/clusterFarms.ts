// The cluster roster: 128 farm summaries for the Mysuru Vegetable Cluster.
//
// Generated deterministically (seeded) and then normalised so the headline
// figures used across the prototype come *out of* the data rather than being
// typed in separately:
//   128 farms · 312 acres · 117 active
//   24 farms with irrigation scheduled before the rain
//   6 farms with possible crop stress
//   42 t of Grade A tomato expected for 4–7 Oct
// Farm #27 matches the detailed demo farm exactly.

import type { ClusterFarm, CropStage, InfrastructurePoint } from "../../types";
import { stageProfile } from "./agronomy";

export const CLUSTER_TARGETS = {
  farms: 128,
  acres: 312,
  active: 117,
  irrigationBeforeRain: 24,
  possibleStress: 6,
  tomatoAInWindowTonnes: 42,
};

export const TOMATO_WINDOW = { start: "2026-10-04", end: "2026-10-07" };

/** Village zones on the simulated map (not geographic). */
export const villages = [
  { name: "Varuna", x: 30, y: 30 },
  { name: "Yelwala", x: 16, y: 68 },
  { name: "Hootagalli", x: 50, y: 74 },
  { name: "Bilikere", x: 55, y: 26 },
  { name: "Jayapura", x: 80, y: 42 },
  { name: "Kadakola", x: 78, y: 78 },
];

export const infrastructure: InfrastructurePoint[] = [
  { id: "inf-weather", kind: "weather", name: "Cluster weather station", detail: "Rain, humidity, temperature every 15 min", pos: { x: 41, y: 49 } },
  { id: "inf-tank", kind: "water", name: "Varuna tank", detail: "Irrigation source for ~40 farms", pos: { x: 19, y: 43 } },
  { id: "inf-borewell", kind: "water", name: "Community borewell", detail: "Hootagalli · shared schedule", pos: { x: 62, y: 60 } },
  { id: "inf-depot", kind: "machinery", name: "Machinery yard", detail: "Shivakumar Agro Services · tractors, pickup, sprayer", pos: { x: 6, y: 84 } },
  { id: "inf-cold", kind: "storage", name: "Cold room (10 t)", detail: "Hootagalli · shared cold storage", pos: { x: 40, y: 91 } },
  { id: "inf-collect", kind: "collection", name: "Collection & grading centre", detail: "Jayapura · pooled dispatch to buyers", pos: { x: 90, y: 60 } },
  { id: "inf-market", kind: "market", name: "Buyers · Mysuru city", detail: "Retail aggregator, hotel supplier", pos: { x: 94, y: 12 } },
];

// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const halfRound = (n: number) => Math.round(n * 2) / 2;
const round1 = (n: number) => Math.round(n * 10) / 10;

interface Draft extends Omit<ClusterFarm, "pos"> {
  tomatoInWindow: boolean;
}

function buildRoster(): ClusterFarm[] {
  const rand = mulberry32(20260927);
  const drafts: Draft[] = [];

  for (let n = 1; n <= CLUSTER_TARGETS.farms; n++) {
    const village = villages[Math.floor(rand() * villages.length)].name;
    const r = rand();
    const crop = r < 0.45 ? "Tomato" : r < 0.7 ? "Chilli" : r < 0.88 ? "Onion" : "Leafy vegetables";
    const acres = 1 + rand() * 3;
    let stage: CropStage = "vegetative";
    let window = { start: "2026-11-10", end: "2026-11-30" };
    let grade: "A" | "B" | "C" = "B";
    let tomatoInWindow = false;
    if (crop === "Tomato") {
      const w = rand();
      grade = w < 0.75 ? "A" : "B";
      if (w < 0.45) {
        stage = "fruit-development";
        window = TOMATO_WINDOW;
        tomatoInWindow = grade === "A";
      } else if (w < 0.8) {
        stage = "flowering";
        window = { start: "2026-10-18", end: "2026-10-24" };
      } else {
        stage = "vegetative";
        window = { start: "2026-11-02", end: "2026-11-09" };
      }
    } else if (crop === "Chilli") {
      stage = rand() < 0.6 ? "flowering" : "vegetative";
    } else if (crop === "Onion") {
      stage = "vegetative";
      window = { start: "2026-10-12", end: "2026-10-20" };
    } else {
      stage = "vegetative";
      window = { start: "2026-10-01", end: "2026-10-03" };
      grade = "A";
    }
    const min = stageProfile(crop, stage)?.minSoilMoisture ?? 45;
    drafts.push({
      id: `cf-${n}`,
      label: `Farm #${n}`,
      village,
      acres,
      crop,
      stage,
      grade,
      harvestWindow: window,
      expectedTonnes: 0,
      soilMoisturePct: Math.round(min - 8 + rand() * 24),
      minSoilMoisture: min,
      healthScore: Math.round(76 + rand() * 16),
      irrigationBeforeRain: false,
      possibleStress: false,
      solarPump: rand() < 0.3,
      active: true,
      tomatoInWindow,
    });
  }

  // Farm #27 is the detailed demo farm — pin it to the real record.
  const f27 = drafts[26];
  Object.assign(f27, {
    village: "Varuna",
    crop: "Tomato",
    stage: "fruit-development",
    grade: "A",
    harvestWindow: TOMATO_WINDOW,
    acres: 2.5,
    soilMoisturePct: 64,
    minSoilMoisture: 55,
    healthScore: 78,
    solarPump: true,
    tomatoInWindow: true,
  });

  // Acres: scale the other farms so the cluster totals exactly 312 acres.
  const others = drafts.filter((d) => d !== f27);
  const rawSum = others.reduce((s, d) => s + d.acres, 0);
  const targetOthers = CLUSTER_TARGETS.acres - f27.acres;
  others.forEach((d) => (d.acres = Math.max(0.5, halfRound((d.acres * targetOthers) / rawSum))));
  let diff = targetOthers - others.reduce((s, d) => s + d.acres, 0);
  for (let i = 0; Math.abs(diff) >= 0.5; i = (i + 1) % others.length) {
    const step = diff > 0 ? 0.5 : -0.5;
    if (others[i].acres + step >= 0.5) {
      others[i].acres += step;
      diff -= step;
    }
  }

  // Expected harvest per farm (indicative t/acre for the upcoming window).
  const perAcre: Record<string, number> = { Tomato: 2.1, Chilli: 1.2, Onion: 7, "Leafy vegetables": 1.4 };
  drafts.forEach((d) => (d.expectedTonnes = round1(d.acres * perAcre[d.crop])));
  // Scale in-window Grade A tomato so it totals exactly 42 t (Farm #27 fixed at 3.2 t).
  f27.expectedTonnes = 3.2;
  const inWindow = drafts.filter((d) => d.tomatoInWindow && d !== f27);
  const target = CLUSTER_TARGETS.tomatoAInWindowTonnes - f27.expectedTonnes;
  const sum = inWindow.reduce((s, d) => s + d.expectedTonnes, 0);
  inWindow.forEach((d) => (d.expectedTonnes = round1((d.expectedTonnes * target) / sum)));
  const drift = round1(target - inWindow.reduce((s, d) => s + d.expectedTonnes, 0));
  inWindow[0].expectedTonnes = round1(inWindow[0].expectedTonnes + drift);

  // Flags: pick exact counts deterministically, always including Farm #27.
  const pick = (pool: Draft[], count: number, include?: Draft) => {
    const chosen = include ? [include] : [];
    for (const d of pool) {
      if (chosen.length >= count) break;
      if (!chosen.includes(d)) chosen.push(d);
    }
    return chosen;
  };
  const irrigators = pick(
    drafts.filter((d) => d.crop !== "Leafy vegetables" && d.soilMoisturePct >= d.minSoilMoisture),
    CLUSTER_TARGETS.irrigationBeforeRain,
    f27,
  );
  irrigators.forEach((d) => (d.irrigationBeforeRain = true));

  const stressed = pick(
    drafts.filter((d) => d.crop === "Tomato" && !d.irrigationBeforeRain),
    CLUSTER_TARGETS.possibleStress,
    f27,
  );
  stressed.forEach((d) => {
    d.possibleStress = true;
    if (d !== f27) d.healthScore = 64 + (Number(d.id.slice(3)) % 7);
  });

  // Inactive farms never include in-window tomato, so the 42 t supply is all from active members.
  const inactive = drafts
    .filter((d) => !d.irrigationBeforeRain && !d.possibleStress && !d.tomatoInWindow && d !== f27)
    .slice(-(CLUSTER_TARGETS.farms - CLUSTER_TARGETS.active));
  inactive.forEach((d) => (d.active = false));

  // Map positions: spiral around each village centre.
  const seen: Record<string, number> = {};
  return drafts.map(({ tomatoInWindow: _t, ...d }) => {
    const v = villages.find((x) => x.name === d.village)!;
    const k = (seen[d.village] = (seen[d.village] ?? 0) + 1);
    const angle = k * 2.4;
    const radius = 2.2 * Math.sqrt(k);
    return {
      ...d,
      pos: { x: v.x + Math.cos(angle) * radius * 1.35, y: v.y + Math.sin(angle) * radius * 1.8 },
    };
  });
}

export const clusterFarms: ClusterFarm[] = buildRoster();
