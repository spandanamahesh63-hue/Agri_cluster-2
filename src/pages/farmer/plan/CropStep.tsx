import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Check, ChevronDown, CircleCheck, CircleDot, CircleMinus, TriangleAlert } from "lucide-react";
import type { CropRecommendation } from "../../../services/planning/planner";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { stepHref } from "../../../features/plan/steps";
import { Card } from "../../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { formatINR, formatNumber } from "../../../utils/format";

const fitStyle = {
  good: { label: "Good fit", tone: "success" as const, icon: CircleCheck },
  possible: { label: "Possible", tone: "warning" as const, icon: CircleDot },
  "not-suited": { label: "Not suited", tone: "neutral" as const, icon: CircleMinus },
};
const levelWord = { low: "Low", moderate: "Moderate", high: "High" };

/** Step 3 — crop recommendations with "why" (spec §7). */
export function CropStep() {
  const p = usePlan();
  const navigate = useNavigate();
  const [showOthers, setShowOthers] = useState(false);
  const shown = p.crops.filter((c) => c.fit !== "not-suited");
  const others = p.crops.filter((c) => c.fit === "not-suited");
  const intro =
    p.vision.mode === "investment"
      ? `Ranked for ${formatINR(p.vision.amount ?? p.assessment.investment)} on ${p.assessment.landAcres} acre${p.assessment.landAcres === 1 ? "" : "s"}.`
      : p.vision.mode === "income"
        ? `Ranked for an income goal of ${formatINR(p.vision.amount ?? 0)}. Figures are indicative, not guaranteed.`
        : "Ranked for your land, soil, water, energy and experience.";

  const choose = (rec: CropRecommendation) => {
    const changed = rec.crop.id !== p.plan.cropId;
    p.updatePlan(changed ? { cropId: rec.crop.id, methodId: undefined, budget: undefined, confirmedAt: undefined } : { cropId: rec.crop.id });
    navigate(stepHref("method"));
  };

  return (
    <StepLayout step="crop" description={intro}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-muted">
          {shown.length} crop{shown.length === 1 ? "" : "s"} suit your farm.
        </p>
        <SourceBadge source="indicative" />
      </div>
      <div className="space-y-4">
        {shown.map((rec, i) => (
          <CropCard key={rec.crop.id} rec={rec} top={i === 0} selected={p.plan.cropId === rec.crop.id} incomeMode={p.vision.mode === "income"} onChoose={() => choose(rec)} />
        ))}
      </div>
      {others.length > 0 && (
        <div>
          <button type="button" aria-expanded={showOthers} onClick={() => setShowOthers((s) => !s)} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted hover:text-ink">
            Other crops we considered ({others.length})
            <ChevronDown aria-hidden className={clsx("size-4 transition-transform", showOthers && "rotate-180")} />
          </button>
          {showOthers && (
            <div className="mt-3 space-y-4">
              {others.map((rec) => (
                <CropCard key={rec.crop.id} rec={rec} selected={p.plan.cropId === rec.crop.id} incomeMode={p.vision.mode === "income"} onChoose={() => choose(rec)} />
              ))}
            </div>
          )}
        </div>
      )}
      <InfoNote>
        Suggestions come from simple, transparent rules using your answers and sample crop data. Costs, yields and prices are indicative ranges, not
        predictions.
      </InfoNote>
    </StepLayout>
  );
}

function CropCard({ rec, top, selected, incomeMode, onChoose }: { rec: CropRecommendation; top?: boolean; selected: boolean; incomeMode: boolean; onChoose: () => void }) {
  const [open, setOpen] = useState(!!top);
  const fit = fitStyle[rec.fit];
  const c = rec.crop;
  const facts: [string, string][] = [
    ["Water", levelWord[c.water]],
    ["Growing period", `${c.growingDays[0]}–${c.growingDays[1]} days`],
    ["Investment for your land", `${formatINR(rec.estimate.investment[0])}–${formatINR(rec.estimate.investment[1])}`],
    ["Labour", levelWord[c.labour]],
    ["Harvest", c.harvest],
    ["Technology fit", levelWord[c.techSuitability]],
    ["Demand", levelWord[c.demand]],
    ["Indicative yield", `${formatNumber(rec.estimate.yieldKg[0])}–${formatNumber(rec.estimate.yieldKg[1])} kg`],
  ];

  return (
    <Card className={clsx("overflow-hidden", selected && "ring-2 ring-brand-500")}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={fit.tone} icon={<fit.icon aria-hidden className="size-3" />}>
              {fit.label}
            </Badge>
            {top && <Badge tone="brand">Best match</Badge>}
            {selected && (
              <Badge tone="success" icon={<Check aria-hidden className="size-3" />}>
                Selected
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold">{c.name}</h2>
          <p className="text-[13px] text-ink-muted">{c.season}</p>
          {incomeMode && rec.acresForTarget !== undefined && (
            <p className="mt-1 text-[13px]">
              <span className="font-medium">About {rec.acresForTarget} acre{rec.acresForTarget === 1 ? "" : "s"}</span>{" "}
              <span className="text-ink-muted">for your income goal (indicative)</span>
            </p>
          )}
        </div>
        <Button size="sm" variant={top || selected ? "primary" : "secondary"} onClick={onChoose} className="self-start">
          {selected ? `Continue with ${c.name.toLowerCase()}` : `Choose ${c.name.toLowerCase()}`}
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-[13px] sm:grid-cols-4 sm:px-5">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[12px] text-ink-subtle">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-1 px-4 pb-3 sm:px-5">
        {c.markets.map((m) => (
          <Badge key={m} tone="market">
            {m}
          </Badge>
        ))}
      </div>

      <div className="border-t border-line bg-canvas px-4 py-3 sm:px-5">
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700">
          Why are we suggesting this crop?
          <ChevronDown aria-hidden className={clsx("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <ul className="space-y-1 text-[13px]">
              {rec.reasons.map((r) => (
                <li key={r} className="flex gap-1.5">
                  <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
            <ul className="space-y-1 text-[13px]">
              {rec.cautions.map((r) => (
                <li key={r} className="flex gap-1.5 text-ink-muted">
                  <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
