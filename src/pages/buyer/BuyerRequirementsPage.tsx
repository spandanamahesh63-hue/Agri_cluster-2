import { Link } from "react-router-dom";
import { ClipboardList, MapPin, Plus } from "lucide-react";
import { useBuyer } from "../../features/buyer/useBuyer";
import { isAvailable, listingMatches, outlookFor } from "../../features/buyer/matching";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { formatDateRange } from "../../utils/format";

export function BuyerRequirementsPage() {
  const b = useBuyer();
  const header = (
    <PageHeader
      title="Requirements"
      description="What are you looking to buy, and how much of it can the cluster supply?"
      actions={
        <ButtonLink to="/buyer/requirements/new" icon={<Plus aria-hidden className="size-4" />}>
          New requirement
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

  return (
    <>
      {header}
      {b.requirements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList aria-hidden className="size-5" />}
            title="No requirements yet"
            description="Post what you need and matching farmers in the cluster will see it."
            action={<ButtonLink to="/buyer/requirements/new" size="sm" variant="secondary">New requirement</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {b.requirements.map((r) => {
            const listed = b.listings.filter((l) => isAvailable(l) && listingMatches(l, r)).reduce((s, l) => s + l.quantityTonnes, 0);
            const expected = outlookFor(r, b.outlook.status === "success" ? b.outlook.data : []).reduce((s, o) => s + o.expectedTonnes, 0);
            const offers = b.offers.filter((o) => o.requirementId === r.id && o.status === "offer-sent").length;
            return (
              <Link key={r.id} to={`/buyer/requirements/${r.id}`} className="block rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {r.quantityTonnes} t {r.crop.toLowerCase()} · Grade {r.grade}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-ink-muted">
                      <span>Needed {formatDateRange(r.window.start, r.window.end)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden className="size-3" />
                        {r.deliveryLocation}
                      </span>
                      <span>
                        ₹{r.indicativePricePerKg[0]}–{r.indicativePricePerKg[1]}/kg
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={r.status === "open" ? "success" : "neutral"}>{r.status === "open" ? "Open" : r.status}</Badge>
                    {offers > 0 && <Badge tone="market">{offers} new offer{offers > 1 ? "s" : ""}</Badge>}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[13px] sm:grid-cols-3">
                  <div>
                    <div className="text-ink-subtle">Listed by farmers</div>
                    <div className="font-medium">{Math.round(listed * 10) / 10} t</div>
                  </div>
                  <div>
                    <div className="text-ink-subtle">Expected in cluster</div>
                    <div className="font-medium">{Math.round(expected * 10) / 10} t (indicative)</div>
                  </div>
                  <div>
                    <div className="text-ink-subtle">Coverage</div>
                    <div className="font-medium">{Math.min(100, Math.round((expected / r.quantityTonnes) * 100))}% of need</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
