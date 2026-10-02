import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, HelpCircle, Lock, Phone } from "lucide-react";
import type { LandReport, SupportContact } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { landDetailsHelp } from "../../data/catalog/support";
import { BUSINESS, isPlaceholder } from "../../data/pricing";
import { supportStatus } from "./SupportCard";
import { landReportRows, validPhone } from "./labels";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { ChoiceCards, FormField, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/format";

const unknowns = [
  { id: "soil", label: "Soil type or soil health" },
  { id: "water", label: "How much water I have" },
  { id: "size", label: "Exact land size or land records" },
  { id: "other", label: "Something else" },
] as const;
type Unknown = (typeof unknowns)[number]["id"];

/** The helpline, once a real number is set in src/data/pricing.ts (BUSINESS.phone). */
const helpline = isPlaceholder(BUSINESS.phone) ? null : BUSINESS.phone;

interface Props {
  /** Prefills for the request: the farmer's phone (if they gave one) and village. */
  phone?: string;
  place?: string;
  /** Fill the assessment form with what the team found. */
  onApply: (report: LandReport) => void;
}

/**
 * Step 1 of the plan: a farmer who doesn't know their land's details can call the
 * helpline, or ask the cluster office to call back, meet at the RSK, or visit the
 * farm to test the soil and measure the land. The office sends back a land report
 * that fills in the assessment with one tap.
 */
export function LandDetailsHelp({ phone, place, onApply }: Props) {
  const { session, supportRequests } = useAppStore();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const mine = supportRequests.filter((r) => r.schemeId === landDetailsHelp.id && r.requesterUserId === session?.userId);
  const open = mine.find((r) => r.status !== "closed");
  const report = mine.find((r) => r.landReport)?.landReport;

  return (
    <div className="space-y-3 rounded-lg border border-line bg-canvas p-4 text-[13px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-2.5">
          <HelpCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
          <div>
            <div className="font-medium">Don't know these details about your land?</div>
            <p className="mt-0.5 text-ink-muted">
              Contact us. Our team can visit your farm to test the soil, check your water and measure the land, then send you a land report. Fill in your best guess for now.
            </p>
            {open?.officeNote && (
              <p className="mt-2 rounded-lg bg-surface px-3 py-2">
                <span className="font-medium">Cluster office: </span>
                {open.officeNote}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {helpline && (
            <a
              href={`tel:${helpline.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-800"
            >
              <Phone aria-hidden className="size-3.5" />
              Call us: {helpline}
            </a>
          )}
          {open ? (
            <>
              <Badge tone={supportStatus[open.status].tone}>{supportStatus[open.status].label}</Badge>
              <Link to="/farmer/support?tab=requests" className="text-[12px] text-brand-700 underline underline-offset-2">
                See your request
              </Link>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setAsking(true)}>
              {helpline ? "Or ask us to contact you" : "Contact us for help"}
            </Button>
          )}
        </div>
      </div>

      {report && (
        <div className="rounded-lg border border-brand-200 bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <ClipboardCheck aria-hidden className="size-4 text-success" />
              Your land report · checked {formatDate(report.checkedOn)}
            </div>
            <Button
              size="sm"
              onClick={() => {
                onApply(report);
                toast("Land report applied. Check the details, then continue.");
              }}
            >
              Use these details
            </Button>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {landReportRows(report).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] text-ink-subtle">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {report.notes && <p className="mt-2 text-ink-muted">{report.notes}</p>}
        </div>
      )}

      {asking && <LandDetailsDialog phone={phone} place={place} onClose={() => setAsking(false)} />}
    </div>
  );
}

function LandDetailsDialog({ phone: initialPhone, place: initialPlace, onClose }: { phone?: string; place?: string; onClose: () => void }) {
  const { session, addSupportRequest } = useAppStore();
  const toast = useToast();
  const [what, setWhat] = useState<Unknown[]>(["soil"]);
  const [contact, setContact] = useState<SupportContact>("farm-visit");
  const [phone, setPhone] = useState(initialPhone && validPhone(initialPhone) ? initialPhone : "");
  const [place, setPlace] = useState(initialPlace ?? "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ what?: string; phone?: string; place?: string }>({});
  const needsPhone = contact !== "rsk-visit";

  const toggle = (id: Unknown) => {
    setWhat((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
    setErrors((e) => ({ ...e, what: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // This dialog renders inside the assessment form; React would bubble the submit up to it.
    e.stopPropagation();
    const next: typeof errors = {};
    if (what.length === 0) next.what = "Choose at least one thing you'd like help with.";
    if (needsPhone && !validPhone(phone)) next.phone = "Enter a 10-digit mobile number so the team can reach you.";
    if (contact === "farm-visit" && !place.trim()) next.place = "Enter your village or a landmark so the team can find your farm.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const about = unknowns.filter((u) => what.includes(u.id)).map((u) => u.label.toLowerCase());
    const text = [`Not sure about: ${about.join(", ")}.`, note.trim()].filter(Boolean).join(" ");
    addSupportRequest({
      schemeId: landDetailsHelp.id,
      requesterUserId: session!.userId,
      help: "land-details",
      contact,
      note: text,
      phone: needsPhone ? phone.trim() : undefined,
      place: contact === "farm-visit" ? place.trim() : undefined,
    });
    toast(
      contact === "farm-visit"
        ? "Visit requested. The cluster office will call you to fix a day, then send your land report."
        : "Sent to the cluster office. You'll get a notification when they reply.",
    );
    onClose();
  };

  return (
    <Dialog
      title="Get help with your land details"
      description="Our team will contact you."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="land-help">
            {contact === "farm-visit" ? "Request a farm visit" : "Send to cluster office"}
          </Button>
        </>
      }
    >
      <form id="land-help" onSubmit={submit} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">What are you not sure about?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {unknowns.map((u) => (
              <label key={u.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px]">
                <input type="checkbox" className="size-4 accent-brand-700" checked={what.includes(u.id)} onChange={() => toggle(u.id)} />
                {u.label}
              </label>
            ))}
          </div>
          {errors.what && (
            <p role="alert" className="mt-1 text-[12px] text-danger">
              {errors.what}
            </p>
          )}
        </fieldset>
        <ChoiceCards<SupportContact>
          legend="How should our team help?"
          name="land-contact"
          value={contact}
          onChange={(c) => (setContact(c), setErrors({}))}
          options={[
            { id: "farm-visit", title: "Visit my farm and test the land", description: "They take a soil sample, check your water and measure the land" },
            { id: "call", title: "Call me", description: "They talk you through it on the phone" },
            { id: "rsk-visit", title: "Meet at the Raitha Samparka Kendra", description: "They'll suggest a time" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {needsPhone && (
            <FormField label="Your mobile number" error={errors.phone} hint="Only the cluster office sees it">
              {(f) => <TextInput {...f} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => (setPhone(e.target.value), setErrors((x) => ({ ...x, phone: undefined })))} />}
            </FormField>
          )}
          {contact === "farm-visit" && (
            <FormField label="Village or landmark" error={errors.place}>
              {(f) => <TextInput {...f} value={place} onChange={(e) => (setPlace(e.target.value), setErrors((x) => ({ ...x, place: undefined })))} />}
            </FormField>
          )}
        </div>
        <FormField label="Anything they should know?" hint="Optional, e.g. survey number or best days to visit">
          {(f) => <TextArea {...f} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>
        <div className="flex gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[13px] text-ink-muted">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Only the cluster office sees this request and your number. Buyers, labour and providers never do.</span>
        </div>
      </form>
    </Dialog>
  );
}
