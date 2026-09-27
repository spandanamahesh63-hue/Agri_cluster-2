import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sun } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { IntelligenceTabs } from "../../features/intelligence/IntelligenceTabs";
import { HowItWorks } from "../../features/intelligence/HowItWorks";
import { RecommendationCard } from "../../features/intelligence/RecommendationCard";
import { effectiveSchedule } from "../../features/water/schedule";
import { ScheduleList } from "../../features/water/ScheduleList";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { SourceBadge } from "../../components/ui/Badge";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { formatDate, formatHour } from "../../utils/format";

export function EnergyPage() {
  const overview = useFarmerOverview();
  const { decisions } = useAppStore();

  const header = (
    <>
      <PageHeader title="Energy" description="When should I run the pump to use less grid power?" />
      <IntelligenceTabs />
    </>
  );
  if (overview.status === "loading") return <PageSkeleton />;
  if (overview.status === "error")
    return (
      <>
        {header}
        <ErrorState message={overview.error.message} onRetry={overview.retry} />
      </>
    );

  const d = overview.data;
  const [solarStart, solarEnd] = d.forecast.solarPeak;
  const rows = effectiveSchedule({
    farm: d.farm,
    fields: d.fields,
    cycles: d.cycles,
    events: d.irrigation,
    recommendations: d.recommendations,
    decisions,
    forecast: d.forecast,
  });
  const energyRecs = d.recommendations.filter((r) => r.domain === "energy");
  const history = d.energyHistory.map((e) => ({ ...e, label: formatDate(e.date, { weekday: "short", day: "numeric" }) }));
  const solar = history.reduce((s, e) => s + e.solarKwh, 0);
  const total = history.reduce((s, e) => s + e.solarKwh + e.gridKwh, 0);

  return (
    <>
      {header}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-energy-soft text-energy">
              <Sun aria-hidden className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                Strong solar generation expected {formatHour(solarStart)}–{formatHour(solarEnd)} today
              </div>
              <div className="text-[13px] text-ink-muted">
                Pump: {d.farm.pump.powerKw} kW, {d.farm.pump.energy.replace("+", " + ")} · grid supply usually{" "}
                {d.farm.pump.gridHours ? `${formatHour(d.farm.pump.gridHours[0])}–${formatHour(d.farm.pump.gridHours[1])}` : "variable"}
              </div>
            </div>
            <SourceBadge source={d.forecast.source} />
          </Card>

          {energyRecs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}

          <Card>
            <CardHeader title="Pumping schedule" subtitle="Energy source follows the time of day" />
            <ScheduleList rows={rows} showEnergy />
          </Card>

          <ChartCard
            title="Pumping energy by day"
            subtitle="Farm #27, last 7 days, kWh"
            source="simulated"
            legend={[
              { label: "Grid", color: series[0] },
              { label: "Solar", color: series[1] },
            ]}
            table={{
              columns: ["Day", "Grid (kWh)", "Solar (kWh)"],
              rows: history.map((e) => [e.label, e.gridKwh, e.solarKwh]),
            }}
            footer={
              <>
                Solar supplied <span className="font-medium text-ink">{Math.round((solar / total) * 100)}%</span> of pumping energy last
                week. Moving compatible irrigation into strong-sun hours raises this share.
              </>
            }
          >
            <ResponsiveContainer>
              <BarChart data={history} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} />
                <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip unit=" kWh" />} />
                <Bar dataKey="gridKwh" name="Grid" stackId="e" fill={series[0]} stroke={chrome.surface} strokeWidth={2} maxBarSize={24} isAnimationActive={false} />
                <Bar
                  dataKey="solarKwh"
                  name="Solar"
                  stackId="e"
                  fill={series[1]}
                  stroke={chrome.surface}
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <aside>
          <HowItWorks domain="energy" />
        </aside>
      </div>
    </>
  );
}
