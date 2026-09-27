import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { useLabourProfiles } from "../shared/useMerged";

/** The signed-in crew's profile and the work requests sent to it. */
export function useLabour() {
  const { session, labourRequests } = useAppStore();
  const profiles = useLabourProfiles();
  return useMemo(() => {
    const profile = profiles.find((p) => p.userId === session?.userId);
    const mine = labourRequests
      .filter((r) => r.labourProfileId === profile?.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      profile,
      requests: mine.filter((r) => r.status === "requested"),
      assignments: mine.filter((r) => r.status === "accepted" || r.status === "in-progress"),
      history: mine.filter((r) => r.status === "completed" || r.status === "declined"),
    };
  }, [profiles, labourRequests, session]);
}
