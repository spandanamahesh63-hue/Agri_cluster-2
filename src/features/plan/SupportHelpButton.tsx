import { useAppStore } from "../../store/AppStore";
import { publicLabel } from "../shared/identity";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { usePlan } from "./usePlan";

/** Farmer ↔ Support connection: ask the cluster office to help with one support option. */
export function SupportHelpButton({ id, name }: { id: string; name: string }) {
  const p = usePlan();
  const { session, notify } = useAppStore();
  const toast = useToast();
  const requested = p.plan.supportRequested?.includes(id);

  if (requested) return <Badge tone="info">Help requested</Badge>;
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        p.updatePlan({ supportRequested: [...(p.plan.supportRequested ?? []), id] });
        notify({
          userId: "u-cluster-1",
          kind: "system",
          title: `${publicLabel(session!.userId, "farmer")} asked for help with ${name.toLowerCase()}`,
          body: "From their season plan. Eligibility has not been checked.",
          link: "/cluster/farms",
        });
        toast("The cluster office will contact you about this. Nothing is applied for until you decide.");
      }}
    >
      Ask the cluster office for help
    </Button>
  );
}
