import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CloudRain, Droplets, Send } from "lucide-react";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import { StatTile } from "../../features/cluster/StatTile";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { groupBy, irrigationLitres } from "../../features/cluster/coordination";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { useToast } from "../../components/ui/Toast";
import { formatLitres, formatTime } from "../../utils/format";

export function ClusterWaterPage() {
  return (
    <ClusterPage title="Water" description="How is water being used across the cluster, and where can we avoid waste today?">
      {(v) => <Water v={v} />}
    </ClusterPage>
  );
}

function Water({ v }: { v: ClusterView }) {
  const toast = useToast();
  const irrigating = v.farms.filter((f) => f.active && f.irrigationBeforeRain);
  const avoidable = irrigating.filter((f) => f.soilMoisturePct >= f.minSoilMoisture);
  const avoidableLitres = avoidable.reduce((s, f) => s + irrigationLitres(f), 0);

  const byVillage = Object.entries(groupBy(v.farms.filter((f) => f.active), (f) => f.village)).map(([village, farms]) => ({
    village,
    pct: Math.round((farms.filter((f) => f.soilMoisturePct < f.minSoilMoisture).length / farms.length) * 100),
    farms: farms.length,
  }));

  return (
    <div className="space-y-6">
      {v.forecast.rainStartsAt && (
        <div className="flex items-start gap-3 rounded-xl border border-water/20 bg-water-soft px-4 py-3 text-[13px]">
          <CloudRain aria-hidden className="mt-0.5 size-5 shrink-0 text-water" />
          <p>
            <span className="font-medium">
              Rain from {formatTime(v.forecast.rainStartsAt)} · {v.forecast.rainProbabilityPct}% chance, {v.forecast.rainfallMm[0]}–{v.forecast.rainfallMm[1]} mm.
            </span>{" "}
            <span className="text-ink-muted">Irrigation before then is likely unnecessary on farms with adequate soil moisture.</span>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Farms irrigating before rain" status={irrigating.length > 0 ? "alert" : "healthy"} value={irrigating.length} sub={`${v.farmsDelayed} already delayed today`} />
        <StatTile label="Avoidable if all delay" value={formatLitres(avoidableLitres)} sub={`${avoidable.length} farms with adequate moisture · indicative`} />
        <StatTile label="Avoided so far today" value={formatLitres(v.accepted.waterLitres)} sub="From suggestions farmers accepted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Farms with irrigation before the rain"
            subtitle="Each farm has a delay suggestion; the farmer decides"
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<Send aria-hidden className="size-3.5" />}
                disabled={irrigating.length === 0}
                onClick={() => toast(`Reminder sent to ${irrigating.length} farms (simulated — no SMS is sent in the prototype).`)}
              >
                Send reminder
              </Button>
            }
          />
          {irrigating.length === 0 && v.delayedFarms.length === 0 ? (
            <EmptyState title="No irrigation planned before the rain" />
          ) : (
            <ul className="mt-2 max-h-96 divide-y divide-line overflow-y-auto">
              {v.delayedFarms.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">{f.label}</span> <span className="text-ink-muted">· {f.village} · {f.crop}</span>
                  </span>
                  <Badge tone="success">Delayed by farmer</Badge>
                </li>
              ))}
              {irrigating.map((f) => {
                const ok = f.soilMoisturePct >= f.minSoilMoisture;
                return (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                    <span>
                      <span className="font-medium">{f.label}</span> <span className="text-ink-muted">· {f.village} · {f.crop}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-ink-muted">
                        {f.soilMoisturePct}% / {f.minSoilMoisture}%
                      </span>
                      <Badge tone={ok ? "water" : "warning"}>{ok ? "Delay suggested" : "Light irrigation"}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <ChartCard
            title="Farms below crop water need"
            subtitle="Share of active farms, by village"
            source="simulated"
            table={{ columns: ["Village", "Below need", "Active farms"], rows: byVillage.map((r) => [r.village, `${r.pct}%`, r.farms]) }}
          >
            <ResponsiveContainer>
              <BarChart data={byVillage} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={chrome.grid} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="village" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} width={78} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip unit="%" />} />
                <Bar dataKey="pct" name="Below need" fill={series[0]} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
                  <LabelList dataKey="pct" position="right" formatter={(x) => `${x}%`} style={{ fontSize: 11, fill: "#56615a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card>
            <CardHeader title="Shared water sources" action={<SourceBadge source="demo" />} />
            <ul className="divide-y divide-line px-5 pb-2 pt-1">
              {v.infrastructure
                .filter((i) => i.kind === "water")
                .map((i) => (
                  <li key={i.id} className="flex items-start gap-3 py-2.5 text-[13px]">
                    <Droplets aria-hidden className="mt-0.5 size-4 text-water" />
                    <div>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-ink-muted">{i.detail}</div>
                    </div>
                  </li>
                ))}
            </ul>
            <InfoNote className="px-5 pb-4">Water-level monitoring of shared sources is planned for the pilot; not connected in the prototype.</InfoNote>
          </Card>
        </div>
      </div>
    </div>
  );
}
