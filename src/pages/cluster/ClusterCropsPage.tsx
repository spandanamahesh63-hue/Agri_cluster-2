import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Send } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { ClusterPage } from "../../features/cluster/ClusterPage";
import { StatTile } from "../../features/cluster/StatTile";
import type { ClusterView } from "../../features/cluster/useClusterView";
import { groupBy, HARVEST_WORKER_DAYS_PER_ACRE, PICKUP_TONNES } from "../../features/cluster/coordination";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { useToast } from "../../components/ui/Toast";
import { DEMO_NOW } from "../../data/mock/clock";
import { daysBetween, formatDateRange } from "../../utils/format";

export function ClusterCropsPage() {
  return (
    <ClusterPage title="Crops" description="How healthy are crops across the cluster, and what harvests are coming?">
      {(v) => <Crops v={v} />}
    </ClusterPage>
  );
}

function Crops({ v }: { v: ClusterView }) {
  const toast = useToast();
  const { consultations } = useAppStore();
  const active = v.farms.filter((f) => f.active);
  const stressed = active.filter((f) => f.possibleStress);

  const mix = Object.entries(groupBy(active, (f) => f.crop))
    .map(([crop, farms]) => ({ crop, acres: Math.round(farms.reduce((s, f) => s + f.acres, 0)), farms: farms.length }))
    .sort((a, b) => b.acres - a.acres);

  const calendar = Object.values(groupBy(active, (f) => `${f.harvestWindow.start}|${f.crop}|${f.grade}`))
    .map((farms) => {
      const f0 = farms[0];
      const tonnes = Math.round(farms.reduce((s, f) => s + f.expectedTonnes, 0) * 10) / 10;
      return {
        key: `${f0.harvestWindow.start}-${f0.crop}-${f0.grade}`,
        window: f0.harvestWindow,
        crop: f0.crop,
        grade: f0.grade,
        farms: farms.length,
        tonnes,
        workerDays: Math.round(farms.reduce((s, f) => s + f.acres * (HARVEST_WORKER_DAYS_PER_ACRE[f.crop] ?? 6), 0)),
        pickups: Math.ceil(tonnes / PICKUP_TONNES),
      };
    })
    .sort((a, b) => a.window.start.localeCompare(b.window.start))
    .filter((row) => daysBetween(DEMO_NOW, new Date(row.window.end)) >= 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Average crop health" status={stressed.length ? "moderate" : "healthy"} value={`Index ${v.avgHealth}`} sub={`${active.length} active farms`} />
        <StatTile label="Possible crop stress" status={stressed.length ? "alert" : "healthy"} value={`${stressed.length} farms`} sub="Humid, wet-leaf conditions" />
        <StatTile label="Next harvest" value={calendar[0] ? `${calendar[0].crop}, ${formatDateRange(calendar[0].window.start, calendar[0].window.end)}` : "—"} sub={calendar[0] ? `${calendar[0].tonnes} t from ${calendar[0].farms} farms` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Farms with possible crop stress"
            subtitle="Tomato health index declining in humid conditions"
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<Send aria-hidden className="size-3.5" />}
                onClick={() => toast(`Crop specialist alerted about ${stressed.length} farms (simulated).`)}
              >
                Alert crop specialist
              </Button>
            }
          />
          <ul className="mt-2 divide-y divide-line">
            {stressed.map((f) => {
              const asked = f.label === "Farm #27" && consultations.some((c) => c.fieldId === "f27-2");
              return (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">{f.label}</span> <span className="text-ink-muted">· {f.village} · {f.acres} ac</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-ink-muted">Health {f.healthScore}</span>
                    {asked ? <Badge tone="success">Farmer asked an expert</Badge> : <Badge tone="danger">Inspection suggested</Badge>}
                  </span>
                </li>
              );
            })}
          </ul>
          <InfoNote className="px-5 py-3">Neighbouring stressed farms suggest a shared cause; one specialist visit can cover several.</InfoNote>
        </Card>

        <div className="lg:col-span-2">
          <ChartCard
            title="Crop mix"
            subtitle="Acres under each crop, active farms"
            source="demo"
            table={{ columns: ["Crop", "Acres", "Farms"], rows: mix.map((m) => [m.crop, m.acres, m.farms]) }}
          >
            <ResponsiveContainer>
              <BarChart data={mix} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={chrome.grid} />
                <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="crop" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} width={100} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip unit=" ac" />} />
                <Bar dataKey="acres" name="Acres" fill={series[0]} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
                  <LabelList dataKey="acres" position="right" formatter={(x) => `${x} ac`} style={{ fontSize: 11, fill: "#56615a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Harvest calendar"
          subtitle="What the cluster expects to harvest, and what it will need"
          action={<SourceBadge source="indicative" />}
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-[13px] [&_td]:whitespace-nowrap">
            <thead>
              <tr className="border-y border-line text-left text-ink-muted">
                {["Harvest window", "Crop", "Farms", "Expected", "Harvest labour", "Pickups (1.5 t)"].map((h) => (
                  <th key={h} scope="col" className="px-5 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {calendar.map((row) => (
                <tr key={row.key}>
                  <td className="px-5 py-2.5 font-medium">{formatDateRange(row.window.start, row.window.end)}</td>
                  <td className="px-5 py-2.5">
                    {row.crop} · Grade {row.grade}
                  </td>
                  <td className="px-5 py-2.5">{row.farms}</td>
                  <td className="px-5 py-2.5">{row.tonnes} t</td>
                  <td className="px-5 py-2.5">~{row.workerDays} worker-days</td>
                  <td className="px-5 py-2.5">{row.pickups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoNote className="px-5 py-3">Labour and transport are planning estimates from acreage and typical yields.</InfoNote>
      </Card>
    </div>
  );
}
