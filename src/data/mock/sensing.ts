import type { SensorReading, WeatherForecast } from "../../types";
import { CLUSTER_ID } from "./users";

// Simulated sensor layer — no physical hardware is connected in this prototype.
// History is oldest → newest; the last entry is the current reading.
export const sensorHistory: Record<string, SensorReading[]> = {
  "f27-1": series("f27-1", [
    [66, 85], [63, 86], [61, 86], [67, 87], [65, 86], [64, 86],
  ], { humidity: 72, leafWetness: 4 }),
  "f27-2": series("f27-2", [
    [60, 81], [59, 79], [61, 76], [58, 73], [59, 70], [58, 68],
  ], { humidity: 88, leafWetness: 11 }),
  "f27-3": series("f27-3", [
    [46, 84], [44, 84], [41, 83], [39, 83], [36, 82], [34, 81],
  ], { humidity: 70, leafWetness: 3 }),
};

export function latestReading(fieldId: string): SensorReading | undefined {
  const history = sensorHistory[fieldId];
  return history?.[history.length - 1];
}

export const forecast: WeatherForecast = {
  clusterId: CLUSTER_ID,
  issuedAt: "2026-09-27T06:00:00+05:30",
  rainStartsAt: "2026-09-27T18:30:00+05:30",
  rainProbabilityPct: 82,
  rainfallMm: [18, 25],
  maxTempC: 29,
  minTempC: 20,
  condition: "Cloudy afternoon, rain from evening",
  solarPeak: [11, 14],
  source: "demo",
};

function series(
  fieldId: string,
  points: [soilMoisture: number, health: number][],
  micro: { humidity: number; leafWetness: number },
): SensorReading[] {
  return points.map(([soilMoisturePct, cropHealthScore], i) => ({
    fieldId,
    at: `2026-09-${String(22 + i).padStart(2, "0")}T08:00:00+05:30`,
    soilMoisturePct,
    soilTempC: 24,
    airTempC: 26,
    humidityPct: micro.humidity,
    leafWetnessHours: micro.leafWetness,
    cropHealthScore,
    source: "simulated",
  }));
}
