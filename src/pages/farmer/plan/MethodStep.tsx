import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Check, TriangleAlert } from "lucide-react";
import type { MethodRecommendation } from "../../../services/planning/planner";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { stepHref } from "../../../features/plan/steps";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { VideoWalkthrough } from "../../../components/media/VideoWalkthrough";

const levelWord = { low: "Low", moderate: "Moderate", high: "High" };

/** Step 4 — farming methods relevant to the chosen crop (spec §8, §9). */
export function MethodStep() {
  const p = usePlan();
  const navigate = useNavigate();

  const choose = (rec: MethodRecommendation) => {
    const changed = rec.method.id !== p.plan.methodId;
    p.updatePlan(changed ? { methodId: rec.method.id, budget: undefined, confirmedAt: undefined } : { methodId: rec.method.id });
    navigate(stepHref("investment"));
  };

  return (
    <StepLayout
      step="method"
      description={p.crop ? `Only methods that suit ${p.crop.name.toLowerCase()} on your farm, best match first.` : undefined}
    >
      <div className="space-y-4">
        {p.methods.map((rec, i) => {
          const m = rec.method;
          const selected = p.plan.methodId === m.id;
          return (
            <Card key={m.id} className={clsx("p-4 sm:p-5", selected && "ring-2 ring-brand-500")}>
              <div className="grid gap-5 md:grid-cols-[1fr_15rem]">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    {i === 0 && <Badge tone="brand">Best match</Badge>}
                    {selected && (
                      <Badge tone="success" icon={<Check aria-hidden className="size-3" />}>
                        Selected
                      </Badge>
                    )}
                    <Badge>Investment: {levelWord[m.investment]}</Badge>
                  </div>
                  <h2 className="text-lg font-semibold">{m.name}</h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{m.summary}</p>

                  {rec.reasons.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Why it may suit you</div>
                      <ul className="mt-1 space-y-1 text-[13px]">
                        {rec.reasons.map((r) => (
                          <li key={r} className="flex gap-1.5">
                            <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <dl className="mt-3 grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2">
                    <div>
                      <dt className="text-[12px] text-ink-subtle">Water</dt>
                      <dd>{m.waterImpact}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-ink-subtle">Labour</dt>
                      <dd>{m.labourImpact}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[12px] text-ink-subtle">Technology needed</dt>
                      <dd className="mt-0.5 flex flex-wrap gap-1">
                        {m.technology.map((t) => (
                          <Badge key={t} tone="resource">
                            {t}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3">
                    <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Things to consider</div>
                    <ul className="mt-1 space-y-1 text-[13px] text-ink-muted">
                      {[...rec.cautions, ...m.considerations].map((c) => (
                        <li key={c} className="flex gap-1.5">
                          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-warning" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <VideoWalkthrough
                    title={`How it works: ${m.video.title}`}
                    durationSec={m.video.durationSec}
                    summary={`${m.howItWorks.length} steps`}
                    steps={m.howItWorks}
                    benefits={m.benefits}
                    considerations={m.considerations}
                  />
                  <Button className="w-full" variant={i === 0 || selected ? "primary" : "secondary"} onClick={() => choose(rec)}>
                    {selected ? `Continue with ${m.name.toLowerCase()}` : `Use ${m.name.toLowerCase()}`}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </StepLayout>
  );
}
