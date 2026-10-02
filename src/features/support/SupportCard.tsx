import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { Building2, ChevronDown, ExternalLink, Landmark, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import type { SupportHelp, SupportRequest, SupportScheme } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { usePlan } from "../plan/usePlan";
import { supportHelpLabels } from "../notifications/rules";
import { needLabels } from "../../data/catalog/support";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote, type Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { ChoiceCards, FormField, TextArea } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/format";

export const supportStatus: Record<SupportRequest["status"], { label: string; tone: Tone }> = {
  requested: { label: "Sent to cluster office", tone: "info" },
  "in-progress": { label: "Cluster office helping", tone: "brand" },
  "documents-needed": { label: "Documents needed", tone: "warning" },
  submitted: { label: "Application submitted", tone: "success" },
  "report-ready": { label: "Land report ready", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

/** One government scheme or private option, with the farmer's actions. */
export function SupportCard({ scheme: s, why, request }: { scheme: SupportScheme; why?: string | null; request?: SupportRequest }) {
  const p = usePlan();
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const ready = p.plan.supportDocs?.[s.id] ?? [];
  const gov = s.sector === "government";

  const toggleDoc = (d: string) => {
    const next = ready.includes(d) ? ready.filter((x) => x !== d) : [...ready, d];
    p.updatePlan({ supportDocs: { ...(p.plan.supportDocs ?? {}), [s.id]: next } });
  };

  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={gov ? "brand" : "resource"} icon={gov ? <Landmark aria-hidden className="size-3" /> : <Building2 aria-hidden className="size-3" />}>
          {s.level}
        </Badge>
        {s.needs.map((n) => (
          <Badge key={n}>{needLabels[n]}</Badge>
        ))}
      </div>
      <h3 className="mt-2 text-[15px] font-semibold">{s.name}</h3>
      <p className="text-[12px] text-ink-subtle">{s.provider}</p>
      <p className="mt-1.5 text-[13px] text-ink-muted">{s.summary}</p>

      <ul className="mt-2 space-y-1 text-[13px]">
        {s.offers.map((o) => (
          <li key={o} className="flex gap-1.5">
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />
            {o}
          </li>
        ))}
      </ul>

      {why && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-[13px]">
          <span className="font-medium text-brand-800">Why you're seeing this: </span>
          {why}
        </p>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1 self-start text-[13px] font-medium text-brand-700"
      >
        Eligibility, documents and how to apply
        <ChevronDown aria-hidden className={clsx("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 text-[13px]">
          <div>
            <div className="text-[12px] font-medium text-ink-subtle">Eligibility</div>
            <p>{s.eligibility}</p>
          </div>
          {s.documents.length > 0 && (
            <fieldset>
              <legend className="text-[12px] font-medium text-ink-subtle">
                Documents usually needed · {ready.filter((d) => s.documents.includes(d)).length} of {s.documents.length} ready
              </legend>
              <div className="mt-1 space-y-1">
                {s.documents.map((d) => (
                  <label key={d} className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-brand-700" checked={ready.includes(d)} onChange={() => toggleDoc(d)} />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div>
            <div className="text-[12px] font-medium text-ink-subtle">How to apply</div>
            <p>{s.howToApply}</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-subtle">
        {s.sourceChecked ? (
          <span className="inline-flex items-center gap-1 text-success">
            <ShieldCheck aria-hidden className="size-3.5" />
            Official source · checked {formatDate(s.lastChecked!)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-warning">
            <TriangleAlert aria-hidden className="size-3.5" />
            {gov ? "Not checked against a source" : "Compare terms before you sign"}
          </span>
        )}
        {s.source.url ? (
          <a href={s.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
            {s.source.label}
            <ExternalLink aria-hidden className="size-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span>{s.source.label}</span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-4">
        {request && request.status !== "closed" ? (
          <Badge tone={supportStatus[request.status].tone}>{supportStatus[request.status].label}</Badge>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setAsking(true)}>
            Ask for help applying
          </Button>
        )}
      </div>
      {asking && <SupportHelpDialog scheme={s} onClose={() => setAsking(false)} />}
    </Card>
  );
}

export function SupportHelpDialog({ scheme: s, onClose }: { scheme: SupportScheme; onClose: () => void }) {
  const { session, addSupportRequest } = useAppStore();
  const toast = useToast();
  const [help, setHelp] = useState<SupportHelp>(s.sector === "private" ? "compare" : "eligibility");
  const [contact, setContact] = useState<"call" | "rsk-visit">("call");
  const [note, setNote] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    addSupportRequest({ schemeId: s.id, requesterUserId: session!.userId, help, contact, note: note.trim() });
    toast("Sent to the cluster office. You'll get a notification when they reply. Nothing is applied for until you decide.");
    onClose();
  };

  const options = (["eligibility", "application", "documents", "compare"] as SupportHelp[]).map((id) => ({
    id,
    title: supportHelpLabels[id],
    description:
      id === "eligibility"
        ? "They check the rules with the office"
        : id === "application"
          ? "They sit with you to fill it in"
          : id === "documents"
            ? "They tell you what to collect and where"
            : "They compare offers with you",
  }));

  return (
    <Dialog
      title="Ask for help applying"
      description={s.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="support-help">
            Send to cluster office
          </Button>
        </>
      }
    >
      <form id="support-help" onSubmit={submit} noValidate className="space-y-4">
        <ChoiceCards<SupportHelp> legend="What do you need help with?" name="help" value={help} onChange={setHelp} columns={2} options={options} />
        <ChoiceCards<"call" | "rsk-visit">
          legend="How should they reach you?"
          name="contact"
          value={contact}
          onChange={setContact}
          columns={2}
          options={[
            { id: "call", title: "Call me", description: "Through the cluster office" },
            { id: "rsk-visit", title: "Meet at the Raitha Samparka Kendra", description: "They'll suggest a time" },
          ]}
        />
        <FormField label="Anything they should know?" hint="Optional">
          {(pp) => <TextArea {...pp} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>
        <div className="flex gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[13px] text-ink-muted">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>The cluster office sees your farm label, this request and your plan summary. Nothing goes to a bank, insurer or company unless you agree.</span>
        </div>
        <InfoNote>AgriCluster and the cluster office don't decide eligibility; the scheme office or provider does.</InfoNote>
      </form>
    </Dialog>
  );
}
