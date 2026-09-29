import { Link } from "react-router-dom";
import { useRevenue } from "../../features/revenue/useRevenue";
import { StatTile } from "../../features/cluster/StatTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, type Tone } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { FARMER_PROMISE, PRICING_STATUS, commissionRates, plans, type RevenueStream } from "../../data/pricing";
import { formatDate, formatINR } from "../../utils/format";

const tone: Record<RevenueStream, Tone> = { equipment: "resource", market: "market", expert: "crop" };

/** Cluster office: the platform commission that confirmed transactions would earn (proposed rates). */
export function ClusterRevenuePage() {
  const r = useRevenue();
  const cluster = plans.find((p) => p.id === "cluster")!;

  return (
    <>
      <PageHeader title="Revenue" description="What would the platform earn from this cluster at the proposed prices?" />
      <InfoNote className="mb-5">
        {PRICING_STATUS} {FARMER_PROMISE}
      </InfoNote>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Commission (proposed)" value={formatINR(r.totalCommission)} sub={`On ${formatINR(r.totalValue)} of confirmed transactions`} />
        {r.byStream.map((s) => (
          <StatTile
            key={s.stream}
            label={commissionRates[s.stream].label}
            value={formatINR(s.commission)}
            sub={`${s.count} × at ${Math.round(commissionRates[s.stream].rate * 1000) / 10}% · paid by ${commissionRates[s.stream].paidBy.toLowerCase()}`}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Confirmed transactions" subtitle="Commission is worked out only when a booking, deal or paid consultation is confirmed" />
          {r.rows.length === 0 ? (
            <EmptyState title="No confirmed transactions yet" description="Bookings owners accept, deals farmers and buyers agree, and paid consultations appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[40rem] text-[13px]">
                <thead>
                  <tr className="border-y border-line text-left text-ink-muted">
                    <th scope="col" className="px-5 py-2 font-medium">Date</th>
                    <th scope="col" className="px-3 py-2 font-medium">Transaction</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
                    <th scope="col" className="px-5 py-2 text-right font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {r.rows.map((row) => (
                    <tr key={`${row.stream}-${row.id}`}>
                      <td className="whitespace-nowrap px-5 py-2.5">{formatDate(row.date)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={tone[row.stream]}>{commissionRates[row.stream].label}</Badge>
                          <span className="font-medium">{row.what}</span>
                        </div>
                        <div className="text-ink-muted">
                          {row.parties} · {row.status}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">{formatINR(row.value)}</td>
                      <td className="px-5 py-2.5 text-right font-medium">{formatINR(row.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Subscription" subtitle="Paid by the organisation running the cluster" />
          <div className="space-y-2 px-5 pb-5 pt-3 text-[13px]">
            <p>
              <span className="text-2xl font-semibold tabular-nums">{formatINR(cluster.price!)}</span>
              <span className="ml-1 text-ink-muted">{cluster.unit}</span>
            </p>
            <p className="text-ink-muted">
              {cluster.name} plan · {formatINR(cluster.price! * 12)} a year (proposed, excluding GST).
            </p>
            <p className="text-ink-muted">The first season can run on the free Pilot plan.</p>
            <Link to="/pricing" className="inline-block font-medium text-brand-700 hover:underline">
              See all plans and rates
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
