import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { experts } from "../../data/mock/experts";

/** The signed-in expert and the questions / consultations addressed to them. */
export function useExpert() {
  const { session, consultations } = useAppStore();
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
  }, [consultations, session]);
}
