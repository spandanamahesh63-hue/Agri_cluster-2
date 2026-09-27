import { farms } from "./farms";

// Farm #27 (1 acre), last 7 days (simulated metering). Water in kilolitres.
// Energy is derived from the water pumped using the farm's pump profile, so the
// water and energy screens always agree.
const pump = farms[0].pump;

const days = ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26"];
const actualKl = [15, 16, 10, 16, 16, 14, 15];
// What the crop-stage + weather rules would have recommended on each day (22 Sep had light rain).
const recommendedKl = [14, 14, 4, 14, 14, 13, 14];
// Share of pumping that ran on solar (varies with cloud cover and pump timing).
const solarShare = [0.34, 0.25, 0.14, 0.45, 0.4, 0.26, 0.32];

export interface WaterDay {
  date: string;
  actualKl: number;
  recommendedKl: number;
}

export interface EnergyDay {
  date: string;
  solarKwh: number;
  gridKwh: number;
}

export const waterHistory: WaterDay[] = days.map((date, i) => ({
  date,
  actualKl: actualKl[i],
  recommendedKl: recommendedKl[i],
}));

export const energyHistory: EnergyDay[] = days.map((date, i) => {
  const kWh = (actualKl[i] * 1000 / pump.flowLitresPerHour) * pump.powerKw;
  const solar = Math.round(kWh * solarShare[i] * 10) / 10;
  return { date, solarKwh: solar, gridKwh: Math.round((kWh - solar) * 10) / 10 };
});
