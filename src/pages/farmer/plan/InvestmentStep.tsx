import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { CircleCheck, Share2, TriangleAlert } from "lucide-react";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { stepHref } from "../../../features/plan/steps";
import { allocateBudget } from "../../../services/planning/planner";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { formatINR } from "../../../utils/format";

const MIN = 30000;
const MAX = 400000;

/** Step 5 — investment optimisation with buy vs rent (spec §10). */
export function InvestmentStep() {
  const p = usePlan();
  const navigate = useNavigate();
  const toast = useToast();
  const [budget, setBudget] = useState(p.budget);
  const [buy, setBuy] = useState<string[]>(p.plan.buy ?? []);
  const lines = useMemo(() => allocateBudget(budget, p.method), [budget, p.method]);
  const max = Math.max(...lines.map((l) => l.amount));
  const [lo, hi] = p.typical ?? [0, 0];
  const status = budget < lo ? "below" : budget > hi ? "above" : "within";
  const oneTimeBuy = p.rent.filter((r) => buy.includes(r.kind)).reduce((s, r) => s + r.buyPrice, 0);
  const rentSaving = p.rent.filter((r) => !buy.includes(r.kind)).reduce((s, r) => s + (r.buyPrice - r.rentForSeason), 0);

  const save = () => {
    p.updatePlan({ budget: lines, buy, confirmedAt: undefined });
    toast("Investment plan saved.");
    navigate(stepHref("market"));
  };

  return (
    <StepLayout
      step="investment"
      description={p.crop && p.method ? `${p.crop.name} with ${p.method.name.toLowerCase()} on ${p.assessment.landAcres} acre${p.assessment.landAcres === 1 ? "" : "s"}.` : undefined}
      action={<Button onClick={save}>Save investment plan</Button>}
    >
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label htmlFor="budget" className="text-[13px] font-medium">
              Your budget for the season
            </label>
            <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{formatINR(budget)}</div>
          </div>
          <SourceBadge source="indicative" />
        </div>
        <input
          id="budget"
          type="range"
          min={MIN}
          max={MAX}
          step={5000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          aria-valuetext={formatINR(budget)}
          className="mt-4 w-full accent-brand-700"
        />
        <div className="flex justify-between text-[11px] text-ink-subtle">
          <span>{formatINR(MIN)}</span>
          <span>{formatINR(MAX)}</span>
        </div>
        {p.typical && (
          <p
            className={clsx(
              "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[13px]",
              status === "within" ? "bg-success-soft" : "bg-warning-soft",
            )}
          >
            {status === "within" ? (
              <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <span>
              Typical cost for this plan is <span className="font-medium">{formatINR(lo)}–{formatINR(hi)}</span> (indicative).{" "}
              {status === "within"
                ? "Your budget is within this range."
                : status === "below"
                  ? `Your budget is ${formatINR(lo - budget)} below it. Consider a smaller area, cheaper inputs, or credit support (see Resources).`
                  : "Your budget is above it; the extra goes to your reserve."}
            </span>
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="How the money could be used" subtitle="Updates as you change the budget" />
        <ul className="space-y-2.5 px-5 pb-5 pt-4">
          {lines.map((l) => (
            <li key={l.category} className="grid grid-cols-[9.5rem_1fr_5.5rem] items-center gap-3 text-[13px] sm:grid-cols-[12rem_1fr_6rem]">
              <span>
                {l.category}
                {l.note && <span className="block text-[11px] text-ink-subtle">{l.note}</span>}
              </span>
              <span className="h-2 rounded-full bg-sunken" aria-hidden>
                <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(l.amount / max) * 100}%` }} />
              </span>
              <span className="text-right font-medium tabular-nums">{formatINR(l.amount)}</span>
            </li>
          ))}
        </ul>
        <InfoNote className="border-t border-line px-5 py-3">Indicative split for planning, not financial advice. Adjust it with an expert if needed.</InfoNote>
      </Card>

      <Card>
        <CardHeader title="Buy or rent?" subtitle="Equipment this method needs. Renting through the cluster is the default." />
        <ul className="divide-y divide-line">
          {p.rent.map((r) => {
            const buying = buy.includes(r.kind);
            return (
              <li key={r.kind} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[13px]">
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-ink-muted">
                    Buy about <span className="font-medium text-ink">{formatINR(r.buyPrice)}</span> · rent about{" "}
                    <span className="font-medium text-ink">{formatINR(r.rentForSeason)}</span> for your season ({r.seasonHours} h at {formatINR(r.ratePerHour)}/h)
                  </div>
                  <div className="mt-1">
                    {r.providers > 0 ? (
                      <Badge tone="resource" icon={<Share2 aria-hidden className="size-3" />}>
                        Available as a shared/rental service · {r.providers} in the cluster
                      </Badge>
                    ) : (
                      <Badge>No cluster provider yet</Badge>
                    )}
                  </div>
                </div>
                <div role="group" aria-label={`${r.label}: buy or rent`} className="inline-flex shrink-0 rounded-lg border border-line p-0.5 text-[13px]">
                  {(["rent", "buy"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={choice === "buy" ? buying : !buying}
                      onClick={() => setBuy((b) => (choice === "buy" ? [...new Set([...b, r.kind])] : b.filter((k) => k !== r.kind)))}
                      className={clsx("rounded-md px-3 py-1", (choice === "buy") === buying ? "bg-brand-700 font-medium text-white" : "text-ink-muted")}
                    >
                      {choice === "rent" ? "Rent" : "Buy"}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line px-5 py-3 text-[13px]">
          {oneTimeBuy > 0 ? (
            <span>
              Buying adds a one-time <span className="font-medium">{formatINR(oneTimeBuy)}</span> outside this season's budget.
            </span>
          ) : (
            <span>
              Renting avoids about <span className="font-medium">{formatINR(rentSaving)}</span> of purchases this season (indicative).
            </span>
          )}
        </div>
      </Card>
    </StepLayout>
  );
}
