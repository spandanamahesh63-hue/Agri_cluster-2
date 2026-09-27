import type { BuyerRequirement, ClusterSupply } from "../../types";
import { CLUSTER_ID } from "./users";

// Indicative market data — not a live price feed.
export const buyerRequirements: BuyerRequirement[] = [
  {
    id: "br-1",
    buyerUserId: "u-buyer-1",
    buyerLabel: "Retail aggregator, Mysuru city",
    crop: "Tomato",
    grade: "A",
    quantityTonnes: 35,
    window: { start: "2026-10-04", end: "2026-10-07" },
    deliveryLocation: "Bannimantap, Mysuru",
    indicativePricePerKg: [22, 26],
    postedAt: "2026-09-26T17:40:00+05:30",
    status: "open",
    source: "demo",
  },
  {
    id: "br-2",
    buyerUserId: "u-buyer-2",
    buyerLabel: "Hotel supplier, Mysuru",
    crop: "Onion",
    grade: "B",
    quantityTonnes: 8,
    window: { start: "2026-10-12", end: "2026-10-20" },
    deliveryLocation: "Vijayanagar, Mysuru",
    indicativePricePerKg: [18, 21],
    postedAt: "2026-09-25T11:00:00+05:30",
    status: "open",
    source: "demo",
  },
];

/** Indicative tomato price ranges by channel (₹/kg), carried over from the original prototype. */
export const priceChannels = [
  { channel: "Local market", range: [18, 25] as [number, number], note: "Nearby" },
  { channel: "Urban retail", range: [25, 35] as [number, number], note: "Regional, stricter grading" },
  { channel: "Wholesale", range: [16, 24] as [number, number], note: "Regional, large volumes" },
];

export const clusterSupply: ClusterSupply[] = [
  {
    clusterId: CLUSTER_ID,
    crop: "Tomato",
    grade: "A",
    expectedTonnes: 42,
    window: { start: "2026-10-04", end: "2026-10-07" },
    source: "indicative",
  },
];
