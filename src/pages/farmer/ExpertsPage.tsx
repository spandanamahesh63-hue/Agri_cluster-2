import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Languages, MessageSquareText } from "lucide-react";
import type { Consultation, Expert, ExpertCategory } from "../../types";
import { useMyRequests } from "../../features/shared/useMerged";
import { useAsync } from "../../hooks/useAsync";
import { getExperts } from "../../services/api/demoApi";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { AskExpertDialog } from "../../features/experts/AskExpertDialog";
import { expertCategoryLabels } from "../../data/mock/experts";
import { stageLabel } from "../../services/intelligence/engine";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { formatDate, formatINR, formatTime } from "../../utils/format";

const statusLabel: Record<Consultation["status"], string> = {
  sent: "Sent · awaiting reply",
  answered: "Answered",
  scheduled: "Scheduled",
  completed: "Completed",
};

export function ExpertsPage() {
  const expertsState = useAsync(getExperts, []);
  const overview = useFarmerOverview();
  const { consultations } = useMyRequests();
  const [params] = useSearchParams();
  const initialCategory = params.get("category") as ExpertCategory | null;
  const contextFieldId = params.get("field") ?? undefined;
  const [category, setCategory] = useState<ExpertCategory | "all">(
    initialCategory && initialCategory in expertCategoryLabels ? initialCategory : "all",
  );
  const [contacting, setContacting] = useState<Expert | null>(null);

  const header = <PageHeader title="Experts" description="Who can help me with this?" />;
  if (expertsState.status === "loading" || overview.status === "loading") return <PageSkeleton />;
  if (expertsState.status === "error" || overview.status === "error")
    return (
      <>
        {header}
        <ErrorState onRetry={expertsState.status === "error" ? expertsState.retry : overview.status === "error" ? overview.retry : undefined} />
      </>
    );

  const experts = expertsState.data;
  const { fields, cycles, sensorHistory } = overview.data;
  const visible = experts.filter((e) => category === "all" || e.category === category);

  // Pre-filled context when arriving from a crop-stress suggestion.
  const contextField = fields.find((f) => f.id === contextFieldId);
  let contextMessage: string | undefined;
  if (contextField) {
    const history = sensorHistory[contextField.id];
    const first = history[0];
    const last = history[history.length - 1];
    const cycle = cycles.find((c) => c.id === contextField.activeCropCycleId);
    contextMessage = `${contextField.name} (${cycle?.crop}, ${cycle ? stageLabel(cycle.stage).toLowerCase() : ""}): the crop health index fell from ${first.cropHealthScore} to ${last.cropHealthScore} over the last few days. Humidity is ${last.humidityPct}% with about ${last.leafWetnessHours} hours of leaf wetness a day. What should I look for when I inspect, and what should I do if it is early blight?`;
  }

  return (
    <>
      {header}

      {contextField && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-crop/20 bg-crop-soft px-4 py-3 text-[13px]">
          <MessageSquareText aria-hidden className="mt-0.5 size-4 shrink-0 text-crop" />
          <p>
            <span className="font-medium">Asking about {contextField.name}.</span>{" "}
            <span className="text-ink-muted">Your question will be pre-filled with the crop-health data behind the suggestion.</span>
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Expertise"
          value={category}
          onChange={setCategory}
          options={[
            { id: "all" as const, label: "All" },
            ...(Object.keys(expertCategoryLabels) as ExpertCategory[]).map((c) => ({ id: c, label: expertCategoryLabels[c] })),
          ]}
        />
        <SourceBadge source="demo" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {visible.length === 0 ? (
            <Card>
              <EmptyState title="No experts in this category yet" />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((e) => (
                <Card key={e.id} className="flex flex-col p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-700">
                      {e.name.replace("Dr. ", "").split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{e.name}</div>
                      <div className="text-[13px] text-ink-muted">{e.title}</div>
                      <Badge tone="brand" className="mt-1">
                        {expertCategoryLabels[e.category]}
                      </Badge>
                    </div>
                  </div>
                  <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[13px] text-ink-muted">
                    {e.expertise.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-1 text-[12px] text-ink-muted">
                    <div className="flex items-center gap-1.5">
                      <Languages aria-hidden className="size-3.5" />
                      {e.languages.join(", ")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock aria-hidden className="size-3.5" />
                      {e.responseTime} · consultation {formatINR(e.consultationFee)}
                    </div>
                  </div>
                  <div className="mt-auto flex justify-end pt-4">
                    <Button size="sm" variant="secondary" onClick={() => setContacting(e)}>
                      Contact expert
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader title="Your questions" subtitle="And consultation requests" />
            {consultations.length === 0 ? (
              <EmptyState title="Nothing sent yet" description="Questions you send to experts appear here with their status." />
            ) : (
              <ul className="divide-y divide-line px-5 pb-2 pt-1">
                {consultations.map((c) => {
                  const expert = experts.find((e) => e.id === c.expertId);
                  return (
                    <li key={c.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">{expert?.name}</span>
                        <Badge tone="info">{statusLabel[c.status]}</Badge>
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-muted">
                        {c.kind === "consultation" ? `Consultation · preferred ${formatDate(c.preferredDate!)}` : "Question"}
                        {c.fieldId && ` · ${fields.find((f) => f.id === c.fieldId)?.name}`}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{c.message}</p>
                      {c.scheduledAt && c.status === "scheduled" && (
                        <p className="mt-1.5 text-[12px] font-medium text-ink">
                          {c.mode === "field-visit" ? "Field visit" : "Call"} on {formatDate(c.scheduledAt, { weekday: "short", day: "numeric", month: "short" })},{" "}
                          {formatTime(c.scheduledAt)}
                        </p>
                      )}
                      {c.answer && (
                        <div className="mt-2 rounded-lg bg-crop-soft p-2.5 text-[13px]">
                          <div className="text-[12px] font-medium text-crop">{expert?.name} recommends</div>
                          <p className="mt-0.5 text-ink">{c.answer}</p>
                        </div>
                      )}
                      {c.outcome && <p className="mt-1.5 text-[12px] text-ink-muted">Outcome: {c.outcome}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      {contacting && (
        <AskExpertDialog
          expert={contacting}
          fields={fields}
          initialFieldId={contextFieldId}
          initialMessage={contextMessage}
          onClose={() => setContacting(null)}
        />
      )}
    </>
  );
}
