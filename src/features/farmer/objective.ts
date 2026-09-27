import type { FarmerObjective, IntelligenceDomain, Recommendation } from "../../types";

// The farmer's stated goal changes which suggestions come first within the same
// priority — it never hides a suggestion or changes its priority.
const domainOrder: Record<FarmerObjective, IntelligenceDomain[]> = {
  income: ["market", "harvest", "resource", "crop", "water", "energy"],
  cost: ["water", "energy", "resource", "crop", "market", "harvest"],
  sustainability: ["water", "energy", "crop", "resource", "market", "harvest"],
};

const priorityRank = { high: 0, medium: 1, low: 2 };

export function orderForObjective(recs: Recommendation[], objective: FarmerObjective): Recommendation[] {
  const order = domainOrder[objective];
  return [...recs].sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority] || order.indexOf(a.domain) - order.indexOf(b.domain),
  );
}
