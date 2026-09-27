import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import type { Consultation } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useExpert } from "../../features/expert/useExpert";
import { EvidenceList } from "../../features/intelligence/EvidenceList";
import { farmLabelForUser, fields, cropCycles } from "../../data/mock/farms";
import { sensorHistory } from "../../data/mock/sensing";
import { clusterFarms } from "../../data/mock/clusterFarms";
import { stageLabel } from "../../services/intelligence/engine";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { ChoiceCards, FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { DEMO_TOMORROW } from "../../data/mock/clock";
import { formatDate, formatHour, formatTime } from "../../utils/format";

/** Open a farmer's query, see the farm context, advise, schedule and complete (spec §67). */
export function QueryDetailPage() {
  const { id } = useParams();
  const x = useExpert();
  const c = x.all.find((q) => q.id === id);
  const back = (
    <Link to="/expert/requests" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-3.5" />
      Requests
    </Link>
  );
  if (!c)
    return (
      <>
        {back}
        <Card>
          <EmptyState title="Request not found" action={<ButtonLink to="/expert/requests" size="sm" variant="secondary">Back to requests</ButtonLink>} />
        </Card>
      </>
    );

  const farm = farmLabelForUser(c.requesterUserId);
  return (
    <>
      {back}
      <header className="mb-6">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <Badge>{c.kind === "consultation" ? "Consultation request" : "Question"}</Badge>
          <Badge tone={c.status === "sent" ? "info" : c.status === "scheduled" ? "market" : "success"}>
            {{ sent: "Awaiting your advice", answered: "Answered", scheduled: "Scheduled", completed: "Completed" }[c.status]}
          </Badge>
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Query from {farm}</h1>
        <p className="mt-1 text-sm text-ink-muted">Received {formatDate(c.createdAt, { weekday: "short", day: "numeric", month: "short" })}, {formatTime(c.createdAt)}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">The farmer asks</h2>
            <p className="mt-2 text-[15px] leading-relaxed">{c.message}</p>
            {c.preferredDate && <p className="mt-2 text-[13px] text-ink-muted">Preferred date: {formatDate(c.preferredDate)}</p>}
          </Card>

          {c.answer && (
            <Card className="border-crop/30 bg-crop-soft p-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-crop">Your recommendation</h2>
              <p className="mt-2 text-[15px] leading-relaxed">{c.answer}</p>
            </Card>
          )}

          {c.status === "sent" && <AdviceForm c={c} />}
          {(c.status === "sent" || c.status === "answered") && <ScheduleForm c={c} />}
          {c.status === "scheduled" && <CompleteForm c={c} />}
          {c.status === "completed" && c.outcome && (
            <Card className="p-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">Outcome</h2>
              <p className="mt-2 text-[15px]">{c.outcome}</p>
            </Card>
          )}
        </div>
        <aside>
          <FarmContext c={c} />
        </aside>
      </div>
    </>
  );
}

function FarmContext({ c }: { c: Consultation }) {
  const farmLabel = farmLabelForUser(c.requesterUserId);
  const field = fields.find((f) => f.id === c.fieldId);
  if (field) {
    const cycle = cropCycles.find((cc) => cc.id === field.activeCropCycleId);
    const h = sensorHistory[field.id];
    const first = h[0];
    const last = h[h.length - 1];
    return (
      <Card>
        <CardHeader title={`${farmLabel} · ${field.name}`} subtitle="Shared by the farmer with this question" />
        <div className="p-4">
          <EvidenceList
            evidence={[
              { label: "Crop", value: `${cycle?.crop} · ${cycle ? stageLabel(cycle.stage) : ""}`, source: "demo" },
              { label: "Area", value: `${field.acres} acres`, source: "demo" },
              { label: "Health index", value: `${first.cropHealthScore} → ${last.cropHealthScore} in 5 days`, source: "simulated" },
              { label: "Humidity", value: `${last.humidityPct}%`, source: "simulated" },
              { label: "Leaf wetness", value: `${last.leafWetnessHours} h/day`, source: "simulated" },
              { label: "Soil moisture", value: `${last.soilMoisturePct}%`, source: "simulated" },
            ]}
          />
        </div>
      </Card>
    );
  }
  const summary = clusterFarms.find((f) => f.label === farmLabel);
  return (
    <Card>
      <CardHeader title={farmLabel} subtitle="Farm summary from the cluster roster" action={<SourceBadge source="demo" />} />
      {summary ? (
        <div className="p-4">
          <EvidenceList
            evidence={[
              { label: "Crop", value: `${summary.crop} · ${stageLabel(summary.stage)}`, source: "demo" },
              { label: "Village", value: summary.village, source: "demo" },
              { label: "Area", value: `${summary.acres} acres`, source: "demo" },
              { label: "Health index", value: `${summary.healthScore}`, source: "simulated" },
              { label: "Soil moisture", value: `${summary.soilMoisturePct}%`, source: "simulated" },
            ]}
          />
        </div>
      ) : (
        <EmptyState title="No farm data shared" />
      )}
    </Card>
  );
}

function AdviceForm({ c }: { c: Consultation }) {
  const { update } = useAppStore();
  const toast = useToast();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim().length < 20) return setError("Give the farmer a clear next step (at least a sentence).");
    update("consultations", c.id, { answer: answer.trim(), status: "answered" });
    toast("Recommendation sent. The farmer sees it in their Experts screen.");
  };
  return (
    <Card>
      <CardHeader title="Provide a recommendation" subtitle="Plain language, with a clear next step" />
      <form onSubmit={submit} noValidate className="space-y-3 p-5 pt-3">
        <FormField label="Recommendation" error={error} hint="The farmer decides what to do — explain what to check and why.">
          {(p) => (
            <TextArea
              {...p}
              rows={5}
              value={answer}
              placeholder="e.g. Inspect the lower leaves of Field 2 for brown spots with rings…"
              onChange={(e) => (setAnswer(e.target.value), setError(null))}
            />
          )}
        </FormField>
        <div className="flex justify-end">
          <Button type="submit">Send recommendation</Button>
        </div>
      </form>
    </Card>
  );
}

function ScheduleForm({ c }: { c: Consultation }) {
  const { update } = useAppStore();
  const toast = useToast();
  const [date, setDate] = useState(c.preferredDate ?? DEMO_TOMORROW);
  const [hour, setHour] = useState(10);
  const [mode, setMode] = useState<"call" | "field-visit">("call");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const scheduledAt = `${date}T${String(hour).padStart(2, "0")}:00:00+05:30`;
    update("consultations", c.id, { status: "scheduled", scheduledAt, mode });
    toast(`${mode === "call" ? "Call" : "Field visit"} scheduled for ${formatDate(date)}, ${formatHour(hour)}.`);
  };
  return (
    <Card>
      <CardHeader title="Schedule a consultation" subtitle="Optional — for issues that need a conversation or a field visit" />
      <form onSubmit={submit} className="space-y-4 p-5 pt-3">
        <ChoiceCards
          legend="Type"
          name="mode"
          value={mode}
          onChange={setMode}
          columns={2}
          options={[
            { id: "call", title: "Phone call", description: "15–20 minutes" },
            { id: "field-visit", title: "Field visit", description: "On the farmer's field" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date">{(p) => <TextInput {...p} type="date" min={DEMO_TOMORROW} value={date} onChange={(e) => setDate(e.target.value)} />}</FormField>
          <FormField label="Time">
            {(p) => (
              <SelectInput {...p} value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 8).map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" icon={<CalendarCheck aria-hidden className="size-4" />}>
            Schedule
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CompleteForm({ c }: { c: Consultation }) {
  const { update } = useAppStore();
  const toast = useToast();
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (outcome.trim().length < 10) return setError("Summarise what you found and advised.");
    update("consultations", c.id, { status: "completed", outcome: outcome.trim() });
    toast("Consultation completed. The summary is shared with the farmer.");
  };
  return (
    <Card>
      <CardHeader
        title={`${c.mode === "field-visit" ? "Field visit" : "Call"} on ${c.scheduledAt ? formatDate(c.scheduledAt, { weekday: "short", day: "numeric", month: "short" }) : ""}${c.scheduledAt ? `, ${formatTime(c.scheduledAt)}` : ""}`}
        subtitle="After the session, record what you found"
      />
      <form onSubmit={submit} noValidate className="space-y-3 p-5 pt-3">
        <FormField label="Outcome" error={error}>
          {(p) => <TextArea {...p} rows={4} value={outcome} onChange={(e) => (setOutcome(e.target.value), setError(null))} />}
        </FormField>
        <InfoNote>The summary is shared with the farmer and helps the cluster spot repeated problems.</InfoNote>
        <div className="flex justify-end">
          <Button type="submit">Complete consultation</Button>
        </div>
      </form>
    </Card>
  );
}
