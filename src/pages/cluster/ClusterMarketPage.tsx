import { MapPin, Truck, Warehouse } from "lucide-react";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { PICKUP_TONNES } from "../../features/cluster/coordination";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { formatDate, formatDateRange } from "../../utils/format";

const COLD_ROOM_TONNES = 10;

export function ClusterMarketPage() {
  return (
    <ClusterPage title="Market" description="What will the cluster harvest, when, and where can it go?">
      {(v) => <Market v={v} />}
    </ClusterPage>
  );
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start <= b.end && b.start <= a.end;

function Market({ v }: { v: ClusterView }) {
  const open = v.buyerRequirements.filter((r) => r.status === "open");

  const rows = open.map((req) => {
    const supplyFarms = v.farms.filter((f) => f.active && f.crop === req.crop && f.grade === req.grade && overlaps(f.harvestWindow, req.window));
    const expected = Math.round(supplyFarms.reduce((s, f) => s + f.expectedTonnes, 0) * 10) / 10;
    const listed = Math.round(v.listings.filter((l) => l.crop === req.crop && l.grade === req.grade).reduce((s, l) => s + l.quantityTonnes, 0) * 10) / 10;
    const offers = v.listings.filter((l) => l.requirementId === req.id);
    return { req, expected, listed, offers, farms: supplyFarms.length };
  });

  const tomato = v.supplyView.find((s) => s.crop === "Tomato");
  const windowDays = tomato ? Math.round((new Date(tomato.window.end).getTime() - new Date(tomato.window.start).getTime()) / 864e5) + 1 : 1;
  const pickups = tomato ? Math.ceil(tomato.expectedTonnes / PICKUP_TONNES) : 0;
  const transport = v.demand.find((d) => d.kind === "transport");
  const surplus = tomato ? Math.max(0, tomato.expectedTonnes - tomato.demandTonnes) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Buyer requirements vs cluster supply" subtitle="Open requirements and what member farms expect in the same window" action={<SourceBadge source="demo" />} />
        {rows.length === 0 ? (
          <EmptyState title="No open buyer requirements" />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map(({ req, expected, listed, offers, farms }) => {
              const max = Math.max(expected, req.quantityTonnes, 1);
              return (
                <li key={req.id} className="grid gap-4 px-5 py-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium">
                      {req.quantityTonnes} t {req.crop.toLowerCase()} · Grade {req.grade}
                    </div>
                    <div className="text-[13px] text-ink-muted">
                      {req.buyerLabel} · {formatDateRange(req.window.start, req.window.end)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden className="size-3" />
                        {req.deliveryLocation}
                      </span>
                      <span>
                        Indicative ₹{req.indicativePricePerKg[0]}–{req.indicativePricePerKg[1]}/kg
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="market">{offers.length} farmer offer{offers.length === 1 ? "" : "s"}</Badge>
                      <Badge>{listed} t listed</Badge>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-[13px]">
                    {[
                      { label: `Expected supply · ${farms} farms`, value: expected, color: "bg-brand-500" },
                      { label: "Buyer demand", value: req.quantityTonnes, color: "bg-market" },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="mb-1 flex justify-between">
                          <span className="text-ink-muted">{bar.label}</span>
                          <span className="font-medium tabular-nums">{bar.value} t</span>
                        </div>
                        <div className="h-2 rounded-full bg-sunken">
                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.value / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-[12px] text-ink-muted">
                      {expected >= req.quantityTonnes
                        ? `Supply can cover this request; ${Math.round((expected - req.quantityTonnes) * 10) / 10} t would need another buyer.`
                        : `Supply falls ${Math.round((req.quantityTonnes - expected) * 10) / 10} t short in this window.`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <InfoNote className="border-t border-line px-5 py-3">No sale is confirmed until a buyer and a farmer agree. Supply figures are indicative.</InfoNote>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Farmer listings" subtitle="Crops members have made available" />
          {v.listings.length === 0 ? (
            <EmptyState title="No listings yet" description="When farmers upload expected harvests, they appear here and count toward pooled supply." />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {v.listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">{l.farmLabel}</span>{" "}
                    <span className="text-ink-muted">
                      · {l.quantityTonnes} t {l.crop.toLowerCase()} Grade {l.grade} · from {formatDate(l.availableFrom)} · ₹{l.expectedPricePerKg}/kg
                    </span>
                  </span>
                  <Badge tone={l.requirementId ? "market" : "info"}>{l.requirementId ? "Offered to buyer" : "Listed"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {tomato && (
          <Card>
            <CardHeader title="Logistics for the tomato window" subtitle={formatDateRange(tomato.window.start, tomato.window.end)} action={<SourceBadge source="indicative" />} />
            <ul className="space-y-4 px-5 pb-5 pt-3 text-[13px]">
              <li className="flex gap-3">
                <Truck aria-hidden className="mt-0.5 size-5 shrink-0 text-resource" />
                <div>
                  <div className="font-medium">
                    ~{pickups} pickups over {windowDays} days (~{Math.ceil(pickups / windowDays)}/day)
                  </div>
                  <div className="text-ink-muted">
                    {tomato.expectedTonnes} t at {PICKUP_TONNES} t per pickup.
                    {transport && ` ${transport.requested} transport requests for ${transport.available} vehicles on ${formatDate(transport.date)} — pooled dispatch from the collection centre reduces trips.`}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <Warehouse aria-hidden className="mt-0.5 size-5 shrink-0 text-resource" />
                <div>
                  <div className="font-medium">
                    {surplus > 0 ? `${surplus} t above current demand` : "Demand covers expected supply"}
                  </div>
                  <div className="text-ink-muted">
                    {surplus > 0
                      ? `The ${COLD_ROOM_TONNES} t cold room can hold this for a few days while the cluster approaches additional buyers.`
                      : "No cold storage needed beyond normal handling."}
                  </div>
                </div>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
