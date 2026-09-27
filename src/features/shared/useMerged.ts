import { useMemo } from "react";
import type { BuyerRequirement, LabourProfile, Machinery } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { machinery as baseMachinery } from "../../data/mock/resources";
import { labourProfiles as baseLabour } from "../../data/mock/labour";
import { buyerRequirements as baseRequirements } from "../../data/mock/market";

// Demo reference data merged with what people changed in the app, so every
// role sees the same current picture (an owner's new tractor is bookable by
// farmers; a crew's new skills show up in farmer search).

export function useMachinery(): Machinery[] {
  const { machineryEdits, equipment } = useAppStore();
  return useMemo(
    () => [...baseMachinery, ...equipment].map((m) => ({ ...m, ...machineryEdits[m.id] })),
    [machineryEdits, equipment],
  );
}

export function useLabourProfiles(): LabourProfile[] {
  const { labourEdits } = useAppStore();
  return useMemo(() => baseLabour.map((l) => ({ ...l, ...labourEdits[l.id] })), [labourEdits]);
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
  const { requirements } = useAppStore();
  return useMemo(() => [...requirements, ...baseRequirements], [requirements]);
}
