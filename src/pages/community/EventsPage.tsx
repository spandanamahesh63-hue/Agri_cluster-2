import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import type { EventKind } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { EventRow } from "../../features/community/EventRow";
import { eventKindLabels } from "../../data/mock/community";
import { villageNames } from "../../data/mock/clusterFarms";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { EmptyState } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { DEMO_TODAY, DEMO_TOMORROW } from "../../data/mock/clock";
import { formatDate, formatHour } from "../../utils/format";

/** Events and workshops (spec §17). */
export function EventsPage() {
  const { events } = useAppStore();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [kind, setKind] = useState<EventKind | "all">("all");
  const upcoming = [...events].filter((e) => e.date >= DEMO_TODAY && (kind === "all" || e.kind === kind)).sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
  const close = () => {
    setAdding(false);
    if (params.has("add")) setParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Events"
        description="What workshops and meetings are coming up?"
        actions={
          <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setAdding(true)}>
            Plan an event
          </Button>
        }
      />
      <div className="mb-4">
        <FilterChips<EventKind | "all">
          label="Event type"
          value={kind}
          onChange={setKind}
          options={[{ id: "all", label: "All" }, ...(Object.keys(eventKindLabels) as EventKind[]).map((k) => ({ id: k, label: eventKindLabels[k] }))]}
        />
      </div>
      <Card>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming events of this type" description="Plan one for your groups." />
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        )}
      </Card>
      {adding && <NewEventDialog onClose={close} />}
    </>
  );
}

function NewEventDialog({ onClose }: { onClose: () => void }) {
  const { session, groups, addEvent, addPost } = useAppStore();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("workshop");
  const [date, setDate] = useState(DEMO_TOMORROW);
  const [startHour, setStartHour] = useState(10);
  const [village, setVillage] = useState("Chamarajanagara");
  const [groupId, setGroupId] = useState("");
  const [seats, setSeats] = useState("30");
  const [description, setDescription] = useState("");
  const [announce, setAnnounce] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; date?: string; seats?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (title.trim().length < 4) next.title = "Give the event a clear title.";
    if (date < DEMO_TODAY) next.date = "Choose today or a later date.";
    if (!(Number(seats) > 0)) next.seats = "Enter how many people can attend.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const group = groups.find((g) => g.id === groupId);
    addEvent({
      title: title.trim(),
      kind,
      date,
      startHour,
      village,
      groupId: group?.id,
      hostLabel: group?.name ?? session!.name,
      organiserUserId: session!.userId,
      description: description.trim() || `${eventKindLabels[kind]} in ${village}.`,
      seats: Number(seats),
      baseRegistered: 0,
      attendeeUserIds: [],
    });
    if (announce)
      addPost({
        authorUserId: session!.userId,
        authorLabel: session!.name,
        authorRole: session!.role,
        category: "announcement",
        title: `${title.trim()} on ${formatDate(date)}`,
        body: `${eventKindLabels[kind]} in ${village} at ${formatHour(startHour)}. Register from Community → Events near you.`,
      });
    toast(announce ? "Event created and announced to the community." : "Event created.");
    onClose();
  };

  return (
    <Dialog
      title="Plan an event"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-event">
            Create event
          </Button>
        </>
      }
    >
      <form id="new-event" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField label="Title" error={errors.title} className="sm:col-span-2">
          {(p) => <TextInput {...p} value={title} placeholder="e.g. Safe spraying demonstration" onChange={(e) => setTitle(e.target.value)} />}
        </FormField>
        <FormField label="Type">
          {(p) => (
            <SelectInput {...p} value={kind} onChange={(e) => setKind(e.target.value as EventKind)}>
              {(Object.keys(eventKindLabels) as EventKind[]).map((k) => (
                <option key={k} value={k}>
                  {eventKindLabels[k]}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="For group" hint="Optional">
          {(p) => (
            <SelectInput {...p} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Open to everyone</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Date" error={errors.date}>
          {(p) => <TextInput {...p} type="date" min={DEMO_TODAY} value={date} onChange={(e) => setDate(e.target.value)} />}
        </FormField>
        <FormField label="Start">
          {(p) => (
            <SelectInput {...p} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
              {Array.from({ length: 13 }, (_, i) => i + 7).map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Village">
          {(p) => (
            <SelectInput {...p} value={village} onChange={(e) => setVillage(e.target.value)}>
              {villageNames.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Seats" error={errors.seats}>
          {(p) => <TextInput {...p} type="number" min="1" inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} />}
        </FormField>
        <FormField label="What will happen" hint="Optional" className="sm:col-span-2">
          {(p) => <TextArea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </FormField>
        <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
          <input type="checkbox" className="size-4 accent-brand-700" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
          Also post it as a local announcement
        </label>
      </form>
    </Dialog>
  );
}
