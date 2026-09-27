import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useBuyer } from "../../features/buyer/useBuyer";
import { OfferRow } from "../../features/buyer/OfferRow";
import { isAvailable, listingMatches } from "../../features/buyer/matching";
import { StatTile } from "../../features/cluster/StatTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { SourceBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { DEMO_NOW } from "../../data/mock/clock";
import { daysBetween, formatDateRange, greeting } from "../../utils/format";

export function BuyerDashboard() {
  const { session } = useAppStore();
  const b = useBuyer();
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
  const upcoming = b.outlook.data.filter((o) => {
    const d = daysBetween(DEMO_NOW, new Date(o.window.start));
    return d >= -2 && d <= 30 && o.expectedTonnes >= 3;
  });

  return (
    <>
      {header}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Open requirements" value={open.length} to="/buyer/requirements" />
          <StatTile label="Matching listed supply" value={`${Math.round(matchingTonnes * 10) / 10} t`} sub="Listed by farmers" to="/buyer/supply" />
          <StatTile label="Offers awaiting you" value={pendingOffers.length} status={pendingOffers.length ? "moderate" : "healthy"} to="/buyer/requests" />
          <StatTile label="Agreed deals" value={b.deals.length} to="/buyer/deals" />
        </div>

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
