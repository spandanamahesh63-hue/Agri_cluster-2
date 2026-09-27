import type { Machinery, ResourceDemand } from "../../types";
import { CLUSTER_ID } from "./users";

const tractor = (id: number, village: string, status: Machinery["status"]): Machinery => ({
  id: `m-tractor-${id}`,
  kind: "tractor",
  name: `Tractor ${id} · 45 HP`,
  ownerUserId: id <= 3 ? "u-provider-1" : `u-owner-${id}`,
  clusterId: CLUSTER_ID,
  village,
  ratePerHour: 900,
  status,
});

// 9 tractors in the cluster; 4 booked today.
export const machinery: Machinery[] = [
  tractor(1, "Yelwala", "booked"),
  tractor(2, "Yelwala", "available"),
  tractor(3, "Yelwala", "available"),
  tractor(4, "Varuna", "booked"),
  tractor(5, "Varuna", "available"),
  tractor(6, "Hootagalli", "booked"),
  tractor(7, "Bilikere", "available"),
  tractor(8, "Jayapura", "booked"),
  tractor(9, "Jayapura", "available"),
  {
    id: "m-transport-1",
    kind: "transport",
    name: "Pickup · 1.5 t",
    ownerUserId: "u-provider-1",
    clusterId: CLUSTER_ID,
    village: "Yelwala",
    ratePerHour: 600,
    status: "available",
  },
  {
    id: "m-sprayer-1",
    kind: "sprayer",
    name: "Battery sprayer (16 L)",
    ownerUserId: "u-provider-1",
    clusterId: CLUSTER_ID,
    village: "Yelwala",
    ratePerHour: 120,
    status: "available",
  },
];

export const resourceDemand: ResourceDemand[] = [
  { clusterId: CLUSTER_ID, kind: "tractor", date: "2026-09-28", requested: 14, available: 9 },
  { clusterId: CLUSTER_ID, kind: "transport", date: "2026-10-04", requested: 11, available: 6 },
];
