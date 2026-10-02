import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Lock } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { landDetailsHelp } from "../../data/catalog/support";
import { supportStatus } from "./SupportCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { ChoiceCards, FormField, TextArea } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";

const unknowns = [
  { id: "soil", label: "Soil type or soil health" },
  { id: "water", label: "How much water I have" },
  { id: "size", label: "Exact land size or land records" },
  { id: "other", label: "Something else" },
] as const;
type Unknown = (typeof unknowns)[number]["id"];

/**
 * Step 1 of the plan: a farmer who doesn't know their land's details can ask the
 * cluster office for help instead of guessing. Sent as a support request, so the
 * office sees it on its Support page and both sides are notified as it moves on.
 */
export function LandDetailsHelp() {
  const { session, supportRequests } = useAppStore();
  const [asking, setAsking] = useState(false);
  const open = supportRequests.find((r) => r.schemeId === landDetailsHelp.id && r.requesterUserId === session?.userId && r.status !== "closed");

  return (
    <div className="rounded-lg border border-line bg-canvas p-4 text-[13px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-2.5">
          <HelpCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
          <div>
            <div className="font-medium">Don't know these details about your land?</div>
            <p className="mt-0.5 text-ink-muted">
              Ask us. The cluster office can call you or meet you at the Raitha Samparka Kendra, arrange a soil test and help read your land records. Fill in your best guess for now
              and change it later.
            </p>
            {open?.officeNote && (
              <p className="mt-2 rounded-lg bg-surface px-3 py-2">
                <span className="font-medium">Cluster office: </span>
                {open.officeNote}
              </p>
            )}
          </div>
        </div>
        {open ? (
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <Badge tone={supportStatus[open.status].tone}>{supportStatus[open.status].label}</Badge>
            <Link to="/farmer/support?tab=requests" className="text-[12px] text-brand-700 underline underline-offset-2">
              See your request
            </Link>
          </div>
        ) : (
          <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setAsking(true)}>
            Contact us for help
          </Button>
        )}
      </div>
      {asking && <LandDetailsDialog onClose={() => setAsking(false)} />}
    </div>
  );
}

function LandDetailsDialog({ onClose }: { onClose: () => void }) {
  const { session, addSupportRequest } = useAppStore();
  const toast = useToast();
  const [what, setWhat] = useState<Unknown[]>(["soil"]);
  const [contact, setContact] = useState<"call" | "rsk-visit">("call");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: Unknown) => {
    setWhat((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (what.length === 0) return setError("Choose at least one thing you'd like help with.");
    const about = unknowns.filter((u) => what.includes(u.id)).map((u) => u.label.toLowerCase());
    const text = [`Not sure about: ${about.join(", ")}.`, note.trim()].filter(Boolean).join(" ");
    addSupportRequest({ schemeId: landDetailsHelp.id, requesterUserId: session!.userId, help: "land-details", contact, note: text });
    toast("Sent to the cluster office. You'll get a notification when they reply.");
    onClose();
  };

  return (
    <Dialog
      title="Get help with your land details"
      description="The cluster office will contact you."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="land-help">
            Send to cluster office
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
        </fieldset>
        <ChoiceCards<"call" | "rsk-visit">
          legend="How should they reach you?"
          name="land-contact"
          value={contact}
          onChange={setContact}
          columns={2}
          options={[
            { id: "call", title: "Call me", description: "Through the cluster office" },
            { id: "rsk-visit", title: "Meet at the Raitha Samparka Kendra", description: "They'll suggest a time" },
          ]}
        />
        <FormField label="Anything they should know?" hint="Optional, e.g. survey number or village">
          {(f) => <TextArea {...f} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>
        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[13px] text-ink-muted">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Only the cluster office sees this request. Buyers, labour and providers never do.</span>
        </div>
      </form>
    </Dialog>
  );
}
