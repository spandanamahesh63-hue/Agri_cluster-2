import { useAsync } from "../../hooks/useAsync";
import { getMarketOverview } from "../../services/api/demoApi";
import type { BuyerRequirement, CropCycle, Field } from "../../types";
import { harvestGroups, type HarvestGroup } from "../../services/intelligence/engine";
import { useRequirements } from "../shared/useMerged";

/** Market overview with buyer requirements posted in the app merged in. */
export function useMarket() {
  const state = useAsync(getMarketOverview, []);
  const requirements = useRequirements();
  if (state.status !== "success") return state;
  return { ...state, data: { ...state.data, requirements } };
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start <= b.end && b.start <= a.end;

/** The farmer's harvest (all fields of one crop) that can supply a buyer requirement, if any. */
export function matchingHarvest(req: BuyerRequirement, cycles: CropCycle[], fields: Field[]): HarvestGroup | undefined {
  return harvestGroups(cycles, fields).find((g) => g.crop === req.crop && g.grade === req.grade && overlaps(g.window, req.window));
}
