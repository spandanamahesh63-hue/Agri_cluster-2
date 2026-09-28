import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useBuyer } from "../../features/buyer/useBuyer";
import { OfferRow } from "../../features/buyer/OfferRow";
import { isAvailable, listingMatches } from "../../features/buyer/matching";
import { StatTile } from "../../features/cluster/StatTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { TextInput } from "../../components/forms/fields";
import { DEMO_NOW } from "../../data/mock/clock";
import { daysBetween, formatDate, formatDateRange, greeting } from "../../utils/format";

export function BuyerDashboard() {
  const { session, savedListings } = useAppStore();
  const b = useBuyer();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const header = (
    <PageHeader
      eyebrow="Mysuru Vegetable Cluster"
      title={`${greeting(DEMO_NOW)}, ${session?.name}`}
      description="What supply is coming that matches what you need?"
      actions={
        <ButtonLink to="/buyer/requirements/new" icon={<Plus aria-hidden className="size-4" />}>
          Post requirement
        </ButtonLink>
      }
    />
  );
  if (b.outlook.status === "loading") return <PageSkeleton />;
  if (b.outlook.status === "error")
    return (
      <>
        {header}
        <ErrorState onRetry={b.outlook.retry} />
      </>
    );

  const open = b.requirements.filter((r) => r.status === "open");
  const matchingTonnes = b.listings
    .filter((l) => isAvailable(l) && open.some((r) => listingMatches(l, r)))
    .reduce((s, l) => s + l.quantityTonnes, 0);
  const pendingOffers = b.offers.filter((o) => o.status === "offer-sent");
  const pendingRequests = b.interests.filter((i) => i.status === "pending");
  const saved = b.listings.filter((l) => savedListings.includes(l.id));
  const upcoming = b.outlook.data.filter((o) => {
    const d = daysBetween(DEMO_NOW, new Date(o.window.start));
    return d >= -2 && d <= 30 && o.expectedTonnes >= 3;
  });

  return (
    <>
      {header}
      <div className="space-y-6">
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/buyer/supply${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
          }}
        >
          <label htmlFor="buyer-q" className="sr-only">
            Search crops
          </label>
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
            <TextInput id="buyer-q" type="search" placeholder="Search crops, e.g. tomato" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Matching listed supply" value={`${Math.round(matchingTonnes * 10) / 10} t`} sub={`For ${open.length} open requirement${open.length === 1 ? "" : "s"}`} to="/buyer/supply" />
          <StatTile label="Saved listings" value={saved.length} to="/buyer/supply?saved=1" />
          <StatTile label="Requests & offers" value={pendingRequests.length + pendingOffers.length} sub={`${pendingOffers.length} offer${pendingOffers.length === 1 ? "" : "s"} awaiting you`} status={pendingOffers.length ? "moderate" : "healthy"} to="/buyer/requests" />
          <StatTile label="Active purchases" value={b.deals.length} sub="Agreed with farmers" to="/buyer/deals" />
        </div>

        {saved.length > 0 && (
          <Card>
            <CardHeader title="Saved crops" subtitle="Listings you bookmarked" />
            <ul className="mt-2 divide-y divide-line">
              {saved.slice(0, 4).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">
                      {l.quantityTonnes} t {l.crop.toLowerCase()} · Grade {l.grade}
                    </span>
                    <span className="block text-ink-muted">
                      {l.status === "agreed" ? "Sold" : `From ${formatDate(l.availableFrom)} · ₹${l.expectedPricePerKg}/kg`}
                    </span>
                  </span>
                  {b.interests.some((i) => i.listingId === l.id) && <Badge tone="market">Request sent</Badge>}
                </li>
              ))}
            </ul>
            <Link to="/buyer/supply?saved=1" className="block border-t border-line py-2.5 text-center text-[13px] font-medium text-brand-700 hover:bg-canvas">
              View all saved
            </Link>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader title="Offers from farmers" subtitle="Against your requirements" />
            {pendingOffers.length === 0 ? (
              <EmptyState title="No offers waiting" description="Farmers' offers against your requirements appear here." />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {pendingOffers.slice(0, 4).map((l) => (
                  <OfferRow key={l.id} listing={l} />
                ))}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Upcoming cluster harvests" subtitle="Next 30 days" action={<SourceBadge source="indicative" />} />
            <ul className="mt-2 divide-y divide-line">
              {upcoming.map((o) => (
                <li key={`${o.crop}-${o.grade}-${o.window.start}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">
                      {o.crop} · Grade {o.grade}
                    </span>
                    <span className="block text-ink-muted">
                      {formatDateRange(o.window.start, o.window.end)} · {o.farms} farms
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{o.expectedTonnes} t</span>
                </li>
              ))}
            </ul>
            <Link to="/buyer/supply" className="block border-t border-line py-2.5 text-center text-[13px] font-medium text-brand-700 hover:bg-canvas">
              View crop supply
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
