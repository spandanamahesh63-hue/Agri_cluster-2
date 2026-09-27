import type { CropListing, FarmerProfile, Role } from "../../types";
import { users } from "../../data/mock/users";
import { farmLabelForUser } from "../../data/mock/farms";
import { canSee } from "./privacy";

/**
 * How a person appears to other cluster members. Farmers appear by farm label
 * only (privacy, spec §50); organisations and professionals by name.
 */
export function publicLabel(userId: string, role: Role): string {
  if (role === "farmer") return farmLabelForUser(userId);
  if (role === "cluster") return "Cluster office";
  const user = users.find((u) => u.id === userId);
  if (role === "buyer" && user) return `${user.displayLabel}, ${user.location}`;
  return user?.name ?? "Cluster member";
}

/** Seller shown to buyers: the farm label, plus the farmer's name only if they opted in. */
export function sellerLabel(listing: CropListing, profile: FarmerProfile): string {
  const connected = listing.status === "agreed";
  if (listing.farmId === "farm-27" && canSee("buyer", "name", { nameSharedWithBuyers: profile.showNameToBuyers, connected })) {
    const owner = users.find((u) => u.id === "u-farmer-27");
    return `${listing.farmLabel} · ${owner?.name}`;
  }
  return listing.farmLabel;
}

export const roleNoun: Record<Role, string> = {
  farmer: "Farmer",
  cluster: "Cluster office",
  buyer: "Buyer",
  provider: "Equipment provider",
  labour: "Labour",
  expert: "Expert",
  community: "Community organiser",
};
