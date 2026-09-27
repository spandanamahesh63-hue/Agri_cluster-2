import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import { ClusterMap } from "../../features/cluster/ClusterMap";
import { AlertCard } from "../../features/cluster/AlertCard";
import { StatTile } from "../../features/cluster/StatTile";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { Card, CardHeader } from "../../components/ui/Card";
import { SourceBadge } from "../../components/ui/Badge";
import { formatDateRange, formatLitres, formatTime } from "../../utils/format";

export function ClusterOverviewPage() {
  return (
    <ClusterPage
      eyebrow="Cluster overview"
      title="Mysuru Vegetable Cluster"
      description="What is happening across the cluster today?"
      actions={<SourceBadge source="demo" />}
    >
      {(v) => <Overview v={v} />}
    </ClusterPage>
  );
}

function Overview({ v }: { v: ClusterView }) {
  const active = v.farms.filter((f) => f.active).length;
  const stressed = v.farms.filter((f) => f.possibleStress).length;
  const high = v.alerts.filter((a) => a.priority === "high").length;
  const tomato = v.supplyView.find((s) => s.crop === "Tomato");
  const tractors = v.demand.find((d) => d.kind === "tractor");

  return (
    <div className="space-y-6">
      <p className="-mt-3 text-[13px] text-ink-muted">
        {v.cluster.farmerCount} farmers · {v.cluster.cultivatedAcres} acres · {v.cluster.region}
      </p>

      <section aria-label="Cluster indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Active farmers" value={`${active} of ${v.cluster.farmerCount}`} sub="Participating this season" to="/cluster/farms" />
        <StatTile
          label="Water"
          status={v.waterStatus}
          value={`${Math.round(v.belowNeedShare * 100)}% below need`}
          sub="Share of farms under crop need"
          to="/cluster/water"
        />
        <StatTile
          label="Crop health"
          status={stressed > 0 ? "moderate" : "healthy"}
          value={`Index ${v.avgHealth}`}
          sub={`${stressed} farms with possible stress`}
          to="/cluster/crops"
        />
        <StatTile
          label="Weather"
          value={`Rain ${v.forecast.rainProbabilityPct}%`}
          sub={v.forecast.rainStartsAt ? `${v.forecast.rainfallMm[0]}–${v.forecast.rainfallMm[1]} mm from ${formatTime(v.forecast.rainStartsAt)}` : v.forecast.condition}
        />
        <StatTile label="Active alerts" status={high > 0 ? "alert" : "healthy"} value={v.alerts.length} sub={`${high} high priority`} to="/cluster/intelligence" />
        {tomato && (
          <StatTile
            label="Expected harvest · tomato A"
            value={`${tomato.expectedTonnes} t`}
            sub={`${formatDateRange(tomato.window.start, tomato.window.end)} · indicative`}
            to="/cluster/crops"
          />
        )}
        {tomato && (
          <StatTile label="Buyer demand · tomato A" value={`${tomato.demandTonnes} t`} sub={`${tomato.listedTonnes} t listed by farmers`} to="/cluster/market" />
        )}
        {tractors && (
          <StatTile
            label="Tractors tomorrow"
            status={tractors.requested > tractors.available ? "alert" : "healthy"}
            value={`${tractors.requested} requests`}
            sub={`${tractors.available} available in cluster`}
            to="/cluster/resources"
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="alerts" className="space-y-3 lg:col-span-3">
          <div className="flex items-end justify-between">
            <h2 id="alerts" className="text-[15px] font-semibold">
              Needs coordination
            </h2>
            <Link to="/cluster/intelligence" className="text-[13px] font-medium text-brand-700 hover:underline">
              All alerts with reasoning
            </Link>
          </div>
          {v.alerts.slice(0, 4).map((a) => (
            <AlertCard key={a.id} alert={a} compact />
          ))}
        </section>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Cluster map" subtitle="Alerts by farm" action={<SourceBadge source="demo" />} />
            <div className="p-4">
              <ClusterMap farms={v.farms} villages={v.villages} infrastructure={v.infrastructure} mode="alerts" />
            </div>
            <Link
              to="/cluster/farms"
              className="flex items-center justify-center gap-1 border-t border-line py-2.5 text-[13px] font-medium text-brand-700 hover:bg-canvas"
            >
              Open farm map <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </Card>

          <Card>
            <CardHeader title="Member decisions today" subtitle="Suggestions farmers accepted" />
            <div className="grid grid-cols-3 gap-2 px-5 pb-4 pt-3 text-center">
              <div>
                <div className="text-lg font-semibold">{v.accepted.count}</div>
                <div className="text-[12px] text-ink-muted">accepted</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{v.accepted.waterLitres ? formatLitres(v.accepted.waterLitres) : "0 L"}</div>
                <div className="text-[12px] text-ink-muted">water avoided</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{v.accepted.gridKwh.toFixed(0)} kWh</div>
                <div className="text-[12px] text-ink-muted">grid avoided</div>
              </div>
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-muted">
              Indicative estimates from accepted suggestions. Farmers decide; the cluster only coordinates.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
