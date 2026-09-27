import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { Card, CardHeader } from "../../components/ui/Card";
import { InfoNote, SourceBadge } from "../../components/ui/Badge";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { formatLitres } from "../../utils/format";

export function ClusterImpactPage() {
  return (
    <ClusterPage
      title="Impact"
      description="Is the pilot moving towards its targets?"
      actions={<SourceBadge source="prototype" />}
    >
      {(v) => <Impact v={v} />}
    </ClusterPage>
  );
}

function Impact({ v }: { v: ClusterView }) {
  // Index every metric to its baseline (= 100) so different units share one axis.
  const indexed = v.impactComparison.map((m) => {
    const index = Math.round((m.pilot / m.baseline) * 1000) / 10;
    const improved = m.better === "lower" ? index < 100 : index > 100;
    return { ...m, index, improved };
  });

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Pilot</div>
          <div className="mt-0.5 text-lg font-semibold">One cluster · 100+ farmers · 250+ acres</div>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
            A baseline season is measured first; improvements are only claimed against that baseline. Tracked: water use, energy use,
            input costs, crop loss, machinery utilisation, market realisation and farmer adoption.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold">{v.farms.filter((f) => f.active).length}</div>
            <div className="text-[12px] text-ink-muted">farmers active</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{v.cluster.cultivatedAcres}</div>
            <div className="text-[12px] text-ink-muted">acres covered</div>
          </div>
        </div>
      </Card>

      <section aria-labelledby="targets">
        <h2 id="targets" className="mb-3 text-[15px] font-semibold">
          Pilot targets
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {v.impactMetrics.map((m) => {
            const [lo, hi] = m.targetRange;
            const scaleMax = Math.max(hi, m.current) * 1.15;
            return (
              <Card key={m.id} className="p-4">
                <div className="text-[13px] text-ink-muted">{m.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {m.current}%<span className="ml-1 text-[13px] font-normal text-ink-muted">{m.unit.replace("% ", "")}</span>
                </div>
                <div
                  className="relative mt-3 h-2 rounded-full bg-brand-100"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={Math.round(scaleMax)}
                  aria-valuenow={m.current}
                  aria-label={`${m.label}: ${m.current}% so far, target ${lo === hi ? lo : `${lo}–${hi}`}%`}
                >
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${(m.current / scaleMax) * 100}%` }} />
                  <div
                    aria-hidden
                    className="absolute -top-1 h-4 rounded-sm border-x-2 border-ink"
                    style={{ left: `${(lo / scaleMax) * 100}%`, width: `${Math.max(((hi - lo) / scaleMax) * 100, 0.5)}%` }}
                  />
                </div>
                <div className="mt-2 text-[12px] text-ink-muted">
                  Target {lo === hi ? `${lo}%` : `${lo}–${hi}%`} · season to date
                </div>
              </Card>
            );
          })}
        </div>
        <InfoNote className="mt-3">Pilot targets are illustrative goals, not guaranteed outcomes. Current values are prototype values.</InfoNote>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Pilot season vs baseline"
            subtitle="Each measure indexed to its baseline season (baseline = 100). Full definitions in the table view."
            source="prototype"
            table={{
              columns: ["Measure", "Baseline", "Pilot", "Index"],
              rows: indexed.map((m) => [m.metric, m.baseline, m.pilot, m.index]),
            }}
          >
            <ResponsiveContainer>
              <BarChart data={indexed} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={chrome.grid} />
                <XAxis type="number" domain={[60, 140]} ticks={[60, 80, 100, 120, 140]} tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="short" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} width={84} />
                <ReferenceLine x={100} stroke="#56615a" strokeWidth={1.5} label={{ value: "Baseline", position: "top", fontSize: 11, fill: "#56615a" }} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip />} />
                <Bar dataKey="index" name="Index" fill={series[0]} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
                  <LabelList dataKey="index" position="right" style={{ fontSize: 11, fill: "#56615a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Direction of change" />
            <ul className="divide-y divide-line px-5 pb-2 pt-1 text-[13px]">
              {indexed.map((m) => (
                <li key={m.metric} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-ink-muted">{m.metric}</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${m.improved ? "text-success" : "text-danger"}`}>
                    {m.pilot > m.baseline ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" />}
                    {m.improved ? "Better" : "Worse"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Activity feeding the measures" subtitle="Recorded in this demo session" />
            <dl className="grid grid-cols-2 gap-3 px-5 pb-5 pt-3 text-[13px]">
              {[
                ["Suggestions accepted", v.activity.accepted],
                ["Water avoided", formatLitres(v.accepted.waterLitres)],
                ["Crop listings", v.activity.listings],
                ["Resource requests", v.activity.bookings + v.activity.labourRequests + v.activity.serviceRequests],
                ["Expert questions", v.activity.consultations],
                ["Grid energy avoided", `${v.accepted.gridKwh.toFixed(0)} kWh`],
              ].map(([k, val]) => (
                <div key={k as string} className="rounded-lg bg-canvas p-3">
                  <dt className="text-[12px] text-ink-muted">{k}</dt>
                  <dd className="mt-0.5 text-base font-semibold">{val}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
