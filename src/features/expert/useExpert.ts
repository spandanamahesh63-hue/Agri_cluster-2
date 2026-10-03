import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { useExperts } from "../shared/useMerged";

/** The signed-in expert and the questions / consultations addressed to them. */
export function useExpert() {
  const { session, consultations } = useAppStore();
  const experts = useExperts();
  return useMemo(() => {
    const expert = experts.find((e) => e.userId === session?.userId);
    const mine = consultations.filter((c) => c.expertId === expert?.id);
    return {
      expert,
      all: mine,
      inbox: mine.filter((c) => c.status === "sent"),
      scheduled: mine.filter((c) => c.status === "scheduled").sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")),
      done: mine.filter((c) => c.status === "answered" || c.status === "completed"),
    };
  }, [experts, consultations, session]);
}
