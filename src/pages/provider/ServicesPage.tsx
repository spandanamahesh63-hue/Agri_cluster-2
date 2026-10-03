import { useState, type FormEvent } from "react";
import { MapPin, Plus } from "lucide-react";
import type { ServiceRequest, ServiceType, Technology } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useTechnologies } from "../../features/shared/useMerged";
import { techTypeLabels } from "../../features/resources/offerings";
import { farmLabelForUser } from "../../data/mock/farms";
import { villageNames } from "../../data/mock/clusterFarms";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, type Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { EmptyState } from "../../components/ui/states";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/format";

const cropChoices = ["All crops", "Tomato", "Chilli", "Onion", "Beans", "Leafy vegetables", "Ragi"];
const requestStatus: Record<ServiceRequest["status"], { label: string; tone: Tone }> = {
  requested: { label: "New request", tone: "info" },
  scheduled: { label: "Scheduled", tone: "brand" },
  completed: { label: "Done", tone: "neutral" },
};

/** Technology services an owner offers (drone spraying, soil testing, sensors…) and farmers' requests for them. */
export function ServicesPage() {
  const { session, serviceRequests, update } = useAppStore();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const mine = useTechnologies().filter((t) => t.providerUserId === session?.userId);
  const ids = new Set(mine.map((t) => t.id));
  const requests = serviceRequests.filter((r) => ids.has(r.technologyId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const move = (r: ServiceRequest, status: ServiceRequest["status"]) => {
    update("serviceRequests", r.id, { status });
    toast(`${farmLabelForUser(r.requesterUserId)} has been notified.`);
  };

  return (
    <>
      <PageHeader
        title="Services"
        description="Which technology services do you offer, and who has asked for one?"
        actions={
          <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setAdding(true)}>
            Add service
          </Button>
        }
      />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Requests from farmers" subtitle={requests.length ? undefined : "Requests for your services appear here"} />
          {requests.length === 0 ? (
            <EmptyState title="No requests yet" />
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => {
                const t = mine.find((x) => x.id === r.technologyId);
                const st = requestStatus[r.status];
                return (
                  <li key={r.id} className="flex flex-col gap-2 px-5 py-4 text-[13px] sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-medium">
                        {farmLabelForUser(r.requesterUserId)} · {t?.name}
                      </div>
                      <div className="text-ink-muted">Asked {formatDate(r.createdAt.slice(0, 10))}</div>
                      {r.note && <div className="text-ink-muted">“{r.note}”</div>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {r.status === "requested" && (
                        <Button size="sm" variant="secondary" onClick={() => move(r, "scheduled")}>
                          Schedule
                        </Button>
                      )}
                      {r.status === "scheduled" && (
                        <Button size="sm" variant="secondary" onClick={() => move(r, "completed")}>
                          Mark done
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {mine.length === 0 ? (
          <Card>
            <EmptyState
              title="No services listed yet"
              description="Add drone spraying, soil testing, sensor installation or any other service so cluster farmers can request it."
              action={
                <Button size="sm" onClick={() => setAdding(true)}>
                  Add service
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="flex flex-wrap gap-x-3 text-[13px] text-ink-muted">
                  <span>{techTypeLabels[t.category]}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden className="size-3" />
                    {t.location}
                  </span>
                  <span>{t.indicativeCost}</span>
                </div>
                <p className="mt-2 text-[13px] text-ink-muted">{t.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone="resource">{t.serviceType}</Badge>
                  <Badge>{t.suitableCrops.join(", ")}</Badge>
                  <Badge tone="success">{t.availability}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {adding && <AddServiceDialog onClose={() => setAdding(false)} />}
    </>
  );
}

function AddServiceDialog({ onClose }: { onClose: () => void }) {
  const { session, addTechnology } = useAppStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Technology["category"]>("application");
  const [summary, setSummary] = useState("");
  const [steps, setSteps] = useState("");
  const [cost, setCost] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Per-visit service");
  const [location, setLocation] = useState(villageNames[0]);
  const [availability, setAvailability] = useState("Book 2 days ahead");
  const [crops, setCrops] = useState<string[]>(["All crops"]);
  const [errors, setErrors] = useState<{ name?: string; summary?: string; cost?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name the service farmers will see, e.g. “Drone spraying”.";
    if (summary.trim().length < 10) next.summary = "Say in a sentence what the farmer gets.";
    if (!cost.trim()) next.cost = "Enter an indicative price, e.g. “₹600 per acre”.";
    setErrors(next);
    if (Object.keys(next).length) return;
    addTechnology({
      name: name.trim(),
      category,
      summary: summary.trim(),
      howItWorks: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      access: "Request it through AgriCluster; the provider confirms the date and price.",
      indicativeCost: cost.trim(),
      providerUserId: session!.userId,
      location,
      availability: availability.trim() || "On request",
      serviceType,
      suitableCrops: crops.length ? crops : ["All crops"],
    });
    toast(`${name.trim()} listed. Farmers can now request it.`);
    onClose();
  };

  return (
    <Dialog
      title="Add service"
      description="Listed services are visible to every farmer in the cluster."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-service">
            Add service
          </Button>
        </>
      }
    >
      <form id="add-service" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField label="Service name" error={errors.name}>
          {(p) => <TextInput {...p} placeholder="Drone spraying" value={name} onChange={(e) => (setName(e.target.value), setErrors((x) => ({ ...x, name: undefined })))} />}
        </FormField>
        <FormField label="Kind">
          {(p) => (
            <SelectInput {...p} value={category} onChange={(e) => setCategory(e.target.value as Technology["category"])}>
              {(Object.keys(techTypeLabels) as Technology["category"][]).map((c) => (
                <option key={c} value={c}>
                  {techTypeLabels[c]}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="What the farmer gets" error={errors.summary} className="sm:col-span-2">
          {(p) => (
            <TextArea
              {...p}
              rows={2}
              maxLength={300}
              placeholder="A licensed operator sprays your field by drone. Uses less water and chemical than a knapsack."
              value={summary}
              onChange={(e) => (setSummary(e.target.value), setErrors((x) => ({ ...x, summary: undefined })))}
            />
          )}
        </FormField>
        <FormField label="Price" error={errors.cost} hint="Indicative — you confirm the final price">
          {(p) => <TextInput {...p} placeholder="₹600 per acre" value={cost} onChange={(e) => (setCost(e.target.value), setErrors((x) => ({ ...x, cost: undefined })))} />}
        </FormField>
        <FormField label="Service type">
          {(p) => (
            <SelectInput {...p} value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
              {(["Per-visit service", "Subscription", "Supply & install", "Rental with operator"] as ServiceType[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Based in">
          {(p) => (
            <SelectInput {...p} value={location} onChange={(e) => setLocation(e.target.value)}>
              {villageNames.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Availability">
          {(p) => <TextInput {...p} value={availability} onChange={(e) => setAvailability(e.target.value)} />}
        </FormField>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-[13px] font-medium">Suitable crops</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
            {cropChoices.map((c) => (
              <label key={c} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-700"
                  checked={crops.includes(c)}
                  onChange={(e) =>
                    setCrops((list) =>
                      c === "All crops" ? (e.target.checked ? ["All crops"] : []) : e.target.checked ? [...list.filter((x) => x !== "All crops"), c] : list.filter((x) => x !== c),
                    )
                  }
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <FormField label="How it works" hint="Optional — one step per line" className="sm:col-span-2">
          {(p) => <TextArea {...p} rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} />}
        </FormField>
      </form>
    </Dialog>
  );
}
