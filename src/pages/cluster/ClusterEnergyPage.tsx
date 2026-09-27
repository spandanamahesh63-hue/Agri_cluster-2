import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Send, Sun } from "lucide-react";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import { StatTile } from "../../features/cluster/StatTile";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { needsWater, pumpingKwh } from "../../features/cluster/coordination";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { useToast } from "../../components/ui/Toast";
import { formatHour } from "../../utils/format";

// Typical share of today's pumping in each time block (demo assumption: most
// farms irrigate in evening grid-supply hours).
const blocks = [
  { id: "6-9", label: "6–9 AM", share: 0.1, solar: false },
  { id: "9-11", label: "9–11 AM", share: 0.05, solar: false },
  { id: "11-14", label: "11 AM–2 PM", share: 0.05, solar: true },
  { id: "14-16", label: "2–4 PM", share: 0.05, solar: false },
  { id: "16-19", label: "4–7 PM", share: 0.5, solar: false },
  { id: "19-22", label: "7–10 PM", share: 0.25, solar: false },
];

export function ClusterEnergyPage() {
  return (
    <ClusterPage title="Energy" description="When is pumping energy used, and how much could move to solar hours?">
      {(v) => <Energy v={v} />}
    </ClusterPage>
  );
}

function Energy({ v }: { v: ClusterView }) {
  const toast = useToast();
  const pumpingToday = v.farms.filter(needsWater);
  const total = pumpingToday.reduce((s, f) => s + pumpingKwh(f), 0);
  const candidates = pumpingToday.filter((f) => f.solarPump);
  const shiftable = candidates.reduce((s, f) => s + pumpingKwh(f), 0);
  const solarFarms = v.farms.filter((f) => f.active && f.solarPump).length;
  const [s0, s1] = v.forecast.solarPeak;

  const data = blocks.map((b) => {
    const current = total * b.share;
    // Shifted: solar farms' non-solar-block pumping moves into the solar block.
    const shifted = b.solar ? current + shiftable * (1 - b.share) : current - shiftable * b.share;
    return { label: b.label, current: Math.round(current), shifted: Math.round(shifted) };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Farms with solar pumps" value={`${solarFarms}`} sub={`of ${v.farms.filter((f) => f.active).length} active farms`} />
        <StatTile label="Pumping needed today" value={`~${Math.round(total)} kWh`} sub={`${pumpingToday.length} farms below crop need · indicative`} />
        <StatTile
          label="Could move to solar"
          status={candidates.length ? "moderate" : "healthy"}
          value={`~${Math.round(shiftable)} kWh`}
          sub={`${candidates.length} solar-pump farms`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Planned pumping by time of day"
            subtitle="Cluster-wide, kWh — current plan vs if solar-pump farms irrigate in the solar window"
            source="indicative"
            legend={[
              { label: "Current plan", color: series[0] },
              { label: "With solar shift", color: series[1] },
            ]}
            table={{ columns: ["Time", "Current plan (kWh)", "With solar shift (kWh)"], rows: data.map((d) => [d.label, d.current, d.shifted]) }}
          >
            <ResponsiveContainer>
              <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} interval={0} />
                <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={44} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip unit=" kWh" />} />
                <Bar dataKey="current" name="Current plan" fill={series[0]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                <Bar dataKey="shifted" name="With solar shift" fill={series[1]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card className="self-start">
          <CardHeader title="Coordinate a solar shift" />
          <div className="space-y-3 px-5 pb-5 pt-3 text-[13px]">
            <div className="flex items-start gap-3">
              <Sun aria-hidden className="mt-0.5 size-5 shrink-0 text-energy" />
              <p>
                Strong solar expected <span className="font-medium">{formatHour(s0)}–{formatHour(s1)}</span>.{" "}
                <span className="text-ink-muted">
                  {candidates.length} farms with solar pumps need water today and are planned for evening grid hours.
                </span>
              </p>
            </div>
            <p className="text-ink-muted">
              Each farmer gets a suggestion with the reasoning; moving is their decision. Evening grid demand also falls for the
              whole feeder.
            </p>
            <Button
              size="sm"
              className="w-full"
              icon={<Send aria-hidden className="size-3.5" />}
              disabled={candidates.length === 0}
              onClick={() => toast(`Solar-window suggestion sent to ${candidates.length} farms (simulated).`)}
            >
              Suggest to {candidates.length} farms
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
