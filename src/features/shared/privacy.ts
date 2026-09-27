import type { Role } from "../../types";

// Role-based information model (AGRI CLUSTER master prompt §19).
// Screens ask `canSee(...)` instead of deciding visibility themselves, so the
// rules live in one place and can later move to a backend unchanged.

/** Kinds of farmer information, from least to most sensitive. */
export type FarmerInfo =
  | "listing" // what the farmer chose to publish on a crop listing
  | "village" // general location
  | "name"
  | "cropAndStage"
  | "fieldData" // sensor readings, crop health, soil
  | "farmDetails" // land size, soil, water, energy
  | "contact" // phone / email
  | "financial" // investment, budget, loan needs
  | "documents";

/** The relationship between the viewer and this farmer, if any. */
export interface Relationship {
  /** Farmer opted in to showing their name to buyers (Profile → Privacy). */
  nameSharedWithBuyers?: boolean;
  /** A deal or connection request the farmer accepted. */
  connected?: boolean;
  /** An expert consultation the farmer started. */
  consultation?: boolean;
  /** A confirmed labour assignment on this farm. */
  assignment?: boolean;
}

const always: Record<FarmerInfo, Role[]> = {
  listing: ["farmer", "cluster", "buyer", "provider", "labour", "expert", "community"],
  village: ["farmer", "cluster", "buyer", "provider", "labour", "expert", "community"],
  name: ["farmer", "cluster", "community"],
  cropAndStage: ["farmer", "cluster"],
  fieldData: ["farmer", "cluster"],
  farmDetails: ["farmer", "cluster"],
  contact: ["farmer"],
  financial: ["farmer"],
  documents: ["farmer"],
};

/** Can a viewer in `role` see this kind of information about a farmer? */
export function canSee(role: Role, info: FarmerInfo, rel: Relationship = {}): boolean {
  if (always[info].includes(role)) return true;
  switch (info) {
    case "name":
      return (role === "buyer" && (rel.nameSharedWithBuyers || rel.connected)) || (role === "expert" && !!rel.consultation) || (role === "labour" && !!rel.assignment) || (role === "provider" && !!rel.connected);
    case "cropAndStage":
    case "fieldData":
      // Experts see only what a consultation needs.
      return role === "expert" && !!rel.consultation;
    case "contact":
      // Shared only once the farmer has accepted a connection.
      return !!rel.connected || (role === "labour" && !!rel.assignment);
    default:
      // farmDetails, financial and documents never leave the farmer (cluster sees aggregates only).
      return false;
  }
}

/** Plain-language summary for the privacy screen. */
export const privacySummary: { who: string; sees: string }[] = [
  { who: "Buyers", sees: "Only what you publish on a crop listing, your village, and your name if you choose to show it. Contact details only after you accept a connection." },
  { who: "Labour", sees: "The job, date and village. Your name and contact only for a confirmed assignment." },
  { who: "Experts", sees: "Only the field data and crop details you share with a question or consultation." },
  { who: "Machinery owners", sees: "Your farm label and village for a booking; your name once you are connected." },
  { who: "Cluster office", sees: "Farm-level summaries for coordination. Never your finances or documents." },
  { who: "Nobody else", sees: "Your investment, budget, loan needs and documents stay with you." },
];
