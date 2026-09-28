import { useState, type FormEvent } from "react";
import type { LabourProfile, LabourSkill, Machinery, Technology } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Dialog } from "../../components/modals/Dialog";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { DEMO_TODAY, DEMO_TOMORROW } from "../../data/mock/clock";
import { skillLabels } from "../../data/mock/labour";
import { formatDate, formatHour, formatINR } from "../../utils/format";
import { kindLabels, ownerLabel } from "./labels";
import { usePlan } from "../plan/usePlan";
import { cropCatalogue } from "../../data/catalog/crops";

const purposes = ["Land preparation", "Harvest transport", "Spraying", "Inter-cultivation", "Other"];

export function RequestMachineryDialog({ machine, onClose }: { machine: Machinery; onClose: () => void }) {
  const { session, addBooking } = useAppStore();
  const toast = useToast();
  const [date, setDate] = useState(DEMO_TOMORROW);
  const [startHour, setStartHour] = useState(9);
  const [hours, setHours] = useState(3);
  const [purpose, setPurpose] = useState(machine.kind === "transport" ? "Harvest transport" : purposes[0]);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (date < DEMO_TODAY) return setError("Choose today or a later date.");
    addBooking({
      machineryId: machine.id,
      requesterUserId: session!.userId,
      date,
      startHour,
      hours,
      purpose,
      estimatedCost: machine.ratePerHour * hours,
    });
    toast(`Request sent to ${ownerLabel(machine)}. Track it under My requests.`);
    onClose();
  };

  return (
    <Dialog
      title={`Request ${machine.name}`}
      description={`${kindLabels[machine.kind]} · ${ownerLabel(machine)} · ${machine.village}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="machinery-request">
            Send request
          </Button>
        </>
      }
    >
      <form id="machinery-request" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Date" error={error} className="sm:col-span-1">
            {(p) => <TextInput {...p} type="date" min={DEMO_TODAY} value={date} onChange={(e) => (setDate(e.target.value), setError(null))} />}
          </FormField>
          <FormField label="Start">
            {(p) => (
              <SelectInput {...p} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="Hours">
            {(p) => (
              <SelectInput {...p} value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                  <option key={h} value={h}>
                    {h} h
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
        </div>
        <FormField label="Purpose">
          {(p) => (
            <SelectInput {...p} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {purposes.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5 text-[13px]">
          <span className="text-ink-muted">
            Estimated cost ({formatINR(machine.ratePerHour)}/h × {hours} h)
          </span>
          <span className="font-semibold tabular-nums">{formatINR(machine.ratePerHour * hours)}</span>
        </div>
        <InfoNote>Indicative rate. The owner confirms availability and the final price. No payment is taken in the prototype.</InfoNote>
      </form>
    </Dialog>
  );
}

export function RequestLabourDialog({ crew, onClose }: { crew: LabourProfile; onClose: () => void }) {
  const { session, addLabourRequest } = useAppStore();
  const toast = useToast();
  const [skill, setSkill] = useState<LabourSkill>(crew.skills[0]);
  const [workers, setWorkers] = useState(Math.min(4, crew.crewSize));
  const [date, setDate] = useState(crew.availableFrom > DEMO_TOMORROW ? crew.availableFrom : DEMO_TOMORROW);
  const [days, setDays] = useState(2);
  const [note, setNote] = useState("");
  const plan = usePlan();
  const [crop, setCrop] = useState(plan.crop?.name ?? crew.cropExperience[0] ?? "Tomato");
  const [location, setLocation] = useState(plan.assessment.location.split(",")[0]);
  const [locError, setLocError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return setLocError("Enter the village where the work is.");
    addLabourRequest({
      labourProfileId: crew.id,
      requesterUserId: session!.userId,
      skill,
      crop,
      location: location.trim(),
      workers,
      date,
      days,
      note: note.trim(),
    });
    toast(`Request sent to ${crew.leadName}. Track it under My requests.`);
    onClose();
  };

  return (
    <Dialog
      title={`Request ${crew.label}`}
      description={`Lead: ${crew.leadName} · up to ${crew.crewSize} workers`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="labour-request">
            Send request
          </Button>
        </>
      }
    >
      <form id="labour-request" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Crop" hint={crew.cropExperience.includes(crop) ? `The crew has worked with ${crop.toLowerCase()}` : undefined}>
            {(p) => (
              <SelectInput {...p} value={crop} onChange={(e) => setCrop(e.target.value)}>
                {cropCatalogue.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="Location" error={locError} hint="Village only; your exact farm is shared after the crew accepts">
            {(p) => <TextInput {...p} value={location} onChange={(e) => (setLocation(e.target.value), setLocError(null))} />}
          </FormField>
          <FormField label="Task">
            {(p) => (
              <SelectInput {...p} value={skill} onChange={(e) => setSkill(e.target.value as LabourSkill)}>
                {crew.skills.map((s) => (
                  <option key={s} value={s}>
                    {skillLabels[s]}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="Workers">
            {(p) => (
              <SelectInput {...p} value={workers} onChange={(e) => setWorkers(Number(e.target.value))}>
                {Array.from({ length: crew.crewSize }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          <FormField label="Start date" hint={crew.availableFrom > DEMO_TODAY ? `Available from ${formatDate(crew.availableFrom)}` : undefined}>
            {(p) => <TextInput {...p} type="date" min={DEMO_TODAY} value={date} onChange={(e) => setDate(e.target.value)} />}
          </FormField>
          <FormField label="Days">
            {(p) => (
              <SelectInput {...p} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "day" : "days"}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
        </div>
        <FormField label="Note for the crew" hint="Optional — field, crop, what to bring">
          {(p) => <TextArea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>
        <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5 text-[13px]">
          <span className="text-ink-muted">
            Estimated wages ({workers} × {days} days × {formatINR(crew.dailyWage)})
          </span>
          <span className="font-semibold tabular-nums">{formatINR(workers * days * crew.dailyWage)}</span>
        </div>
      </form>
    </Dialog>
  );
}

export function RequestTechnologyDialog({ tech, onClose }: { tech: Technology; onClose: () => void }) {
  const { session, addServiceRequest } = useAppStore();
  const toast = useToast();
  const [note, setNote] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    addServiceRequest({ technologyId: tech.id, requesterUserId: session!.userId, note: note.trim() });
    toast(`${tech.name} request sent to the cluster office.`);
    onClose();
  };

  return (
    <Dialog
      title={`Request ${tech.name.toLowerCase()}`}
      description={tech.access}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="tech-request">
            Send request
          </Button>
        </>
      }
    >
      <form id="tech-request" onSubmit={submit} className="space-y-4">
        <FormField label="What would you like help with?" hint="Optional — e.g. which fields, preferred week">
          {(p) => <TextArea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </FormField>
        <InfoNote>Indicative cost: {tech.indicativeCost}. The cluster office will confirm details before anything is scheduled.</InfoNote>
      </form>
    </Dialog>
  );
}
