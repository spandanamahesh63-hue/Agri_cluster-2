import { useState, type FormEvent } from "react";
import { MapPin, Phone } from "lucide-react";
import type { FarmAssessment, IrrigationType, LandReport, Level, SupportRequest } from "../../types";
import { contactLabels, irrigationLabels, landReportRows, soilLabels, waterLabels } from "../../features/support/labels";
import { DEMO_TODAY } from "../../data/mock/clock";
import { useAppStore } from "../../store/AppStore";
import { supportStatus } from "../../features/support/SupportCard";
import { supportHelpLabels } from "../../features/notifications/rules";
import { supportById } from "../../data/catalog/support";
import { farmLabelForUser } from "../../data/mock/farms";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/format";

type Filter = "open" | "all";
const next: Partial<Record<SupportRequest["status"], { to: SupportRequest["status"]; label: string }[]>> = {
  requested: [
    { to: "in-progress", label: "Start helping" },
    { to: "documents-needed", label: "Ask for documents" },
  ],
  "in-progress": [
    { to: "documents-needed", label: "Ask for documents" },
    { to: "submitted", label: "Mark submitted" },
  ],
  "documents-needed": [{ to: "in-progress", label: "Documents received" }],
  submitted: [{ to: "closed", label: "Close" }],
};
/** Land-details requests end with a land report instead of an application. */
const landNext: typeof next = {
  requested: [{ to: "in-progress", label: "Visit booked" }],
  "report-ready": [{ to: "closed", label: "Close" }],
};

/** Cluster office: farmers' requests for help with government schemes and private options. */
export function ClusterSupportPage() {
  const { supportRequests } = useAppStore();
  const [filter, setFilter] = useState<Filter>("open");
  const rows = [...supportRequests]
    .filter((r) => filter === "all" || r.status !== "closed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const waiting = supportRequests.filter((r) => r.status === "requested").length;

  return (
    <>
      <PageHeader title="Support" description="Which farmers need help with schemes, private offers or finding out their land details?" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips<Filter>
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "open", label: "Open" },
            { id: "all", label: "All" },
          ]}
        />
        <span className="text-[13px] text-ink-muted">{waiting} waiting for a first reply</span>
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No open requests" description="Requests from farmers' Support pages appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <RequestRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </Card>
      <InfoNote className="mt-4">You see the farm label, the request and the scheme, plus the phone number and village a farmer gives for a call or farm visit. Share details with a bank, insurer or company only with the farmer's agreement.</InfoNote>
    </>
  );
}

function RequestRow({ r }: { r: SupportRequest }) {
  const { update } = useAppStore();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const s = supportById(r.schemeId);
  const farm = farmLabelForUser(r.requesterUserId);
  const st = supportStatus[r.status];
  const noteId = `office-note-${r.id}`;
  const land = r.help === "land-details";
  const actions = (land ? landNext : next)[r.status];
  const canReport = land && (r.status === "requested" || r.status === "in-progress");

  return (
    <li className="px-5 py-4 text-[13px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-medium">
            {farm} · {s?.name}
          </div>
          <div className="text-ink-muted">
            {supportHelpLabels[r.help]} · {contactLabels[r.contact].office} · {formatDate(r.createdAt)} · {s?.level}
          </div>
          {(r.phone || r.place) && (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {r.phone && (
                <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
                  <Phone aria-hidden className="size-3.5" />
                  {r.phone}
                </a>
              )}
              {r.place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden className="size-3.5 text-ink-subtle" />
                  {r.place}
                </span>
              )}
            </div>
          )}
          {r.note && <div className="text-ink-muted">“{r.note}”</div>}
          {r.officeNote && <div className="mt-1">Last note: {r.officeNote}</div>}
          {r.landReport && (
            <div className="mt-2 rounded-lg bg-canvas px-3 py-2">
              <span className="font-medium">Land report, {formatDate(r.landReport.checkedOn)}: </span>
              {landReportRows(r.landReport)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </div>
          )}
        </div>
        <Badge tone={st.tone} className="self-start">
          {st.label}
        </Badge>
      </div>
      {reporting ? (
        <LandReportForm
          farm={farm}
          onCancel={() => setReporting(false)}
          onSave={(landReport) => {
            update("supportRequests", r.id, {
              status: "report-ready",
              landReport,
              officeNote: note.trim() || "Our team checked your land. Open step 1 of your plan to use the report.",
            });
            setReporting(false);
            setNote("");
            toast(`Land report sent. ${farm} has been notified.`);
          }}
        />
      ) : (
        (actions || canReport) && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor={noteId} className="sr-only">
              Note for {farm}
            </label>
            <TextInput id={noteId} placeholder="Note for the farmer (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="sm:max-w-md" />
            <div className="flex flex-wrap gap-2">
              {actions?.map((n) => (
                <Button
                  key={n.to}
                  size="sm"
                  variant={n.to === "documents-needed" ? "ghost" : "secondary"}
                  onClick={() => {
                    update("supportRequests", r.id, { status: n.to, ...(note.trim() ? { officeNote: note.trim() } : {}) });
                    setNote("");
                    toast(`${farm} has been notified.`);
                  }}
                >
                  {n.label}
                </Button>
              ))}
              {canReport && (
                <Button size="sm" onClick={() => setReporting(true)}>
                  Add land report
                </Button>
              )}
            </div>
          </div>
        )
      )}
    </li>
  );
}

/** What the team found on the farm. Anything left as "Not checked" stays as the farmer entered it. */
function LandReportForm({ farm, onSave, onCancel }: { farm: string; onSave: (r: LandReport) => void; onCancel: () => void }) {
  const [soilType, setSoilType] = useState<FarmAssessment["soilType"] | "">("");
  const [water, setWater] = useState<Level | "">("");
  const [irrigation, setIrrigation] = useState<IrrigationType | "">("");
  const [acres, setAcres] = useState("");
  const [tested, setTested] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const landAcres = acres.trim() ? Number(acres) : undefined;
    if (landAcres !== undefined && !(landAcres > 0)) return setError("Land size must be a number above 0.");
    if (!soilType && !water && !irrigation && !landAcres) return setError("Record at least one finding: soil type, water, irrigation or land size.");
    onSave({
      ...(soilType && { soilType }),
      ...(water && { water }),
      ...(irrigation && { irrigation }),
      ...(landAcres && { landAcres }),
      soilTestDone: tested,
      checkedOn: DEMO_TODAY,
      ...(notes.trim() && { notes: notes.trim() }),
    });
  };

  const select = <T extends string>(labels: Record<T, string>, value: T | "", onChange: (v: T | "") => void) => (f: object) => (
    <SelectInput {...f} value={value} onChange={(e) => (onChange(e.target.value as T | ""), setError(null))}>
      <option value="">Not checked</option>
      {(Object.keys(labels) as T[]).map((id) => (
        <option key={id} value={id}>
          {labels[id]}
        </option>
      ))}
    </SelectInput>
  );

  return (
    <form onSubmit={submit} noValidate aria-label={`Land report for ${farm}`} className="mt-3 space-y-3 rounded-lg border border-line bg-canvas p-4">
      <div className="font-medium">Land report for {farm}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Soil type">{select(soilLabels, soilType, setSoilType)}</FormField>
        <FormField label="Water for irrigation">{select(waterLabels, water, setWater)}</FormField>
        <FormField label="Irrigation">{select(irrigationLabels, irrigation, setIrrigation)}</FormField>
        <FormField label="Land size (acres)">
          {(f) => <TextInput {...f} type="number" inputMode="decimal" min={0} step={0.1} value={acres} onChange={(e) => (setAcres(e.target.value), setError(null))} />}
        </FormField>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4 accent-brand-700" checked={tested} onChange={(e) => setTested(e.target.checked)} />
        Soil sample tested
      </label>
      <FormField label="Findings for the farmer" hint="Optional, e.g. pH, organic carbon, what to add before sowing">
        {(f) => <TextArea {...f} rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />}
      </FormField>
      {error && (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Send land report
        </Button>
      </div>
    </form>
  );
}
