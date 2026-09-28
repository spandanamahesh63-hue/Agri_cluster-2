import { useAppStore } from "../../store/AppStore";
import { useBuyer } from "../../features/buyer/useBuyer";
import { OfferRow } from "../../features/buyer/OfferRow";
import { sellerLabel } from "../../features/shared/identity";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { formatINR } from "../../utils/format";

export function BuyerRequestsPage() {
  const b = useBuyer();
  const { farmerProfile } = useAppStore();
  const offers = b.offers.filter((o) => o.status === "offer-sent");

  return (
    <>
      <PageHeader title="Requests" description="Which farmers have responded, and where do your requests stand?" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Offers received" subtitle="Farmers offering against your requirements" />
          {offers.length === 0 ? (
            <EmptyState title="No offers waiting" />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {offers.map((l) => (
                <OfferRow key={l.id} listing={l} />
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Requests you sent" subtitle="To farmers, on their listings" />
          {b.interests.length === 0 ? (
            <EmptyState title="No requests sent yet" description="Use “Request farmer” on a listing in Crop supply or on a requirement's matches." />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {b.interests.map((i) => {
                const l = b.listings.find((x) => x.id === i.listingId);
                return (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
                    <span>
                      <span className="font-medium">
                        {i.quantityTonnes} t {l?.crop.toLowerCase()} · {l && sellerLabel(l, farmerProfile)}
                      </span>
                      <span className="block text-ink-muted">
                        ₹{i.pricePerKg}/kg · indicative {formatINR(i.quantityTonnes * 1000 * i.pricePerKg)}
                      </span>
                    </span>
                    <Badge tone={i.status === "accepted" ? "success" : i.status === "declined" ? "neutral" : "market"}>
                      {i.status === "accepted" ? "Accepted by farmer" : i.status === "declined" ? "Declined" : "Awaiting farmer"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
