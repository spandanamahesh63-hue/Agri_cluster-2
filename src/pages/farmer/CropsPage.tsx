import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Upload } from "lucide-react";
import type { CropCycle, Field, Recommendation } from "../../types";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { harvestLabourPerAcre, IRRIGATION_EVENTS_PER_WEEK, stageProfile } from "../../data/mock/agronomy";
import { DEMO_NOW } from "../../data/mock/clock";
import { stageLabel } from "../../services/intelligence/engine";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { daysBetween, formatDate, formatDateRange, formatNumber } from "../../utils/format";

const SQ_M_PER_ACRE = 4046.86;
const PLAN_START = new Date("2026-06-01T00:00:00+05:30");
const PLAN_END = new Date("2026-12-15T00:00:00+05:30");
const MONTHS = ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01", "2026-11-01", "2026-12-01"];

const pct = (iso: string | Date) => {
  const t = new Date(iso).getTime();
  return ((t - PLAN_START.getTime()) / (PLAN_END.getTime() - PLAN_START.getTime())) * 100;
};

interface PlanRow {
  field: Field;
  cycle: CropCycle;
  weeklyWaterKl: number;
  harvestWorkerDays: number;
  marketMatch?: Recommendation;
  daysToHarvest: number;
}

export function CropsPage() {
  const overview = useFarmerOverview();
  const header = <PageHeader title="Crops" description="How are my crops progressing, and what will they need next?" />;

  if (overview.status === "loading") return <PageSkeleton />;
  if (overview.status === "error")
    return (
      <>
        {header}
        <ErrorState message={overview.error.message} onRetry={overview.retry} />
      </>
    );

  const d = overview.data;
  const plan: PlanRow[] = d.fields.flatMap((field) => {
    const cycle = d.cycles.find((c) => c.id === field.activeCropCycleId);
    if (!cycle) return [];
    const depth = stageProfile(cycle.crop, cycle.stage)?.irrigationDepthMm ?? 0;
    return [
      {
        field,
        cycle,
        weeklyWaterKl: Math.round((field.acres * SQ_M_PER_ACRE * depth * IRRIGATION_EVENTS_PER_WEEK) / 1000),
        harvestWorkerDays: Math.round(field.acres * (harvestLabourPerAcre[cycle.crop] ?? 8)),
        marketMatch: d.recommendations.find((r) => r.domain === "market" && r.fieldId === field.id),
        daysToHarvest: daysBetween(DEMO_NOW, new Date(cycle.harvestWindow.start)),
      },
    ];
  });

  // Health trend: one row per day, one key per field (colour follows the field, never its rank).
  const days = d.sensorHistory[d.fields[0].id].map((r) => r.at);
  const trend = days.map((at, i) => ({
    label: formatDate(at, { day: "numeric", month: "short" }),
    ...Object.fromEntries(d.fields.map((f) => [f.id, d.sensorHistory[f.id][i].cropHealthScore])),
  }));
  const lastIndex = trend.length - 1;

  return (
    <>
      {header}
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Cropping plan"
            subtitle="Sowing to harvest for each field, with harvest windows highlighted"
            action={<SourceBadge source="demo" />}
          />
          <div className="overflow-x-auto px-5 pb-5 pt-4">
            <div className="min-w-[36rem]">
              <div className="relative ml-28 h-5 text-[11px] text-ink-subtle">
                {MONTHS.map((m) => (
                  <span key={m} className="absolute -translate-x-1/2" style={{ left: `${pct(m)}%` }}>
                    {formatDate(m, { month: "short" })}
                  </span>
                ))}
              </div>
              <ul className="relative space-y-3">
                <li aria-hidden className="pointer-events-none absolute -bottom-5 top-0 left-28 right-0">
                  <div className="absolute bottom-4 top-0 w-px bg-danger" style={{ left: `${pct(DEMO_NOW)}%` }} />
                  <span
                    className="absolute bottom-0 -translate-x-1/2 rounded bg-danger px-1 text-[10px] font-medium leading-4 text-white"
                    style={{ left: `${pct(DEMO_NOW)}%` }}
                  >
                    Today
                  </span>
                </li>
                {plan.map(({ field, cycle }) => {
                  const start = pct(cycle.sowingDate);
                  const harvestStart = pct(cycle.harvestWindow.start);
                  const end = pct(cycle.harvestWindow.end);
                  return (
                    <li key={field.id} className="flex items-center">
                      <div className="w-28 shrink-0 pr-3 text-[13px]">
                        <div className="font-medium">{field.name}</div>
                        <div className="text-[12px] text-ink-muted">
                          {cycle.crop} · {field.acres} ac
                        </div>
                      </div>
                      <div className="relative h-7 flex-1 rounded bg-sunken">
                        <div
                          className="absolute inset-y-1 rounded-l bg-brand-200"
                          style={{ left: `${start}%`, width: `${harvestStart - start}%` }}
                          title={`Growing: ${formatDate(cycle.sowingDate)} – ${formatDate(cycle.harvestWindow.start)}`}
                        />
                        <div
                          className="absolute inset-y-1 rounded-r bg-brand-700"
                          style={{ left: `${harvestStart}%`, width: `${Math.max(end - harvestStart, 1)}%` }}
                          title={`Harvest: ${formatDateRange(cycle.harvestWindow.start, cycle.harvestWindow.end)}`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="ml-28 mt-8 flex gap-4 text-[12px] text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-4 rounded-sm bg-brand-200" /> Growing
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-4 rounded-sm bg-brand-700" /> Harvest window
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[60rem] [&_td]:px-4 [&_th]:px-4 text-[13px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <caption className="sr-only">Cropping plan details</caption>
              <thead>
                <tr className="text-left text-ink-muted">
                  {["Field", "Stage", "Harvest", "Expected", "Water / week", "Harvest labour", "Market timing"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {plan.map((row) => (
                  <tr key={row.field.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{row.field.name}</div>
                      <div className="text-[12px] text-ink-muted">
                        {row.cycle.crop}
                        {row.cycle.variety && ` · ${row.cycle.variety}`}
                      </div>
                    </td>
                    <td className="px-5 py-3">{stageLabel(row.cycle.stage)}</td>
                    <td className="px-5 py-3">
                      {formatDateRange(row.cycle.harvestWindow.start, row.cycle.harvestWindow.end)}
                      <div className="text-[12px] text-ink-muted">in {row.daysToHarvest} days</div>
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.cycle.expectedYieldTonnes} t · Grade {row.cycle.expectedGrade}
                    </td>
                    <td className="px-5 py-3 tabular-nums">~{formatNumber(row.weeklyWaterKl)} kL</td>
                    <td className="px-5 py-3 tabular-nums">~{row.harvestWorkerDays} worker-days</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {row.marketMatch ? <Badge tone="market">Buyer demand matches</Badge> : <span className="text-ink-subtle">No matching request yet</span>}
                        {row.daysToHarvest <= 14 && (
                          <ButtonLink
                            to={`/farmer/market/upload?cycle=${row.cycle.id}`}
                            size="sm"
                            variant="secondary"
                            icon={<Upload aria-hidden className="size-3.5" />}
                          >
                            List harvest
                          </ButtonLink>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-[12px] text-ink-muted">
            Water and labour figures are indicative planning estimates based on crop stage and acreage.
          </p>
        </Card>

        <ChartCard
          title="Crop health index"
          subtitle="Daily composite index per field (0–100). A sustained drop triggers an inspection suggestion."
          source="simulated"
          legend={d.fields.map((f, i) => ({ label: `${f.name} · ${d.cycles.find((c) => c.id === f.activeCropCycleId)?.crop}`, color: series[i], kind: "line" }))}
          table={{
            columns: ["Day", ...d.fields.map((f) => f.name)],
            rows: trend.map((row) => [row.label, ...d.fields.map((f) => (row as Record<string, string | number>)[f.id])]),
          }}
        >
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 8, right: 84, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={chrome.grid} />
              <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} />
              <YAxis domain={[60, 90]} tick={tickStyle} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: chrome.axis }} />
              {d.fields.map((f, i) => (
                <Line
                  key={f.id}
                  dataKey={f.id}
                  name={f.name}
                  stroke={series[i]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: chrome.surface, strokeWidth: 2 }}
                  isAnimationActive={false}
                  label={({ index, x, y, value }: { index?: number; x?: number | string; y?: number | string; value?: unknown }) =>
                    index === lastIndex ? (
                      <text x={Number(x) + 8} y={Number(y) + 4} fontSize={11} fill="#56615a">
                        {f.name} · {String(value)}
                      </text>
                    ) : (
                      <g />
                    )
                  }
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
