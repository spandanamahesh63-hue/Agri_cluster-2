import type { CropListing } from "../../types";

/** Seeded listings predate sharing controls; treat them as fully shared. */
export const listingShare = (l: CropListing) => l.share ?? { method: true, photos: true, village: true, name: false };

/** Village shown to buyers, only when the farmer chose to share it. */
export const listingVillage = (l: CropListing) => (listingShare(l).village ? l.location.split(" · ")[0] : undefined);

/** Method shown to buyers, only when the farmer chose to share it. */
export const listingMethod = (l: CropListing) => (listingShare(l).method ? l.method : undefined);

export interface SupplyFilters {
  q: string;
  village: string; // "" = any
  minTonnes: number; // 0 = any
  grade: "" | CropListing["grade"];
  availableBy: string; // ISO date, "" = any
  method: string; // "" = any
  savedOnly: boolean;
}

export const emptyFilters: SupplyFilters = { q: "", village: "", minTonnes: 0, grade: "", availableBy: "", method: "", savedOnly: false };

export const activeFilterCount = (f: SupplyFilters) =>
  [f.q.trim(), f.village, f.minTonnes > 0, f.grade, f.availableBy, f.method, f.savedOnly].filter(Boolean).length;

/** Buyer search and filters (spec §15). Only farmer-approved fields are searchable. */
export function filterListings(listings: CropListing[], f: SupplyFilters, saved: string[]): CropListing[] {
  const q = f.q.trim().toLowerCase();
  return listings.filter((l) => {
    if (q) {
      const text = [l.crop, `grade ${l.grade}`, listingVillage(l), listingMethod(l), l.description].filter(Boolean).join(" ").toLowerCase();
      if (!q.split(/\s+/).every((word) => text.includes(word))) return false;
    }
    if (f.village && listingVillage(l) !== f.village) return false;
    if (f.minTonnes > 0 && l.quantityTonnes < f.minTonnes) return false;
    if (f.grade && l.grade !== f.grade) return false;
    if (f.availableBy && l.availableFrom > f.availableBy) return false;
    if (f.method && listingMethod(l) !== f.method) return false;
    if (f.savedOnly && !saved.includes(l.id)) return false;
    return true;
  });
}
