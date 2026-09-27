import { Handshake, Truck } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useBuyer } from "../../features/buyer/useBuyer";
import { sellerLabel } from "../../features/shared/identity";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, InfoNote } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { formatDate, formatINR } from "../../utils/format";

export function DealsPage() {
  const b = useBuyer();
  const { farmerProfile } = useAppStore();
  const total = b.deals.reduce((s, d) => s + (d.agreedWith?.quantityTonnes ?? 0), 0);
  const value = b.deals.reduce((s, d) => s + (d.agreedWith ? d.agreedWith.quantityTonnes * 1000 * d.agreedWith.pricePerKg : 0), 0);

  return (
    <>
      <PageHeader title="Deals" description="What have you agreed to buy, and when will it be ready?" />
      {b.deals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Handshake aria-hidden className="size-5" />}
            title="No agreed deals yet"
            description="Deals appear when you accept a farmer's offer or a farmer accepts your interest."
          />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-[13px] text-ink-muted">
            {b.deals.length} deal{b.deals.length > 1 ? "s" : ""} · {Math.round(total * 10) / 10} t · indicative value {formatINR(value)}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {b.deals.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {d.agreedWith!.quantityTonnes} t {d.crop.toLowerCase()} · Grade {d.grade}
                    </div>
                    <div className="text-[13px] text-ink-muted">{sellerLabel(d, farmerProfile)} · {d.location}</div>
                  </div>
                  <Badge tone="success">Agreed</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[13px]">
                  <div>
                    <dt className="text-ink-subtle">Price</dt>
                    <dd className="font-medium">₹{d.agreedWith!.pricePerKg}/kg</dd>
                  </div>
                  <div>
                    <dt className="text-ink-subtle">Value</dt>
                    <dd className="font-medium">{formatINR(d.agreedWith!.quantityTonnes * 1000 * d.agreedWith!.pricePerKg)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-subtle">Ready</dt>
                    <dd className="font-medium">{formatDate(d.availableFrom)}</dd>
                  </div>
                </dl>
                <p className="mt-3 flex items-center gap-2 text-[12px] text-ink-muted">
                  <Truck aria-hidden className="size-3.5" />
                  Pickup via the cluster collection centre — to be scheduled.
                </p>
              </Card>
            ))}
          </div>
          <InfoNote className="mt-4">Agreements are recorded for coordination only. No payment is processed in the prototype.</InfoNote>
        </>
      )}
    </>
  );
}
