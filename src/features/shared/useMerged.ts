import { useMemo } from "react";
import type { BuyerRequirement, Expert, LabourProfile, Machinery, Technology } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { machinery as baseMachinery } from "../../data/mock/resources";
import { labourProfiles as baseLabour } from "../../data/mock/labour";
import { buyerRequirements as baseRequirements } from "../../data/mock/market";
import { experts as baseExperts } from "../../data/mock/experts";
import { technologies as baseTechnologies } from "../../data/mock/technology";

// Demo reference data merged with what people changed in the app, so every
// role sees the same current picture (an owner's new tractor is bookable by
// farmers; a crew's new skills show up in farmer search). Real accounts see
// only what real members published.

export function useMachinery(): Machinery[] {
  const { session, machineryEdits, equipment } = useAppStore();
  const real = session?.mode === "real";
  return useMemo(
    () => (real ? equipment : [...baseMachinery, ...equipment].map((m) => ({ ...m, ...machineryEdits[m.id] }))),
    [real, machineryEdits, equipment],
  );
}

export function useLabourProfiles(): LabourProfile[] {
  const { session, labourEdits, crews } = useAppStore();
  const real = session?.mode === "real";
  return useMemo(() => (real ? crews : baseLabour.map((l) => ({ ...l, ...labourEdits[l.id] }))), [real, labourEdits, crews]);
}

export function useExperts(): Expert[] {
  const { session, experts } = useAppStore();
  return session?.mode === "real" ? experts : baseExperts;
}

export function useTechnologies(): Technology[] {
  const { session, technologies } = useAppStore();
  return session?.mode === "real" ? technologies : baseTechnologies;
}

/** Requests made by the signed-in user (the store also holds other members' records). */
export function useMyRequests() {
  const { session, bookings, labourRequests, serviceRequests, consultations } = useAppStore();
  const me = session?.userId;
  return useMemo(
    () => ({
      bookings: bookings.filter((b) => b.requesterUserId === me),
      labourRequests: labourRequests.filter((r) => r.requesterUserId === me),
      serviceRequests: serviceRequests.filter((r) => r.requesterUserId === me),
      consultations: consultations.filter((c) => c.requesterUserId === me),
    }),
    [me, bookings, labourRequests, serviceRequests, consultations],
  );
}

export function useRequirements(): BuyerRequirement[] {
  const { session, requirements } = useAppStore();
  const real = session?.mode === "real";
  return useMemo(() => (real ? requirements : [...requirements, ...baseRequirements]), [real, requirements]);
}
