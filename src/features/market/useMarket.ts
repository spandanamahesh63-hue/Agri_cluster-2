import { useAsync } from "../../hooks/useAsync";
import { getMarketOverview } from "../../services/api/demoApi";
import type { BuyerRequirement, CropCycle } from "../../types";
import { useRequirements } from "../shared/useMerged";

/** Market overview with buyer requirements posted in the app merged in. */
export function useMarket() {
  const state = useAsync(getMarketOverview, []);
  const requirements = useRequirements();
  if (state.status !== "success") return state;
  return { ...state, data: { ...state.data, requirements } };
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start <= b.end && b.start <= a.end;

/** The farmer's crop cycle that can supply a buyer requirement, if any. */
export function matchingCycle(req: BuyerRequirement, cycles: CropCycle[]): CropCycle | undefined {
  return cycles.find((c) => c.crop === req.crop && c.expectedGrade === req.grade && overlaps(c.harvestWindow, req.window));
}
