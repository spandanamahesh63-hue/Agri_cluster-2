import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { ChevronDown, MapPin, TriangleAlert, Users } from "lucide-react";
import type { LabourProfile, LabourSkill, Machinery, ResourceKind, Technology } from "../../types";
import { useLabourProfiles, useMachinery, useMyRequests } from "../../features/shared/useMerged";
import { useAsync } from "../../hooks/useAsync";
import { getResourceCatalog, type ResourceCatalog } from "../../services/api/demoApi";
import { RequestLabourDialog, RequestMachineryDialog, RequestTechnologyDialog } from "../../features/resources/RequestDialogs";
import { bookingStatusLabel, kindLabels, ownerLabel } from "../../features/resources/labels";
import { skillLabels } from "../../data/mock/labour";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";
import { FilterChips } from "../../components/navigation/FilterChips";
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

  const header = <PageHeader title="Resources" description="What equipment, labour and technology can I use through the cluster?" />;
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
      {tab === "technology" && <TechnologyTab technologies={catalog.data.technologies} />}
      {tab === "requests" && <RequestsTab catalog={catalog.data} onBrowse={() => setTab("machinery")} />}
    </>
  );
}

// ---------------------------------------------------------------------------

function MachineryTab({ catalog, initialKind }: { catalog: ResourceCatalog; initialKind: ResourceKind | null }) {
  const { bookings } = useMyRequests();
  const kinds = [...new Set(catalog.machinery.map((m) => m.kind))];
  const [kind, setKind] = useState<ResourceKind | "all">(initialKind && kinds.includes(initialKind) ? initialKind : "all");
  const [requesting, setRequesting] = useState<Machinery | null>(null);
  const visible = catalog.machinery.filter((m) => kind === "all" || m.kind === kind);
  const gaps = catalog.demand.filter((d) => d.requested > d.available);

  return (
    <div className="space-y-4">
      {gaps.map((g) => (
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Equipment type"
          value={kind}
          onChange={setKind}
          options={[{ id: "all" as const, label: "All" }, ...kinds.map((k) => ({ id: k, label: kindLabels[k] }))]}
        />
        <SourceBadge source="demo" />
      </div>

      <Card>
        <ul className="divide-y divide-line">
          {visible.map((m) => {
            const mine = bookings.find((b) => b.machineryId === m.id);
            return (
              <li key={m.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-muted">
                    <span>{ownerLabel(m)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden className="size-3" />
                      {m.village}
                    </span>
                    <span>{formatINR(m.ratePerHour)}/h (indicative)</span>
                  </div>
                  {m.availableSlots && m.availableSlots.length > 0 && (
                    <div className="mt-0.5 text-[12px] text-success">
                      Owner availability:{" "}
                      {m.availableSlots.map((s) => `${formatDate(s.date)} ${formatHour(s.startHour)}–${formatHour(s.endHour)}`).join(" · ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={m.status === "available" ? "success" : "neutral"}>
                    {m.status === "available" ? "Free today" : m.status === "booked" ? "Booked today" : "Maintenance"}
                  </Badge>
                  {mine ? (
                    <Badge tone={bookingStatusLabel[mine.status].tone}>
                      {mine.status === "requested" ? `Requested for ${formatDate(mine.date)}` : `${bookingStatusLabel[mine.status].label} · ${formatDate(mine.date)}`}
                    </Badge>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setRequesting(m)} disabled={m.status === "maintenance"}>
                      Request
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      {requesting && <RequestMachineryDialog machine={requesting} onClose={() => setRequesting(null)} />}
    </div>
  );
}

function LabourTab({ crews }: { crews: LabourProfile[] }) {
  const { labourRequests } = useMyRequests();
  const [skill, setSkill] = useState<LabourSkill | "all">("all");
  const [requesting, setRequesting] = useState<LabourProfile | null>(null);
  const visible = crews.filter((c) => skill === "all" || c.skills.includes(skill));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Skill"
          value={skill}
          onChange={setSkill}
          options={[{ id: "all" as const, label: "All skills" }, ...(Object.keys(skillLabels) as LabourSkill[]).map((s) => ({ id: s, label: skillLabels[s] }))]}
        />
        <SourceBadge source="demo" />
      </div>
      {visible.length === 0 ? (
        <Card>
          <EmptyState title="No crews with this skill" description="Try another skill, or ask the cluster office to find one." />
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
                  <span>{formatINR(c.dailyWage)}/day each</span>
                  <span>From {formatDate(c.availableFrom)}</span>
                </div>
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

function TechnologyTab({ technologies }: { technologies: Technology[] }) {
  const { serviceRequests } = useMyRequests();
  const [requesting, setRequesting] = useState<Technology | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        Farmers don't need to own every technology — the cluster shares it. Each option below is sized for small farms.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {technologies.map((t) => {
          const requested = serviceRequests.some((r) => r.technologyId === t.id);
          const expanded = open === t.id;
          return (
            <Card key={t.id} className="flex flex-col p-4">
              <div className="text-sm font-medium">{t.name}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{t.summary}</p>
              <dl className="mt-3 space-y-1 text-[12px]">
                <div>
                  <dt className="inline text-ink-subtle">Access: </dt>
                  <dd className="inline text-ink">{t.access}</dd>
                </div>
                <div>
                  <dt className="inline text-ink-subtle">Indicative cost: </dt>
                  <dd className="inline text-ink">{t.indicativeCost}</dd>
                </div>
              </dl>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : t.id)}
                className="mt-3 inline-flex items-center gap-1 self-start text-[13px] font-medium text-brand-700"
              >
                How it works
                <ChevronDown aria-hidden className={clsx("size-4 transition-transform", expanded && "rotate-180")} />
              </button>
              {expanded && (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-ink-muted">
                  {t.howItWorks.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              )}
              <div className="mt-auto flex justify-end pt-4">
                {requested ? (
                  <Badge tone="info">Requested</Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setRequesting(t)}>
                    Request
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {requesting && <RequestTechnologyDialog tech={requesting} onClose={() => setRequesting(null)} />}
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
