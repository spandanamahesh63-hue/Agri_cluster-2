import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { usePlan } from "../../../features/plan/usePlan";
import { currentStep, planSteps, stepHref } from "../../../features/plan/steps";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Badge, InfoNote } from "../../../components/ui/Badge";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { DEMO_TODAY } from "../../../data/mock/clock";
import { JOURNEY } from "../../../data/brand";
import { formatDate, formatINR } from "../../../utils/format";

/** The farmer's season plan: journey progress and summary. */
export function PlanOverviewPage() {
  const p = usePlan();
  const toast = useToast();
  const doneCount = planSteps.filter((s) => p.done[s.id]).length;
  const complete = doneCount === planSteps.length;
  const next = currentStep(p.done);
  const upcoming = p.calendar.find((t) => t.date >= DEMO_TODAY);

  return (
    <>
      <PageHeader
        decorated
        title="My season plan"
        description="Farm → Goal → Crop → Method → Investment → Market → Plan → Resources. Your plan builds step by step."
        actions={
          complete ? (
            <ButtonLink to="/farmer/market/upload" icon={<ArrowRight aria-hidden className="size-4" />}>
              List my harvest
            </ButtonLink>
          ) : (
            <ButtonLink to={stepHref(next.id)} icon={<ArrowRight aria-hidden className="size-4" />}>
              {doneCount === 0 ? "Start planning" : `Continue: ${next.label}`}
            </ButtonLink>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Your journey" subtitle={`${doneCount} of ${planSteps.length} steps done`} />
          <div className="px-5 pt-3">
            <div className="h-2 rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={planSteps.length} aria-valuenow={doneCount} aria-label="Plan progress">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${(doneCount / planSteps.length) * 100}%` }} />
            </div>
          </div>
          <ol className="mt-3 divide-y divide-line">
            {planSteps.map((s, i) => {
              const isDone = p.done[s.id];
              const reachable = s.requires.every((r) => p.done[r]);
              return (
                <li key={s.id}>
                  <Link
                    to={reachable ? stepHref(s.id) : stepHref(next.id)}
                    className={clsx("flex items-center gap-3 px-5 py-3 text-[13px] hover:bg-canvas", !reachable && "pointer-events-none opacity-60")}
                    aria-disabled={!reachable}
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                        isDone ? "bg-brand-600 text-white" : s.id === next.id ? "bg-brand-100 text-brand-800 ring-2 ring-brand-600" : "bg-sunken text-ink-subtle",
                      )}
                    >
                      {isDone ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{s.label}</span>
                      <span className="block text-ink-muted">{summaryFor(s.id, p) ?? s.question}</span>
                    </span>
                    {isDone ? <Badge tone="success">Done</Badge> : s.id === next.id ? <Badge tone="brand">Next</Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5 text-[13px]">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Up next on the farm</div>
            {p.crop && upcoming ? (
              <>
                <div className="mt-1 text-sm font-semibold">{upcoming.title}</div>
                <div className="text-ink-muted">
                  {formatDate(upcoming.date, { weekday: "short", day: "numeric", month: "short" })}
                  {upcoming.resource && ` · ${upcoming.resource}`}
                </div>
                <Link to={stepHref("schedule")} className="mt-2 inline-block font-medium text-brand-700 hover:underline">
                  See full calendar
                </Link>
              </>
            ) : (
              <p className="mt-1 text-ink-muted">Choose a crop and method to get your farm calendar.</p>
            )}
          </Card>
          <Card className="p-5 text-[13px]">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">After the plan</div>
            <ol className="mt-2 flex flex-wrap items-center gap-1 text-ink-muted">
              {JOURNEY.slice(-2).map((j, i) => (
                <li key={j} className="flex items-center gap-1">
                  {i > 0 && <ArrowRight aria-hidden className="size-3" />}
                  <span className="rounded-md bg-sunken px-2 py-0.5 text-ink">{j}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-ink-muted">When the crop is ready, list your harvest and AgriCluster connects you with matching buyers.</p>
          </Card>
          {doneCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw aria-hidden className="size-3.5" />}
              onClick={() => {
                p.resetPlan();
                toast("Plan cleared. Start again whenever you like.");
              }}
            >
              Start a new plan
            </Button>
          )}
          <InfoNote>All figures in the plan are indicative sample values for this prototype.</InfoNote>
        </aside>
      </div>
    </>
  );
}

function summaryFor(id: string, p: ReturnType<typeof usePlan>): string | undefined {
  if (!p.done[id as keyof typeof p.done]) return undefined;
  switch (id) {
    case "assessment":
      return `${p.assessment.landAcres} acre${p.assessment.landAcres === 1 ? "" : "s"} · ${p.assessment.soilType} soil · ${p.assessment.location}`;
    case "vision":
      return p.vision.mode === "investment"
        ? `I have ${formatINR(p.vision.amount ?? 0)} to invest`
        : p.vision.mode === "income"
          ? `I want to earn ${formatINR(p.vision.amount ?? 0)} (indicative)`
          : "Guide me";
    case "crop":
      return p.crop?.name;
    case "method":
      return p.method?.name;
    case "investment":
      return `${formatINR(p.budget)} across ${p.budgetLines.length} categories`;
    case "market":
      return p.market ? `Indicative ₹${p.market.current[0]}–${p.market.current[1]}/kg · ${p.market.demand} demand` : undefined;
    case "schedule":
      return `${p.calendar.length} tasks from ${formatDate(p.plantDate)}`;
    case "resources":
      return `${p.needs?.machinery.length ?? 0} rentals · ${p.needs?.expertCategories.length ?? 0} expert areas · ${p.support.length} support options`;
  }
}
