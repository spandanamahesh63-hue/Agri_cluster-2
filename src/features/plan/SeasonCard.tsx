import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { usePlan } from "./usePlan";
import { currentStep, planSteps, stepHref } from "./steps";
import { Card, CardHeader } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { DEMO_TODAY } from "../../data/mock/clock";
import { daysBetween, formatDate, formatINR } from "../../utils/format";

/** Farmer dashboard summary of the season plan (spec §22). */
export function SeasonCard() {
  const p = usePlan();
  const { listings, interests } = useAppStore();
  const doneCount = planSteps.filter((s) => p.done[s.id]).length;
  const complete = doneCount === planSteps.length;
  const next = currentStep(p.done);
  const task = p.calendar.find((t) => t.date >= DEMO_TODAY);
  const harvest = p.calendar.find((t) => t.title.startsWith("First harvest"));
  const myListingIds = new Set(listings.filter((l) => l.farmId === "farm-27").map((l) => l.id));
  const buyerRequests = interests.filter((i) => myListingIds.has(i.listingId) && i.status === "pending").length;

  return (
    <Card>
      <CardHeader
        title="My season"
        subtitle={complete && p.crop ? `${p.crop.name} · ${p.method?.name ?? ""}` : `Plan ${doneCount} of ${planSteps.length} steps done`}
        action={
          <Link to="/farmer/plan" className="text-[13px] font-medium text-brand-700 hover:underline">
            Open plan
          </Link>
        }
      />
      {complete ? (
        <dl className="grid grid-cols-2 gap-3 px-5 pb-4 pt-3 text-[13px]">
          <div className="col-span-2">
            <dt className="text-[12px] text-ink-subtle">Next task</dt>
            <dd className="font-medium">{task ? `${task.title} · ${formatDate(task.date)}` : "All tasks done"}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-subtle">Budget</dt>
            <dd className="font-medium">{formatINR(p.budget)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-subtle">Harvest</dt>
            <dd className="font-medium">{harvest ? `${formatDate(harvest.date)} · in ${daysBetween(new Date(`${DEMO_TODAY}T00:00:00Z`), new Date(`${harvest.date}T00:00:00Z`))} days` : "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[12px] text-ink-subtle">Buyer requests</dt>
            <dd className="font-medium">
              <Link to="/farmer/market" className="hover:underline">
                {buyerRequests} waiting for you
              </Link>
            </dd>
          </div>
        </dl>
      ) : (
        <div className="px-5 pb-4 pt-3">
          <div className="h-1.5 rounded-full bg-sunken" aria-hidden>
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${(doneCount / planSteps.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-ink-muted">Right crop, right method, right investment: plan your season step by step.</p>
          <ButtonLink to={stepHref(next.id)} size="sm" className="mt-3 w-full" icon={<ArrowRight aria-hidden className="size-3.5" />}>
            {doneCount === 0 ? "Start planning" : `Continue: ${next.label}`}
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}
