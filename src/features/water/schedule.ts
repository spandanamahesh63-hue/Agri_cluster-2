import type { CropCycle, Decision, Farm, Field, IrrigationEvent, Recommendation, WeatherForecast } from "../../types";
import { hourOf } from "../../services/intelligence/engine";

export interface ScheduleRow {
  event: IrrigationEvent;
  field: Field;
  cycle?: CropCycle;
  time: string;
  durationHours: number;
  litres: number;
  energy: "Solar" | "Grid";
  /** Summary of a change the farmer accepted, if any. */
  change?: { summary: string; recommendationId: string };
  /** A suggestion about this event still waiting for the farmer. */
  pending?: Recommendation;
}

/**
 * The irrigation plan as the farmer sees it: the base schedule with the effects
 * of accepted recommendations applied. Undoing a decision reverts the change,
 * because nothing is stored except the decision itself.
 */
export function effectiveSchedule(args: {
  farm: Farm;
  fields: Field[];
  cycles: CropCycle[];
  events: IrrigationEvent[];
  recommendations: Recommendation[];
  decisions: Record<string, Decision>;
  forecast: WeatherForecast;
}): ScheduleRow[] {
  const { farm, fields, cycles, events, recommendations, decisions, forecast } = args;
  return events
    .map((event) => {
      const field = fields.find((f) => f.id === event.fieldId)!;
      const related = recommendations.filter((r) => r.effect?.eventId === event.id);
      const accepted = related.find((r) => decisions[r.id]?.status === "accepted");
      const pending = related.find((r) => !decisions[r.id]);
      const time = accepted?.effect?.newTime ?? event.scheduledAt;
      const durationHours = accepted?.effect?.durationHours ?? event.durationHours;
      const hour = hourOf(new Date(time));
      const onSolar = farm.pump.energy !== "grid" && hour >= forecast.solarPeak[0] && hour < forecast.solarPeak[1];
      return {
        event,
        field,
        cycle: cycles.find((c) => c.id === field.activeCropCycleId),
        time,
        durationHours,
        litres: durationHours * farm.pump.flowLitresPerHour,
        energy: onSolar ? "Solar" : "Grid",
        change: accepted?.effect ? { summary: accepted.effect.summary, recommendationId: accepted.id } : undefined,
        pending,
      } satisfies ScheduleRow;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}
