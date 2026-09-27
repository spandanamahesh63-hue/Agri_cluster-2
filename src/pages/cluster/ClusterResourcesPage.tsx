import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, MapPin } from "lucide-react";
import type { ResourceDemand } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { HARVEST_WORKER_DAYS_PER_ACRE } from "../../features/cluster/coordination";
import { bookingStatusLabel, kindLabels } from "../../features/resources/labels";
import { skillLabels } from "../../data/mock/labour";
import { TOMATO_WINDOW } from "../../data/mock/clusterFarms";
import { farmLabelForUser } from "../../data/mock/farms";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { EmptyState } from "../../components/ui/states";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatDateRange, formatHour, formatINR } from "../../utils/format";

export function ClusterResourcesPage() {
  return (
    <ClusterPage title="Resources" description="Where does demand for machinery and labour exceed what the cluster has?">
      {(v) => <Resources v={v} />}
    </ClusterPage>
  );
}

function Resources({ v }: { v: ClusterView }) {
  const { bookings, labourRequests } = useAppStore();
  const [finding, setFinding] = useState<ResourceDemand | null>(null);
  const [contacted, setContacted] = useState<string[]>([]);

  const chart = v.demand.map((d) => ({ label: `${kindLabels[d.kind]} · ${formatDate(d.date)}`, requested: d.requested, available: d.available }));

  // Labour: harvest need in the tomato window vs listed crew capacity over the same days.
  const windowDays = 4;
  const tomatoFarms = v.farms.filter((f) => f.active && f.crop === "Tomato" && f.harvestWindow.start === TOMATO_WINDOW.start);
  const labourNeed = Math.round(tomatoFarms.reduce((s, f) => s + f.acres * HARVEST_WORKER_DAYS_PER_ACRE.Tomato, 0));
  const harvestCrews = v.labour.filter((c) => c.skills.includes("harvesting") && c.availability !== "booked");
  const labourCapacity = harvestCrews.reduce((s, c) => s + c.crewSize * windowDays, 0);

  const tractors = v.machinery.filter((m) => m.kind === "tractor");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Demand vs availability"
            subtitle="Requests including those made by members in the app"
            source="demo"
            legend={[
              { label: "Requested", color: series[0] },
              { label: "Available", color: series[1] },
            ]}
            table={{ columns: ["Resource", "Requested", "Available"], rows: chart.map((c) => [c.label, c.requested, c.available]) }}
          >
            <ResponsiveContainer>
              <BarChart data={chart} barGap={2} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} />
                <YAxis allowDecimals={false} tick={tickStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip />} />
                <Bar dataKey="requested" name="Requested" fill={series[0]} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                <Bar dataKey="available" name="Available" fill={series[1]} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {v.demand.map((d) => {
            const gap = d.requested - d.available;
            const key = `${d.kind}-${d.date}`;
            return (
              <Card key={key} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {kindLabels[d.kind]} · {formatDate(d.date, { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div className="text-[13px] text-ink-muted">
                      {d.requested} requested · {d.available} available
                    </div>
                  </div>
                  {gap > 0 ? <Badge tone="danger">Gap {gap}</Badge> : <Badge tone="success">Covered</Badge>}
                </div>
                {gap > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {contacted.includes(key) ? (
                      <Badge tone="info" icon={<Check aria-hidden className="size-3" />}>
                        External providers contacted
                      </Badge>
                    ) : (
                      <span className="text-[12px] text-ink-muted">Stagger slots or bring in outside providers.</span>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => setFinding(d)}>
                      Find providers
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tractors today" subtitle={`${tractors.filter((t) => t.status === "booked").length} of ${tractors.length} booked`} action={<SourceBadge source="demo" />} />
          <ul className="mt-2 grid grid-cols-3 gap-2 px-5 pb-5 sm:grid-cols-5">
            {tractors.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-line p-2 text-center text-[12px]"
                aria-label={`${t.name}, ${t.village}, ${t.status}`}
              >
                <div className="font-medium">{t.name.split(" · ")[0]}</div>
                <div className="text-ink-muted">{t.village}</div>
                <div className={t.status === "booked" ? "font-medium text-ink" : "text-success"}>{t.status === "booked" ? "Booked" : "Free"}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Harvest labour · tomato" subtitle={`${formatDateRange(TOMATO_WINDOW.start, TOMATO_WINDOW.end)} · ${tomatoFarms.length} farms`} action={<SourceBadge source="indicative" />} />
          <div className="space-y-3 px-5 pb-5 pt-3 text-[13px]">
            {[
              { label: "Worker-days needed", value: labourNeed, color: "bg-brand-500" },
              { label: "Listed crew capacity", value: labourCapacity, color: "bg-resource" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between">
                  <span className="text-ink-muted">{row.label}</span>
                  <span className="font-medium tabular-nums">{row.value}</span>
                </div>
                <div className="h-2 rounded-full bg-sunken">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / Math.max(labourNeed, labourCapacity)) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[12px] text-ink-muted">
              Listed crews cover about {Math.round((labourCapacity / labourNeed) * 100)}% of the need; most farms rely on family and
              local labour. Staggering picks across the 4 days keeps crews fully used.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Latest member requests" subtitle="Made by farmers in the app" />
        {bookings.length + labourRequests.length === 0 ? (
          <EmptyState title="No requests yet" description="Machinery and labour requests from farmers appear here." />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {bookings.map((b) => {
              const m = v.machinery.find((x) => x.id === b.machineryId);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">{farmLabelForUser(b.requesterUserId)}</span>{" "}
                    <span className="text-ink-muted">
                      · {m?.name} · {formatDate(b.date)}, {formatHour(b.startHour)} · {b.hours} h · {b.purpose}
                    </span>
                  </span>
                  <Badge tone={bookingStatusLabel[b.status].tone}>{bookingStatusLabel[b.status].label}</Badge>
                </li>
              );
            })}
            {labourRequests.map((r) => {
              const crew = v.labour.find((c) => c.id === r.labourProfileId);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">{farmLabelForUser(r.requesterUserId)}</span>{" "}
                    <span className="text-ink-muted">
                      · {crew?.label} · {skillLabels[r.skill]} · {r.workers} × {r.days} days from {formatDate(r.date)}
                    </span>
                  </span>
                  <Badge tone={bookingStatusLabel[r.status].tone}>
                    {r.status === "requested" ? "Awaiting crew" : bookingStatusLabel[r.status].label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {finding && (
        <ProvidersDialog
          demand={finding}
          v={v}
          onClose={() => setFinding(null)}
          onContacted={() => setContacted((c) => [...c, `${finding.kind}-${finding.date}`])}
        />
      )}
    </div>
  );
}

function ProvidersDialog({ demand, v, onClose, onContacted }: { demand: ResourceDemand; v: ClusterView; onClose: () => void; onContacted: () => void }) {
  const toast = useToast();
  const gap = demand.requested - demand.available;
  const providers = v.externalProviders.filter((p) => p.kind === demand.kind);
  const [chosen, setChosen] = useState<string[]>(providers.slice(0, 1).map((p) => p.id));
  const units = providers.filter((p) => chosen.includes(p.id)).reduce((s, p) => s + p.units, 0);

  return (
    <Dialog
      title={`${kindLabels[demand.kind]} providers outside the cluster`}
      description={`Gap of ${gap} on ${formatDate(demand.date)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={chosen.length === 0}
            onClick={() => {
              toast(`Availability request sent to ${chosen.length} provider${chosen.length > 1 ? "s" : ""} (simulated).`);
              onContacted();
              onClose();
            }}
          >
            Ask for availability
          </Button>
        </>
      }
    >
      {providers.length === 0 ? (
        <EmptyState title="No external providers listed for this resource" />
      ) : (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-[13px] text-ink-muted">Select providers to contact</legend>
          {providers.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="checkbox"
                className="mt-1 accent-brand-700"
                checked={chosen.includes(p.id)}
                onChange={(e) => setChosen((c) => (e.target.checked ? [...c, p.id] : c.filter((x) => x !== p.id)))}
              />
              <span className="text-[13px]">
                <span className="block font-medium">{p.name}</span>
                <span className="flex flex-wrap items-center gap-x-3 text-ink-muted">
                  <span>{p.units} units</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden className="size-3" />
                    {p.location} · {p.distanceKm} km
                  </span>
                  <span>{formatINR(p.ratePerHour)}/h</span>
                </span>
              </span>
            </label>
          ))}
          <p className={`pt-1 text-[13px] ${units >= gap ? "text-success" : "text-ink-muted"}`}>
            Selected providers could cover {Math.min(units, gap)} of the {gap} missing.
          </p>
          <InfoNote>Indicative rates. Longer travel adds cost; the cluster office confirms with farmers before booking.</InfoNote>
        </fieldset>
      )}
    </Dialog>
  );
}
