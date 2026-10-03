import type { Machinery, ResourceKind, ServiceType, Technology } from "../../types";
import { personById } from "../shared/people";
import { formatDate, formatHour, formatINR } from "../../utils/format";
import { kindLabels, ownerLabel } from "./labels";

/** One machinery or technology listing, as a farmer compares them (spec §11). */
export interface Offering {
  key: string;
  source: "machinery" | "technology";
  typeLabel: string;
  name: string;
  provider: string;
  providerUserId: string;
  location: string;
  price: string;
  availability: { label: string; tone: "success" | "warning" | "neutral" };
  /** No ratings exist yet in the prototype; shown as a placeholder. */
  rating?: number;
  description: string;
  suitableCrops: string[];
  serviceType: ServiceType;
  machine?: Machinery;
  tech?: Technology;
}

const kindDefaults: Record<ResourceKind, { description: string; suitableCrops: string[]; serviceType: ServiceType }> = {
  tractor: { description: "Ploughing, rotavating and bed-making with implements. Operator and diesel included.", suitableCrops: ["All crops"], serviceType: "Rental with operator" },
  harvester: { description: "Cuts and threshes cereals and millets in one pass.", suitableCrops: ["Ragi"], serviceType: "Rental with operator" },
  sprayer: { description: "Battery knapsack sprayer for small fields; you operate it.", suitableCrops: ["Tomato", "Chilli", "Beans", "Onion"], serviceType: "Self-drive rental" },
  drone: { description: "Licensed operator sprays or scouts planned field routes.", suitableCrops: ["Tomato", "Chilli", "Ragi", "Onion"], serviceType: "Per-visit service" },
  tiller: { description: "Walk-behind tiller for inter-row cultivation and small plots.", suitableCrops: ["Tomato", "Chilli", "Beans", "Leafy vegetables"], serviceType: "Self-drive rental" },
  seeder: { description: "Row seed drill for even spacing and depth; saves seed.", suitableCrops: ["Ragi", "Beans", "Onion"], serviceType: "Rental with operator" },
  transport: { description: "Pickup for crates from farm to buyer or collection point.", suitableCrops: ["All crops"], serviceType: "Rental with operator" },
  "cold-storage": { description: "Short-term cold room space for perishable produce.", suitableCrops: ["Tomato", "Beans", "Leafy vegetables"], serviceType: "Cluster shared service" },
  irrigation: { description: "Irrigation equipment and set-up.", suitableCrops: ["All crops"], serviceType: "Supply & install" },
};

const availabilityOf = (m: Machinery): Offering["availability"] => {
  if (m.status === "maintenance") return { label: "Under maintenance", tone: "warning" };
  const next = m.availableSlots?.[0];
  if (next) return { label: `Open ${formatDate(next.date)} ${formatHour(next.startHour)}–${formatHour(next.endHour)}`, tone: "success" };
  return m.status === "available" ? { label: "Free today", tone: "success" } : { label: "Booked today", tone: "neutral" };
};

export function machineOffering(m: Machinery): Offering {
  const d = kindDefaults[m.kind];
  return {
    key: m.id,
    source: "machinery",
    typeLabel: kindLabels[m.kind],
    name: m.name,
    // Private owners are shown only by village (privacy), which the location already carries.
    provider: ownerLabel(m).startsWith("Private owner") ? "Private owner" : ownerLabel(m),
    providerUserId: m.ownerUserId,
    location: m.village,
    price: `${formatINR(m.ratePerHour)}/hour`,
    availability: availabilityOf(m),
    description: m.description ?? m.notes ?? d.description,
    suitableCrops: m.suitableCrops ?? d.suitableCrops,
    serviceType: m.serviceType ?? d.serviceType,
    machine: m,
  };
}

const techType: Record<Technology["category"], string> = {
  sensing: "Sensors",
  monitoring: "Farm monitoring",
  irrigation: "Irrigation system",
  energy: "Energy",
  application: "Drone service",
};

export function techOffering(t: Technology): Offering {
  const provider = personById(t.providerUserId);
  return {
    key: t.id,
    source: "technology",
    typeLabel: techType[t.category],
    name: t.name,
    provider: provider?.role === "cluster" ? "Cluster office" : (provider?.name ?? "Cluster member"),
    providerUserId: t.providerUserId,
    location: t.location,
    price: t.indicativeCost,
    availability: { label: t.availability, tone: "success" },
    description: t.summary,
    suitableCrops: t.suitableCrops,
    serviceType: t.serviceType,
    tech: t,
  };
}

/** Does this offering suit the crop the farmer is planning? */
export const suitsCrop = (o: Offering, crop?: string) => !!crop && (o.suitableCrops.includes("All crops") || o.suitableCrops.includes(crop));
