import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarPlus, MapPin, Plus, X } from "lucide-react";
import type { Machinery, ResourceKind } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useProvider } from "../../features/provider/useProvider";
import { kindLabels } from "../../features/resources/labels";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { EmptyState } from "../../components/ui/states";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { CLUSTER_ID } from "../../data/mock/users";
import { villageNames } from "../../data/mock/clusterFarms";
import { DEMO_TODAY, DEMO_TOMORROW } from "../../data/mock/clock";
import { formatDate, formatHour, formatINR } from "../../utils/format";

export function EquipmentPage() {
  const p = useProvider();
  const { editMachinery } = useAppStore();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [slotFor, setSlotFor] = useState<Machinery | null>(null);

  const closeAdd = () => {
    setAdding(false);
    if (params.has("add")) setParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Equipment"
        description="What have you listed, and when is it available?"
        actions={
          <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setAdding(true)}>
            Add equipment
          </Button>
        }
      />
      {p.equipment.length === 0 ? (
        <Card>
          <EmptyState title="No equipment listed yet" description="Add a tractor, sprayer or vehicle so cluster farmers can book it." />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {p.equipment.map((m) => {
            const booked = p.bookings.filter((b) => b.machineryId === m.id && (b.status === "accepted" || b.status === "requested")).length;
            return (
              <Card key={m.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{m.name}</div>
                    <div className="flex flex-wrap gap-x-3 text-[13px] text-ink-muted">
                      <span>{kindLabels[m.kind]}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden className="size-3" />
                        {m.village}
                      </span>
                      <span>{formatINR(m.ratePerHour)}/h</span>
                    </div>
                  </div>
                  <Badge tone={m.status === "maintenance" ? "warning" : m.status === "booked" ? "neutral" : "success"}>
                    {m.status === "maintenance" ? "Maintenance" : m.status === "booked" ? "Booked today" : "Free today"}
                  </Badge>
                </div>
                {m.notes && <p className="mt-2 text-[13px] text-ink-muted">{m.notes}</p>}

                <div className="mt-3 text-[12px] font-medium text-ink-subtle">Availability</div>
                {m.availableSlots?.length ? (
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {m.availableSlots.map((s, i) => (
                      <li key={`${s.date}-${s.startHour}`} className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-[12px] text-success">
                        {formatDate(s.date)} {formatHour(s.startHour)}–{formatHour(s.endHour)}
                        <button
                          type="button"
                          aria-label={`Remove slot ${formatDate(s.date)}`}
                          onClick={() => editMachinery(m.id, { availableSlots: m.availableSlots!.filter((_, j) => j !== i) })}
                          className="text-success/70 hover:text-success"
                        >
                          <X aria-hidden className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[12px] text-ink-muted">No slots set — farmers can still request, you confirm each one.</p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                  <span className="text-[12px] text-ink-muted">{booked} active request{booked === 1 ? "" : "s"} / booking{booked === 1 ? "" : "s"}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const status = m.status === "maintenance" ? "available" : "maintenance";
                        editMachinery(m.id, { status });
                        toast(status === "maintenance" ? `${m.name} marked under maintenance.` : `${m.name} is available again.`);
                      }}
                    >
                      {m.status === "maintenance" ? "Mark available" : "Mark maintenance"}
                    </Button>
                    <Button size="sm" variant="secondary" icon={<CalendarPlus aria-hidden className="size-3.5" />} onClick={() => setSlotFor(m)}>
                      Set availability
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {adding && <AddEquipmentDialog onClose={closeAdd} />}
      {slotFor && <AvailabilityDialog machine={slotFor} onClose={() => setSlotFor(null)} />}
    </>
  );
}

function AddEquipmentDialog({ onClose }: { onClose: () => void }) {
  const { session, addEquipment } = useAppStore();
  const toast = useToast();
  const [kind, setKind] = useState<ResourceKind>("tractor");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("900");
  const [village, setVillage] = useState("Yelwala");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the equipment a name farmers will recognise, e.g. “Tractor · 50 HP”.");
    addEquipment({
      kind,
      name: name.trim(),
      ownerUserId: session!.userId,
      clusterId: CLUSTER_ID,
      village,
      ratePerHour: Number(rate) || 0,
      status: "available",
      notes: notes.trim() || undefined,
      availableSlots: [],
    });
    toast(`${name.trim()} listed. Farmers can now request it.`);
    onClose();
  };

  return (
    <Dialog
      title="Add equipment"
      description="Listed equipment is visible to every farmer in the cluster."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-equipment">
            Add equipment
          </Button>
        </>
      }
    >
      <form id="add-equipment" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type">
          {(p) => (
            <SelectInput {...p} value={kind} onChange={(e) => setKind(e.target.value as ResourceKind)}>
              {(["tractor", "harvester", "sprayer", "drone", "tiller", "transport"] as ResourceKind[]).map((k) => (
                <option key={k} value={k}>
                  {kindLabels[k]}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Name" error={error}>
          {(p) => <TextInput {...p} placeholder="Tractor · 50 HP" value={name} onChange={(e) => (setName(e.target.value), setError(null))} />}
        </FormField>
        <FormField label="Rate (₹ per hour)" hint="Indicative — you confirm the final price">
          {(p) => <TextInput {...p} type="number" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />}
        </FormField>
        <FormField label="Location">
          {(p) => (
            <SelectInput {...p} value={village} onChange={(e) => setVillage(e.target.value)}>
              {villageNames.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Notes" hint="Optional — attachments, operator included, fuel" className="sm:col-span-2">
          {(p) => <TextArea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </FormField>
      </form>
    </Dialog>
  );
}

function AvailabilityDialog({ machine, onClose }: { machine: Machinery; onClose: () => void }) {
  const { editMachinery } = useAppStore();
  const toast = useToast();
  const [date, setDate] = useState(DEMO_TOMORROW);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(16);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (endHour <= startHour) return setError("End time must be after the start time.");
    if (date < DEMO_TODAY) return setError("Choose today or a later date.");
    const slots = [...(machine.availableSlots ?? []), { date, startHour, endHour }].sort((a, b) => a.date.localeCompare(b.date));
    editMachinery(machine.id, { availableSlots: slots });
    toast(`${machine.name}: available ${formatDate(date)}, ${formatHour(startHour)}–${formatHour(endHour)}.`);
    onClose();
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 6);
  return (
    <Dialog
      title={`Set availability · ${machine.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="set-availability">
            Save slot
          </Button>
        </>
      }
    >
      <form id="set-availability" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Date" error={error}>
            {(p) => <TextInput {...p} type="date" min={DEMO_TODAY} value={date} onChange={(e) => (setDate(e.target.value), setError(null))} />}
          </FormField>
          <FormField label="From">
            {(p) => (
              <SelectInput {...p} value={startHour} onChange={(e) => (setStartHour(Number(e.target.value)), setError(null))}>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="To">
            {(p) => (
              <SelectInput {...p} value={endHour} onChange={(e) => (setEndHour(Number(e.target.value)), setError(null))}>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
        </div>
        <InfoNote>Farmers see these slots when they request equipment. You still confirm every booking.</InfoNote>
      </form>
    </Dialog>
  );
}
