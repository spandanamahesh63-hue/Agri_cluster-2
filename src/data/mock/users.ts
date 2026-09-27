import type { Farmer, Role, User } from "../../types";

export const CLUSTER_ID = "cl-mysuru-veg";

// One demo account per role. All people and organisations are fictional.
export const users: User[] = [
  {
    id: "u-farmer-27",
    role: "farmer",
    name: "Spandana",
    displayLabel: "Farm #27",
    clusterId: CLUSTER_ID,
    location: "Chamarajanagara, Karnataka",
  },
  {
    id: "u-cluster-1",
    role: "cluster",
    name: "Kavya R.",
    displayLabel: "Cluster Coordinator",
    clusterId: CLUSTER_ID,
    location: "Mysuru",
  },
  {
    id: "u-buyer-1",
    role: "buyer",
    name: "Kaveri Fresh Aggregators",
    displayLabel: "Retail aggregator",
    clusterId: CLUSTER_ID,
    location: "Mysuru city",
  },
  {
    id: "u-provider-1",
    role: "provider",
    name: "Shivakumar Agro Services",
    displayLabel: "Equipment provider",
    clusterId: CLUSTER_ID,
    location: "Yelwala, Mysuru",
  },
  {
    id: "u-labour-1",
    role: "labour",
    name: "Nagaraj B.",
    displayLabel: "Harvest crew lead",
    clusterId: CLUSTER_ID,
    location: "Hootagalli, Mysuru",
  },
  {
    id: "u-expert-1",
    role: "expert",
    name: "Dr. Asha Rao",
    displayLabel: "Horticulture specialist",
    clusterId: CLUSTER_ID,
    location: "Mysuru",
  },
  {
    id: "u-community-1",
    role: "community",
    name: "Lakshmi N.",
    displayLabel: "Community organiser",
    clusterId: CLUSTER_ID,
    location: "Chamarajanagara",
  },
];

export const farmers: Farmer[] = [
  { userId: "u-farmer-27", farmIds: ["farm-27"], objective: "income", method: "precision" },
];

export function demoUserForRole(role: Role): User {
  const user = users.find((u) => u.role === role);
  if (!user) throw new Error(`No demo user for role "${role}"`);
  return user;
}
