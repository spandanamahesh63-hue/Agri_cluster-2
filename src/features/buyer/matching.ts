import type { BuyerRequirement, CropListing } from "../../types";
import type { HarvestOutlookRow } from "../../services/api/demoApi";

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00+05:30`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** A listing can serve a requirement if crop and grade match and it is available within the window (2 days' leeway). */
export function listingMatches(listing: CropListing, req: BuyerRequirement): boolean {
  return (
    listing.crop === req.crop &&
    listing.grade === req.grade &&
    listing.status !== "agreed" &&
    listing.status !== "withdrawn" &&
    listing.availableFrom >= addDays(req.window.start, -2) &&
    listing.availableFrom <= req.window.end
  );
}

export function outlookFor(req: BuyerRequirement, outlook: HarvestOutlookRow[]): HarvestOutlookRow[] {
  return outlook.filter((o) => o.crop === req.crop && o.grade === req.grade && o.window.start <= req.window.end && req.window.start <= o.window.end);
}

/** Listings still open to buyers. */
export const isAvailable = (l: CropListing) => l.status !== "agreed" && l.status !== "withdrawn";
