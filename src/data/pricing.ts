// Pricing, commission rates and business details, in one place.
//
// All prices and rates are PROPOSED for the pilot: nothing is on sale and no
// payment is collected in the app. Change them here and every page updates.
// Fill in BUSINESS before publishing the policy pages or applying to a
// payment gateway (they check these pages).

export const PRICING_STATUS = "Proposed pricing for the pilot. Not on sale yet; no payment is collected in the app.";

export interface Plan {
  id: "pilot" | "cluster" | "fpo";
  name: string;
  price: number | null; // INR per month, excluding GST; null = free
  unit: string;
  forWho: string;
  includes: string[];
  highlight?: boolean;
}

export const plans: Plan[] = [
  {
    id: "pilot",
    name: "Pilot",
    price: null,
    unit: "for one season",
    forWho: "One cluster trying AgriCluster for the first time",
    includes: ["Up to 150 farmers", "Farmer season planning and market connection", "Baseline and end-of-season impact report", "Onboarding by the AgriCluster team"],
  },
  {
    id: "cluster",
    name: "Cluster",
    price: 2999,
    unit: "per cluster / month",
    forWho: "An FPO, cooperative or programme running one cluster",
    includes: ["Up to 150 farmers", "All seven roles and the cluster dashboard", "Support-scheme help requests", "Monthly supply and resource reports"],
    highlight: true,
  },
  {
    id: "fpo",
    name: "FPO Plus",
    price: 7999,
    unit: "per month, up to 5 clusters",
    forWho: "An FPO or agency running several clusters",
    includes: ["Up to 750 farmers across 5 clusters", "Pooled supply across clusters for bigger buyers", "District-level reports", "Priority support"],
  },
];

export type RevenueStream = "equipment" | "market" | "expert";

/** Commission on completed transactions (proposed). */
export const commissionRates: Record<RevenueStream, { rate: number; label: string; paidBy: string; on: string }> = {
  equipment: { rate: 0.05, label: "Equipment bookings", paidBy: "Machinery owner", on: "value of each confirmed or completed booking" },
  market: { rate: 0.01, label: "Market linkage", paidBy: "Buyer", on: "value of each agreed deal" },
  expert: { rate: 0.1, label: "Paid consultations", paidBy: "Expert", on: "fee of each scheduled or completed consultation" },
};

/** Farmers never pay a commission to use the platform. */
export const FARMER_PROMISE = "Farmers never pay a commission. Questions to experts through the cluster stay free.";

// Business details used on the Contact, Terms, Privacy and Refund pages.
// Replace every [placeholder] before going live.
export const BUSINESS = {
  name: "AgriCluster",
  address: "[Street address], Mysuru, Karnataka 570001",
  email: "spandanamrajamani@gmail.com",
  phone: "[support phone]",
  grievanceOfficer: "Spandana",
  jurisdiction: "Mysuru, Karnataka",
  lastUpdated: "2026-09-30",
};

export const isPlaceholder = (v: string) => v.startsWith("[");
