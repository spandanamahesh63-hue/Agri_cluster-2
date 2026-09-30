import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { TriangleAlert, Users } from "lucide-react";
import type { LabourProfile, LabourSkill, ResourceKind } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useLabourProfiles, useMachinery, useMyRequests } from "../../features/shared/useMerged";
import { useAsync } from "../../hooks/useAsync";
import { getResourceCatalog, type ResourceCatalog } from "../../services/api/demoApi";
import { RequestLabourDialog, RequestMachineryDialog, RequestTechnologyDialog } from "../../features/resources/RequestDialogs";
import { bookingStatusLabel, kindLabels } from "../../features/resources/labels";
import { machineOffering, techOffering, type Offering } from "../../features/resources/offerings";
import { CompareDialog, ContactDialog, OfferingCard, OfferingDetailDialog, type RequestState } from "../../features/resources/OfferingCard";
import { usePlan } from "../../features/plan/usePlan";
import { skillLabels } from "../../data/mock/labour";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";
import { FilterChips } from "../../components/navigation/FilterChips";
import { SelectInput } from "../../components/forms/fields";
import { formatDate, formatHour, formatINR } from "../../utils/format";

type Tab = "machinery" | "labour" | "technology" | "requests";

export function ResourcesPage() {
  const loaded = useAsync(getResourceCatalog, []);
  const machinery = useMachinery();
  const labour = useLabourProfiles();
  // Merge owner/crew edits made in the app over the catalog.
  const catalog = loaded.status === "success" ? { ...loaded, data: { ...loaded.data, machinery, labour } } : loaded;
  const { bookings, labourRequests, serviceRequests } = useMyRequests();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "machinery";
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });

  const header = <PageHeader decorated title="Resources" description="What equipment, labour and technology can I use through the cluster?" />;
  if (catalog.status === "loading") return <PageSkeleton />;
  if (catalog.status === "error")
    return (
      <>
        {header}
        <ErrorState message={catalog.error.message} onRetry={catalog.retry} />
      </>
    );

  const requestCount = bookings.length + labourRequests.length + serviceRequests.length;

  return (
    <>
      {header}
      <Tabs<Tab>
        label="Resource types"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "machinery", label: "Machinery" },
          { id: "labour", label: "Labour" },
          { id: "technology", label: "Technology" },
          { id: "requests", label: "My requests", count: requestCount },
        ]}
      />
      {tab === "machinery" && <MachineryTab catalog={catalog.data} initialKind={params.get("kind") as ResourceKind | null} />}
      {tab === "labour" && <LabourTab crews={catalog.data.labour} />}
      {tab === "technology" && (
        <OfferingsTab
          offerings={catalog.data.technologies.map(techOffering)}
          intro={<p className="text-[13px] text-ink-muted">You don't need to own every technology. The cluster shares it, and each option is sized for small farms.</p>}
        />
      )}
      {tab === "requests" && <RequestsTab catalog={catalog.data} onBrowse={() => setTab("machinery")} />}
    </>
  );
}

// ---------------------------------------------------------------------------

const MAX_COMPARE = 3;

/** Machinery or technology listings with filter, compare, save, view, contact and request (spec §11). */
function OfferingsTab({ offerings, initialType, intro }: { offerings: Offering[]; initialType?: string | null; intro?: ReactNode }) {
  const { bookings, serviceRequests } = useMyRequests();
  const { savedResources } = useAppStore();
  const plan = usePlan();
  const crop = plan.crop?.name;
  const types = [...new Set(offerings.map((o) => o.typeLabel))];
  const [type, setType] = useState<string>(initialType && types.includes(initialType) ? initialType : "all");
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [viewing, setViewing] = useState<Offering | null>(null);
  const [contacting, setContacting] = useState<Offering | null>(null);
  const [requesting, setRequesting] = useState<Offering | null>(null);

  const visible = offerings.filter((o) => (type === "all" ? true : type === "saved" ? savedResources.includes(o.key) : o.typeLabel === type));
  const compared = offerings.filter((o) => compare.includes(o.key));
  const savedCount = offerings.filter((o) => savedResources.includes(o.key)).length;

  const requestOf = (o: Offering): RequestState | undefined => {
    if (o.machine) {
      const mine = bookings.find((b) => b.machineryId === o.key);
      if (!mine) return undefined;
      return { label: mine.status === "requested" ? `Requested for ${formatDate(mine.date)}` : `${bookingStatusLabel[mine.status].label} · ${formatDate(mine.date)}`, tone: bookingStatusLabel[mine.status].tone };
    }
    return serviceRequests.some((r) => r.technologyId === o.key) ? { label: "Requested", tone: "info" } : undefined;
  };

  return (
    <div className="space-y-4 pb-16">
      {intro}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Type"
          value={type}
          onChange={setType}
          options={[{ id: "all", label: "All" }, ...types.map((t) => ({ id: t, label: t })), { id: "saved", label: `Saved (${savedCount})` }]}
        />
        <SourceBadge source="demo" />
      </div>
      {visible.length === 0 ? (
        <Card>
          <EmptyState title={type === "saved" ? "Nothing saved yet" : "Nothing listed of this type"} description={type === "saved" ? "Use the bookmark on a listing to keep it here." : "Ask the cluster office to find a provider."} />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((o) => (
            <OfferingCard
              key={o.key}
              o={o}
              crop={crop}
              request={requestOf(o)}
              comparing={compare.includes(o.key)}
              compareDisabled={compare.length >= MAX_COMPARE}
              onCompare={(on) => setCompare((c) => (on ? [...c, o.key] : c.filter((k) => k !== o.key)))}
              onView={() => setViewing(o)}
              onContact={() => setContacting(o)}
              onRequest={() => setRequesting(o)}
            />
          ))}
        </div>
      )}

      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex justify-center px-4 lg:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pl-64">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] shadow-pop">
            <span>
              {compare.length} selected{compare.length < 2 ? " · pick one more" : ""}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setCompare([])}>
              Clear
            </Button>
            <Button size="sm" disabled={compare.length < 2} onClick={() => setShowCompare(true)}>
              Compare
            </Button>
          </div>
        </div>
      )}

      {showCompare && (
        <CompareDialog
          offerings={compared}
          onClose={() => setShowCompare(false)}
          onClear={() => {
            setCompare([]);
            setShowCompare(false);
          }}
        />
      )}
      {viewing && (
        <OfferingDetailDialog
          o={viewing}
          requested={!!requestOf(viewing)}
          onClose={() => setViewing(null)}
          onRequest={() => {
            setRequesting(viewing);
            setViewing(null);
          }}
        />
      )}
      {contacting && <ContactDialog o={contacting} onClose={() => setContacting(null)} />}
      {requesting?.machine && <RequestMachineryDialog machine={requesting.machine} onClose={() => setRequesting(null)} />}
      {requesting?.tech && <RequestTechnologyDialog tech={requesting.tech} onClose={() => setRequesting(null)} />}
    </div>
  );
}

function MachineryTab({ catalog, initialKind }: { catalog: ResourceCatalog; initialKind: ResourceKind | null }) {
  const gaps = catalog.demand.filter((d) => d.requested > d.available);
  return (
    <OfferingsTab
      offerings={catalog.machinery.map(machineOffering)}
      initialType={initialKind ? kindLabels[initialKind] : null}
      intro={gaps.map((g) => (
        <div key={`${g.kind}-${g.date}`} className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning-soft px-4 py-3 text-[13px]">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            <span className="font-medium">
              {kindLabels[g.kind]} demand on {formatDate(g.date)}: {g.requested} requests for {g.available} available.
            </span>{" "}
            <span className="text-ink-muted">The cluster office is looking for additional providers — request early if you need one.</span>
          </p>
        </div>
      ))}
    />
  );
}

function LabourTab({ crews }: { crews: LabourProfile[] }) {
  const { labourRequests } = useMyRequests();
  const plan = usePlan();
  const [skill, setSkill] = useState<LabourSkill | "all">("all");
  const [crop, setCrop] = useState("");
  const [village, setVillage] = useState("");
  const [requesting, setRequesting] = useState<LabourProfile | null>(null);
  const crops = [...new Set(crews.flatMap((c) => c.cropExperience))].sort();
  const villages = [...new Set(crews.map((c) => c.village))].sort();
  const visible = crews.filter(
    (c) => (skill === "all" || c.skills.includes(skill)) && (!crop || c.cropExperience.includes(crop)) && (!village || c.village === village),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Task"
          value={skill}
          onChange={setSkill}
          options={[{ id: "all" as const, label: "All tasks" }, ...(Object.keys(skillLabels) as LabourSkill[]).map((s) => ({ id: s, label: skillLabels[s] }))]}
        />
        <SourceBadge source="demo" />
      </div>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <div>
          <label htmlFor="labour-crop" className="mb-1 block text-[12px] font-medium text-ink-muted">
            Crop experience
          </label>
          <SelectInput id="labour-crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">Any crop</option>
            {crops.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <label htmlFor="labour-village" className="mb-1 block text-[12px] font-medium text-ink-muted">
            Location
          </label>
          <SelectInput id="labour-village" value={village} onChange={(e) => setVillage(e.target.value)}>
            <option value="">Any village</option>
            {villages.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </SelectInput>
        </div>
      </div>
      {visible.length === 0 ? (
        <Card>
          <EmptyState title="No crews match" description="Try another task, crop or village, or ask the cluster office to find a crew." />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((c) => {
            const mine = labourRequests.find((r) => r.labourProfileId === c.id);
            return (
              <Card key={c.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-[13px] text-ink-muted">Lead: {c.leadName}</div>
                  </div>
                  <Badge tone={c.availability === "available" ? "success" : c.availability === "limited" ? "warning" : "neutral"}>
                    {c.availability === "available" ? "Available" : c.availability === "limited" ? "Limited" : "Booked"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.skills.map((s) => (
                    <Badge key={s}>{skillLabels[s]}</Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 text-[13px] text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Users aria-hidden className="size-3.5" />
                    {c.crewSize} workers
                  </span>
                  <span>
                    {formatINR(c.dailyWage)}/day each{c.hourlyRate ? ` or ${formatINR(c.hourlyRate)}/hour` : ""}
                  </span>
                  <span>From {formatDate(c.availableFrom)}</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                  <div>
                    <dt className="inline text-ink-subtle">Experience: </dt>
                    <dd className="inline">{c.experienceYears} years</dd>
                  </div>
                  <div>
                    <dt className="inline text-ink-subtle">Transport: </dt>
                    <dd className="inline">{c.transport ? "Own transport" : "Needs pickup"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="inline text-ink-subtle">Crops: </dt>
                    <dd className="inline">
                      {c.cropExperience.join(", ")}
                      {plan.crop && c.cropExperience.includes(plan.crop.name) && <span className="font-medium text-crop"> · knows your {plan.crop.name.toLowerCase()}</span>}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end">
                  {mine ? (
                    <Badge tone="info">Requested for {formatDate(mine.date)}</Badge>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setRequesting(c)} disabled={c.availability === "booked"}>
                      Request crew
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {requesting && <RequestLabourDialog crew={requesting} onClose={() => setRequesting(null)} />}
    </div>
  );
}

function RequestsTab({ catalog, onBrowse }: { catalog: ResourceCatalog; onBrowse: () => void }) {
  const { bookings, labourRequests, serviceRequests } = useMyRequests();
  const rows = [
    ...bookings.map((b) => {
      const m = catalog.machinery.find((x) => x.id === b.machineryId);
      return {
        id: b.id,
        title: m?.name ?? "Equipment",
        detail: `${formatDate(b.date)}, ${formatHour(b.startHour)} · ${b.hours} h · ${b.purpose} · est. ${formatINR(b.estimatedCost)}`,
        status: bookingStatusLabel[b.status],
      };
    }),
    ...labourRequests.map((r) => {
      const crew = catalog.labour.find((c) => c.id === r.labourProfileId);
      return {
        id: r.id,
        title: crew?.label ?? "Labour crew",
        detail: `${skillLabels[r.skill]} · ${r.workers} workers × ${r.days} days from ${formatDate(r.date)}`,
        status: bookingStatusLabel[r.status],
      };
    }),
    ...serviceRequests.map((r) => ({
      id: r.id,
      title: catalog.technologies.find((t) => t.id === r.technologyId)?.name ?? "Technology service",
      detail: r.note || "No note added",
      status: { label: r.status === "requested" ? "With cluster office" : r.status, tone: "info" as const },
    })),
  ];

  if (rows.length === 0)
    return (
      <Card>
        <EmptyState
          title="No requests yet"
          description="Requests you send for machinery, labour or technology appear here with their status."
          action={
            <Button size="sm" variant="secondary" onClick={onBrowse}>
              Browse machinery
            </Button>
          }
        />
      </Card>
    );

  return (
    <Card>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-[13px] text-ink-muted">{r.detail}</div>
            </div>
            <Badge tone={r.status.tone} className="self-start sm:self-auto">
              {r.status.label}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
