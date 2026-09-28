import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { Bookmark, MapPin, Star } from "lucide-react";
import type { Offering } from "./offerings";
import { suitsCrop } from "./offerings";
import { useAppStore } from "../../store/AppStore";
import { publicLabel } from "../shared/identity";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote, type Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { FormField, TextArea } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatHour } from "../../utils/format";

export interface RequestState {
  label: string;
  tone: Tone;
}

/** A machinery or technology listing with View, Compare, Request, Contact and Save (spec §11). */
export function OfferingCard({
  o,
  crop,
  request,
  comparing,
  compareDisabled,
  onCompare,
  onView,
  onRequest,
  onContact,
}: {
  o: Offering;
  crop?: string;
  request?: RequestState;
  comparing: boolean;
  compareDisabled: boolean;
  onCompare: (on: boolean) => void;
  onView: () => void;
  onRequest: () => void;
  onContact: () => void;
}) {
  const { savedResources, toggleSavedResource } = useAppStore();
  const saved = savedResources.includes(o.key);
  const unavailable = o.machine?.status === "maintenance";
  const compareId = `compare-${o.key}`;

  return (
    <Card className={clsx("flex flex-col p-4", comparing && "ring-2 ring-brand-500")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap gap-1.5">
            <Badge tone="resource">{o.typeLabel}</Badge>
            {suitsCrop(o, crop) && <Badge tone="crop">Suits your {crop!.toLowerCase()}</Badge>}
          </div>
          <h3 className="text-sm font-semibold">{o.name}</h3>
          <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-muted">
            <span>{o.provider}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3" />
              {o.location}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${o.name} from saved` : `Save ${o.name}`}
          title={saved ? "Saved" : "Save"}
          onClick={() => toggleSavedResource(o.key)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink"
        >
          <Bookmark aria-hidden className={saved ? "size-4 fill-current text-brand-700" : "size-4"} />
        </button>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{o.description}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        <div>
          <dt className="text-ink-subtle">Price (indicative)</dt>
          <dd className="font-medium text-ink">{o.price}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Service</dt>
          <dd className="font-medium text-ink">{o.serviceType}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Availability</dt>
          <dd className={clsx("font-medium", o.availability.tone === "success" ? "text-success" : o.availability.tone === "warning" ? "text-warning" : "text-ink")}>
            {o.availability.label}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Rating</dt>
          <dd className="inline-flex items-center gap-1 text-ink-muted">
            <Star aria-hidden className="size-3" />
            No ratings yet
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-subtle">Suitable crops</dt>
          <dd className="text-ink">{o.suitableCrops.join(", ")}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <label htmlFor={compareId} className={clsx("inline-flex items-center gap-2 text-[13px]", compareDisabled && !comparing && "text-ink-subtle")}>
          <input
            id={compareId}
            type="checkbox"
            className="size-4 accent-brand-700"
            checked={comparing}
            disabled={compareDisabled && !comparing}
            onChange={(e) => onCompare(e.target.checked)}
          />
          Compare
        </label>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="ghost" onClick={onView}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={onContact}>
            Contact
          </Button>
          {request ? (
            <Badge tone={request.tone} className="self-center">
              {request.label}
            </Badge>
          ) : (
            <Button size="sm" variant="secondary" onClick={onRequest} disabled={unavailable}>
              Request
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function OfferingDetailDialog({ o, onClose, onRequest, requested }: { o: Offering; onClose: () => void; onRequest: () => void; requested: boolean }) {
  return (
    <Dialog
      title={o.name}
      description={`${o.typeLabel} · ${o.provider} · ${o.location}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!requested && (
            <Button onClick={onRequest} disabled={o.machine?.status === "maintenance"}>
              Request
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 text-[13px]">
        <p>{o.description}</p>
        <CompareTable offerings={[o]} single />
        {o.tech && (
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">How it works</div>
            <ol className="list-decimal space-y-1 pl-5 text-ink-muted">
              {o.tech.howItWorks.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-2 text-ink-muted">{o.tech.access}</p>
          </div>
        )}
        {o.machine?.availableSlots && o.machine.availableSlots.length > 0 && (
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Owner availability</div>
            <ul className="flex flex-wrap gap-1.5">
              {o.machine.availableSlots.map((s) => (
                <li key={`${s.date}-${s.startHour}`} className="rounded-md bg-success-soft px-2 py-0.5 text-[12px] text-success">
                  {formatDate(s.date)} {formatHour(s.startHour)}–{formatHour(s.endHour)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <InfoNote>Prices are indicative. The provider confirms the final price and date. Ratings will appear once farmers review completed work.</InfoNote>
      </div>
    </Dialog>
  );
}

const compareRows: [string, (o: Offering) => string][] = [
  ["Type", (o) => o.typeLabel],
  ["Provider", (o) => o.provider],
  ["Location", (o) => o.location],
  ["Price (indicative)", (o) => o.price],
  ["Service", (o) => o.serviceType],
  ["Availability", (o) => o.availability.label],
  ["Suitable crops", (o) => o.suitableCrops.join(", ")],
  ["Rating", () => "No ratings yet"],
];

function CompareTable({ offerings, single }: { offerings: Offering[]; single?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        {!single && (
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 pr-3 font-medium text-ink-muted">
                <span className="sr-only">Detail</span>
              </th>
              {offerings.map((o) => (
                <th key={o.key} scope="col" className="min-w-[8rem] py-2 pr-3 font-semibold">
                  {o.name}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-line align-top">
          {compareRows.map(([label, get]) => (
            <tr key={label}>
              <th scope="row" className="whitespace-nowrap py-2 pr-3 text-left font-normal text-ink-subtle">
                {label}
              </th>
              {offerings.map((o) => (
                <td key={o.key} className="py-2 pr-3">
                  {get(o)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompareDialog({ offerings, onClose, onClear }: { offerings: Offering[]; onClose: () => void; onClear: () => void }) {
  return (
    <Dialog
      title={`Compare ${offerings.length} options`}
      description="Side by side. Prices are indicative."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClear}>
            Clear comparison
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <CompareTable offerings={offerings} />
    </Dialog>
  );
}

/** Message a provider through AgriCluster; the farmer's phone number is not shared. */
export function ContactDialog({ o, onClose }: { o: Offering; onClose: () => void }) {
  const { session, notify } = useAppStore();
  const toast = useToast();
  const [message, setMessage] = useState(`Is the ${o.name.toLowerCase()} available next week? What would it cost for my field?`);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return setError("Write a short message for the provider.");
    const from = publicLabel(session!.userId, session!.role);
    notify({
      userId: o.providerUserId,
      kind: "machinery",
      title: `${from} asked about ${o.name}`,
      body: message.trim(),
      link: o.providerUserId.startsWith("u-cluster") ? "/cluster/resources" : "/provider/bookings",
    });
    toast(`Message sent to ${o.provider}. Replies arrive in your notifications.`);
    onClose();
  };

  return (
    <Dialog
      title={`Contact ${o.provider}`}
      description={o.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="contact-provider">
            Send message
          </Button>
        </>
      }
    >
      <form id="contact-provider" onSubmit={submit} noValidate className="space-y-4">
        <FormField label="Message" error={error}>
          {(p) => <TextArea {...p} rows={3} value={message} onChange={(e) => (setMessage(e.target.value), setError(null))} />}
        </FormField>
        <InfoNote>The provider sees your farm label and message. Your phone number and farm details are not shared.</InfoNote>
      </form>
    </Dialog>
  );
}
