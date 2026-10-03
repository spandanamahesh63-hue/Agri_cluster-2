import type { Role } from "../../types";
import { users } from "../../data/mock/users";
import { isRealMode, memberById } from "../../services/mode";

export interface Person {
  id: string;
  role: Role;
  name: string;
  /** How others see them: "Retail aggregator", "Horticulture specialist"… */
  displayLabel: string;
  location: string;
}

/** A member by id: the sample people in the demo, the member directory for real accounts. */
export function personById(id: string | undefined): Person | undefined {
  if (!id) return undefined;
  if (!isRealMode()) return users.find((u) => u.id === id);
  const m = memberById(id);
  return m && { id: m.id, role: m.role, name: m.name ?? "", displayLabel: m.organisation ?? m.name ?? "", location: m.location ?? "" };
}

/** Real farmers appear to others as "Farm #" and a short code from their id (never their name). */
export const realFarmLabel = (userId: string) => `Farm #${userId.replace(/-/g, "").slice(-4).toUpperCase()}`;

/** The signed-in farmer's farm id: the demo's Farm #27, or one per real farmer. */
export const farmIdForUser = (userId: string) => (isRealMode() ? `farm-${userId}` : "farm-27");
/** Who owns a farm, by farm id (real farms carry the farmer's id). */
export const userForFarm = (farmId: string) => (farmId.startsWith("farm-") && farmId.length > 30 ? farmId.slice(5) : undefined);
