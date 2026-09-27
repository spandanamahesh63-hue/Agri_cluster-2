import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import type { CropListing } from "../../types";
import { useBuyer } from "../../features/buyer/useBuyer";
import { isAvailable, listingMatches, outlookFor } from "../../features/buyer/matching";
import { OfferRow } from "../../features/buyer/OfferRow";
import { ListingRow } from "../../features/buyer/ListingRow";
import { SendInterestDialog } from "../../features/buyer/SendInterestDialog";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { formatDateRange } from "../../utils/format";

export function RequirementDetailPage() {
  const { id } = useParams();
  const b = useBuyer();
  const [interestIn, setInterestIn] = useState<CropListing | null>(null);
  const back = (
    <Link to="/buyer/requirements" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-3.5" />
      Requirements
    </Link>
  );
  if (b.outlook.status === "loading") return <PageSkeleton />;
  if (b.outlook.status === "error")
    return (
      <>
        {back}
        <ErrorState onRetry={b.outlook.retry} />
      </>
    );

  const req = b.requirements.find((r) => r.id === id);
  if (!req)
    return (
      <>
        {back}
        <Card>
          <EmptyState title="Requirement not found" action={<ButtonLink to="/buyer/requirements" size="sm" variant="secondary">Back to requirements</ButtonLink>} />
        </Card>
      </>
    );

  const offers = b.offers.filter((o) => o.requirementId === req.id);
  const matching = b.listings.filter((l) => !l.requirementId && isAvailable(l) && listingMatches(l, req));
  const outlook = outlookFor(req, b.outlook.data);
  const expected = outlook.reduce((s, o) => s + o.expectedTonnes, 0);
  const listed = [...offers, ...matching].filter(isAvailable).reduce((s, l) => s + l.quantityTonnes, 0);
  const max = Math.max(req.quantityTonnes, expected, listed, 1);

  return (
    <>
      {back}
      <header className="mb-6">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <Badge tone="success">Open</Badge>
          <Badge>Grade {req.grade}</Badge>
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {req.quantityTonnes} t {req.crop.toLowerCase()}, {formatDateRange(req.window.start, req.window.end)}
        </h1>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3.5" />
            {req.deliveryLocation}
          </span>
          <span>
            Indicative ₹{req.indicativePricePerKg[0]}–{req.indicativePricePerKg[1]}/kg
          </span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Offers from farmers" subtitle="Made against this requirement" />
            {offers.length === 0 ? (
              <EmptyState title="No offers yet" description="Farmers with a matching harvest can offer it to you from their Market screen." />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {offers.map((l) => (
                  <OfferRow key={l.id} listing={l} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Matching listings" subtitle="Listed by farmers for any buyer" action={<SourceBadge source="demo" />} />
            {matching.length === 0 ? (
              <EmptyState title="No matching listings right now" description="Listings appear as farmers upload expected harvests." />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {matching.map((l) => (
                  <ListingRow key={l.id} listing={l} myInterest={b.interests.find((i) => i.listingId === l.id)} onInterest={() => setInterestIn(l)} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader title="Can the cluster supply this?" action={<SourceBadge source="indicative" />} />
            <div className="space-y-3 px-5 pb-4 pt-3 text-[13px]">
              {[
                { label: "Your requirement", value: req.quantityTonnes, color: "bg-market" },
                { label: `Expected in cluster · ${outlook.reduce((s, o) => s + o.farms, 0)} farms`, value: Math.round(expected * 10) / 10, color: "bg-brand-500" },
                { label: "Listed or offered so far", value: Math.round(listed * 10) / 10, color: "bg-resource" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="text-ink-muted">{row.label}</span>
                    <span className="font-medium tabular-nums">{row.value} t</span>
                  </div>
                  <div className="h-2 rounded-full bg-sunken">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / max) * 100}%` }} />
                  </div>
                </div>
              ))}
              <InfoNote>Expected supply is what member farms plan to harvest in this window. Pooling through the cluster lets you buy from many small farms at once.</InfoNote>
            </div>
          </Card>
        </aside>
      </div>
      {interestIn && <SendInterestDialog listing={interestIn} onClose={() => setInterestIn(null)} />}
    </>
  );
}
