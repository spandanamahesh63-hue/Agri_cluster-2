import { useAppStore } from "../../store/AppStore";
import { useAsync } from "../../hooks/useAsync";
import { getFarmerOverview } from "../../services/api/demoApi";

export function useFarmerOverview() {
  const { session } = useAppStore();
  const userId = session?.userId ?? "";
  return useAsync(() => getFarmerOverview(userId), [userId]);
}
