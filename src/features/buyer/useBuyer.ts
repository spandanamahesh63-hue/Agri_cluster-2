import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { useAsync } from "../../hooks/useAsync";
import { getHarvestOutlook } from "../../services/api/demoApi";
import { useRequirements } from "../shared/useMerged";

/** Everything the signed-in buyer works with. */
export function useBuyer() {
  const { session, listings, interests } = useAppStore();
  const outlook = useAsync(getHarvestOutlook, []);
  const all = useRequirements();
  const me = session?.userId;

  return useMemo(() => {
    const requirements = all.filter((r) => r.buyerUserId === me);
    const myReqIds = new Set(requirements.map((r) => r.id));
    return {
      outlook,
      requirements,
      listings,
      offers: listings.filter((l) => l.requirementId && myReqIds.has(l.requirementId)),
      interests: interests.filter((i) => i.buyerUserId === me),
      deals: listings.filter((l) => l.status === "agreed" && l.agreedWith?.buyerUserId === me),
    };
  }, [all, me, listings, interests, outlook]);
}
