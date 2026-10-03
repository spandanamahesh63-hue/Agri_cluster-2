import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { useAsync } from "../../hooks/useAsync";
import { getFarmerOverview } from "../../services/api/demoApi";
import { realFarmerOverview } from "./realOverview";

/** The signed-in farmer's farm: sample data in the demo, their own plan for real accounts. */
export function useFarmerOverview() {
  const { session, plan } = useAppStore();
  const real = session?.mode === "real";
  const userId = session?.userId ?? "";
  const demo = useAsync(() => (real ? Promise.resolve(null) : getFarmerOverview(userId)), [userId, real]);
  const realData = useMemo(() => (real && session ? realFarmerOverview(session, plan, new Date()) : null), [real, session, plan]);
  if (realData) return { status: "success" as const, data: realData, retry: demo.retry };
  if (demo.status === "success") return { ...demo, data: demo.data! };
  return demo;
}
