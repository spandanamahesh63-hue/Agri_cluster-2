import { Link } from "react-router-dom";
import { MapPin, Package, Upload } from "lucide-react";
import type { CropListing } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { matchingHarvest, useMarket } from "../../features/market/useMarket";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatDateRange, formatINR, formatKg } from "../../utils/format";

const listingStatus: Record<CropListing["status"], { label: string; tone: "neutral" | "info" | "market" | "success" }> = {
  listed: { label: "Listed · visible to buyers", tone: "info" },
  "offer-sent": { label: "Offer sent · awaiting buyer", tone: "market" },
  "interest-received": { label: "Buyer request", tone: "market" },
  agreed: { label: "Agreed", tone: "success" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export function MarketPage() {
  const overview = useFarmerOverview();
  const market = useMarket();
  const { listings, interests, acceptInterest, update } = useAppStore();
  const toast = useToast();

  const header = (
    <PageHeader
      title="Market"
      description="Where can I sell my crop, and when?"
      actions={
        <ButtonLink to="/farmer/market/upload" icon={<Upload aria-hidden className="size-4" />}>
          Upload crop
        </ButtonLink>
      }
    />
  );

  if (overview.status === "loading" || market.status === "loading") return <PageSkeleton />;
  if (overview.status === "error" || market.status === "error") {
    const retry = () => {
      overview.retry();
      market.retry();
    };
    return (
      <>
        {header}
        <ErrorState onRetry={retry} />
      </>
    );
  }

  const { cycles, fields, farm } = overview.data;
  const { requirements, channels, supply } = market.data;
  const myCrops = new Set(cycles.map((c) => c.crop));
  const relevant = requirements.filter((r) => r.status === "open" && myCrops.has(r.crop));
  const myListings = listings.filter((l) => l.farmId === farm.id);

  return (
    <>
      {header}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Buyer requests for your crops" subtitle="Open requirements posted to the cluster" action={<SourceBadge source="demo" />} />
            {relevant.length === 0 ? (
              <EmptyState title="No buyer requests yet" description="When buyers post requirements for crops you grow, they appear here." />
            ) : (
              <ul className="divide-y divide-line">
                {relevant.map((req) => {
                  const harvest = matchingHarvest(req, cycles, fields);
                  const offer = myListings.find((l) => l.requirementId === req.id);
                  return (
                    <li key={req.id} className="px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">
                            {req.quantityTonnes} t {req.crop.toLowerCase()} · Grade {req.grade}
                          </div>
                          <div className="text-[13px] text-ink-muted">
                            {req.buyerLabel} · needed {formatDateRange(req.window.start, req.window.end)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
                            <span className="inline-flex items-center gap-1">
                              <MapPin aria-hidden className="size-3" />
                              {req.deliveryLocation}
                            </span>
                            <span>
                              Indicative ₹{req.indicativePricePerKg[0]}–{req.indicativePricePerKg[1]}/kg
                            </span>
                          </div>
                          {harvest ? (
                            <p className="mt-2 text-[13px]">
                              <Badge tone="market">Matches your harvest</Badge>{" "}
                              <span className="text-ink-muted">
                                {harvest.fieldNames.join(" + ")} · {formatKg(harvest.tonnes)} expected{" "}
                                {formatDateRange(harvest.window.start, harvest.window.end)}
                              </span>
                            </p>
                          ) : (
                            <p className="mt-2 text-[12px] text-ink-subtle">Your current harvest window or grade does not match this request.</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {offer ? (
                            <Badge tone={offer.status === "agreed" ? "success" : "market"}>
                              {offer.status === "agreed" ? "Agreed" : "Offer sent"} · {offer.quantityTonnes} t
                            </Badge>
                          ) : (
                            harvest && (
                              <ButtonLink to={`/farmer/market/upload?cycle=${harvest.cycleIds[0]}&requirement=${req.id}`} size="sm">
                                Offer my harvest
                              </ButtonLink>
                            )
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Your listings" subtitle="Crops you have made available to buyers" />
            {myListings.length === 0 ? (
              <EmptyState
                icon={<Package aria-hidden className="size-5" />}
                title="No listings yet"
                description="Upload your expected harvest so buyers across the cluster can find it."
                action={
                  <ButtonLink to="/farmer/market/upload" size="sm" variant="secondary">
                    Upload crop
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {myListings.map((l) => {
                  const pending = interests.filter((i) => i.listingId === l.id && i.status === "pending");
                  return (
                    <li key={l.id} className="px-5 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {l.quantityTonnes} t {l.crop.toLowerCase()} · Grade {l.grade}
                          </div>
                          <div className="text-[13px] text-ink-muted">
                            From {formatDate(l.availableFrom)} · asking ₹{l.expectedPricePerKg}/kg · {l.location}
                            {l.photoCount > 0 && ` · ${l.photoCount} photo${l.photoCount > 1 ? "s" : ""}`}
                          </div>
                          {l.share && (
                            <div className="text-[12px] text-ink-subtle">
                              Buyers see: crop, grade, quantity, dates, price
                              {(["method", "photos", "village", "name"] as const)
                                .filter((k) => l.share![k])
                                .map((k) => `, ${k === "photos" ? "photos and video" : k === "name" ? "your name" : k}`)
                                .join("")}
                            </div>
                          )}
                        </div>
                        <Badge tone={listingStatus[l.status].tone} className="self-start sm:self-auto">
                          {l.status === "agreed" && l.agreedWith ? `Agreed with ${l.agreedWith.buyerLabel}` : listingStatus[l.status].label}
                        </Badge>
                      </div>
                      {l.agreedWith && (
                        <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-[13px]">
                          <span className="font-medium">
                            {l.agreedWith.quantityTonnes} t at ₹{l.agreedWith.pricePerKg}/kg
                          </span>{" "}
                          <span className="text-ink-muted">
                            (indicative value {formatINR(l.agreedWith.quantityTonnes * 1000 * l.agreedWith.pricePerKg)}). Pickup to be arranged through the
                            cluster. No payment is processed in the prototype.
                          </span>
                        </p>
                      )}
                      {l.offerDeclinedBy && l.status === "listed" && (
                        <p className="mt-2 text-[12px] text-ink-muted">
                          {l.offerDeclinedBy} declined your offer. The listing stays visible to other buyers.
                        </p>
                      )}
                      {pending.map((i) => (
                        <div key={i.id} className="mt-2 flex flex-col gap-2 rounded-lg border border-market/20 bg-market-soft p-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-medium">
                              {i.buyerLabel} wants {i.quantityTonnes} t at ₹{i.pricePerKg}/kg
                            </div>
                            {i.message && <div className="text-ink-muted">“{i.message}”</div>}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                acceptInterest(i);
                                toast(`Agreed with ${i.buyerLabel}. The cluster will coordinate pickup.`);
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                update("interests", i.id, { status: "declined" });
                                if (pending.length === 1) update("listings", l.id, { status: "listed" });
                                toast("Request declined. The listing stays visible to other buyers.");
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Indicative tomato prices" action={<SourceBadge source="indicative" />} />
            <ul className="divide-y divide-line px-5 pb-2 pt-1">
              {channels.map((c) => (
                <li key={c.channel} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  <div>
                    <div className="font-medium">{c.channel}</div>
                    <div className="text-[12px] text-ink-muted">{c.note}</div>
                  </div>
                  <div className="tabular-nums">
                    ₹{c.range[0]}–{c.range[1]}/kg
                  </div>
                </li>
              ))}
            </ul>
            <InfoNote className="px-5 pb-4">Not live prices. A production version would connect to a verified market data source.</InfoNote>
          </Card>

          {supply.map((s) => {
            const demand = requirements
              .filter((r) => r.status === "open" && r.crop === s.crop && r.grade === s.grade)
              .reduce((sum, r) => sum + r.quantityTonnes, 0);
            const max = Math.max(s.expectedTonnes, demand);
            const mine = Math.round(myListings.filter((l) => l.crop === s.crop).reduce((sum, l) => sum + l.quantityTonnes, 0) * 10) / 10;
            return (
              <Card key={`${s.crop}-${s.grade}`}>
                <CardHeader
                  title={`Cluster ${s.crop.toLowerCase()} · Grade ${s.grade}`}
                  subtitle={formatDateRange(s.window.start, s.window.end)}
                  action={<SourceBadge source={s.source} />}
                />
                <div className="space-y-3 px-5 pb-4 pt-3 text-[13px]">
                  {[
                    { label: "Expected cluster supply", value: s.expectedTonnes, color: "bg-brand-500" },
                    { label: "Open buyer demand", value: demand, color: "bg-market" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex justify-between">
                        <span className="text-ink-muted">{row.label}</span>
                        <span className="font-medium tabular-nums">{row.value} t</span>
                      </div>
                      <div className="h-2 rounded-full bg-sunken">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-[12px] text-ink-muted">
                    {s.expectedTonnes > demand
                      ? `Supply exceeds this demand by ${s.expectedTonnes - demand} t — pooling lets the cluster approach additional buyers together.`
                      : `Demand exceeds expected supply by ${demand - s.expectedTonnes} t.`}
                    {mine > 0 && ` You have listed ${mine} t.`}
                  </p>
                </div>
              </Card>
            );
          })}
          <p className="px-1 text-[12px] text-ink-muted">
            Need help with grading or negotiation?{" "}
            <Link to="/farmer/experts?category=market" className="font-medium text-brand-700 hover:underline">
              Ask a market specialist
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
