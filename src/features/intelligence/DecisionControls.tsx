import { Check, Undo2, X } from "lucide-react";
import type { Recommendation } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";

/** Accept / Ignore — the farmer stays the decision-maker. */
export function DecisionControls({ rec, size = "sm" }: { rec: Recommendation; size?: "sm" | "md" }) {
  const { decisions, decide, undoDecision } = useAppStore();
  const toast = useToast();
  const decision = decisions[rec.id];

  if (decision) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          tone={decision.status === "accepted" ? "success" : "neutral"}
          icon={decision.status === "accepted" ? <Check aria-hidden className="size-3" /> : <X aria-hidden className="size-3" />}
        >
          {decision.status === "accepted" ? "You accepted this" : "You ignored this"}
        </Badge>
        <Button variant="ghost" size="sm" icon={<Undo2 aria-hidden className="size-3.5" />} onClick={() => undoDecision(rec.id)}>
          Undo
        </Button>
      </div>
    );
  }

  const choose = (status: "accepted" | "ignored") => {
    decide(rec.id, status);
    const acceptedText = rec.effect ? `Accepted — irrigation ${rec.effect.summary.toLowerCase()}.` : "Recommendation accepted and recorded.";
    toast(status === "accepted" ? acceptedText : "Recommendation ignored.", {
      label: "Undo",
      onClick: () => undoDecision(rec.id),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size={size} icon={<Check aria-hidden className="size-3.5" />} onClick={() => choose("accepted")}>
        Accept
      </Button>
      <Button variant="ghost" size={size} onClick={() => choose("ignored")}>
        Ignore
      </Button>
    </div>
  );
}
