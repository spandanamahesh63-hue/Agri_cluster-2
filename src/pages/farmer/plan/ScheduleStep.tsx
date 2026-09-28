import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Check, CircleDot } from "lucide-react";
import type { CalendarTask } from "../../../types";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { stepHref } from "../../../features/plan/steps";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/forms/fields";
import { useToast } from "../../../components/ui/Toast";
import { DEMO_NOW, DEMO_TODAY } from "../../../data/mock/clock";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { estimateFor, methodCostFactor } from "../../../services/planning/planner";

const stageLabel: Record<CalendarTask["stage"], string> = {
  prepare: "Prepare",
  plant: "Plant",
  grow: "Grow",
  protect: "Protect",
  harvest: "Harvest",
  sell: "Sell",
};

/** Step 7 — the generated cropping plan and farm calendar. */
export function ScheduleStep() {
  const p = usePlan();
  const navigate = useNavigate();
  const toast = useToast();
  if (!p.crop) return <StepLayout step="schedule">{null}</StepLayout>;
  const est = estimateFor(p.crop, p.assessment.landAcres, p.method ? methodCostFactor[p.method.id] : 1);
  const next = p.calendar.find((t) => t.date >= DEMO_TODAY);
  const harvest = p.calendar.find((t) => t.title.startsWith("First harvest"));

  const confirm = () => {
    p.updatePlan({ confirmedAt: DEMO_NOW.toISOString() });
    toast("Cropping plan confirmed.");
    navigate(stepHref("resources"));
  };

  return (
    <StepLayout
      step="schedule"
      description="Built from your crop, method and planting date. Change the date to rebuild it."
      action={<Button onClick={confirm}>{p.done.schedule ? "Plan confirmed · see resources" : "Confirm my plan"}</Button>}
    >
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <Summary label="Crop" value={p.crop.name} sub={p.method?.name} />
          <Summary label="Area" value={`${p.assessment.landAcres} acre${p.assessment.landAcres === 1 ? "" : "s"}`} sub={p.assessment.location} />
          <Summary label="Budget" value={formatINR(p.budget)} sub={`Typical ${formatINR(est.investment[0])}–${formatINR(est.investment[1])}`} />
          <Summary label="Expected season harvest" value={`${formatNumber(est.yieldKg[0])}–${formatNumber(est.yieldKg[1])} kg`} sub="Indicative, over all pickings" />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <label className="text-[13px]">
            <span className="mb-1 block font-medium">Planting date</span>
            <TextInput type="date" className="w-44" value={p.plantDate} onChange={(e) => e.target.value && p.updatePlan({ plantDate: e.target.value, confirmedAt: undefined })} />
          </label>
          {harvest && (
            <p className="text-[13px] text-ink-muted">
              First harvest around <span className="font-medium text-ink">{formatDate(harvest.date, { day: "numeric", month: "long" })}</span>.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Farm calendar" subtitle="What to do, when, and who can help" action={<SourceBadge source="indicative" />} />
        <ol className="relative mt-2 space-y-0 px-5 pb-4">
          {p.calendar.map((t) => {
            const past = t.date < DEMO_TODAY;
            const isNext = t === next;
            return (
              <li key={t.id} className="relative flex gap-3 pb-4 last:pb-0">
                <span aria-hidden className="absolute left-[9px] top-5 h-full w-px bg-line last:hidden" />
                <span
                  aria-hidden
                  className={clsx(
                    "relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                    past ? "bg-brand-600 text-white" : isNext ? "bg-warning-soft text-warning ring-2 ring-warning" : "bg-sunken",
                  )}
                >
                  {past ? <Check className="size-3" /> : isNext ? <CircleDot className="size-3" /> : null}
                </span>
                <div className="min-w-0 flex-1 text-[13px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium tabular-nums">{formatDate(t.date, { day: "numeric", month: "short" })}</span>
                    <Badge>{stageLabel[t.stage]}</Badge>
                    {isNext && <Badge tone="warning">Up next</Badge>}
                    {past && <span className="sr-only">(done)</span>}
                  </div>
                  <div className={clsx("mt-0.5", past && "text-ink-muted")}>{t.title}</div>
                  {t.resource && <div className="text-[12px] text-ink-subtle">{t.resource}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
      <InfoNote>Dates and quantities are planning estimates. Weather, crop health and market conditions will change them; AgriCluster will suggest updates.</InfoNote>
    </StepLayout>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[12px] text-ink-subtle">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
      {sub && <div className="text-[12px] text-ink-muted">{sub}</div>}
    </div>
  );
}
