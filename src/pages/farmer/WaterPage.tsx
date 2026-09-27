import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CloudRain } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { IntelligenceTabs } from "../../features/intelligence/IntelligenceTabs";
import { HowItWorks } from "../../features/intelligence/HowItWorks";
import { effectiveSchedule } from "../../features/water/schedule";
import { ScheduleList } from "../../features/water/ScheduleList";
import { stageProfile } from "../../data/mock/agronomy";
import { stageLabel } from "../../services/intelligence/engine";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTooltip } from "../../components/charts/ChartTooltip";
import { chrome, series, tickStyle } from "../../components/charts/palette";
import { formatDate, formatNumber, formatTime, hoursBetween } from "../../utils/format";
import { DEMO_NOW } from "../../data/mock/clock";

export function WaterPage() {
  const overview = useFarmerOverview();
  const { decisions } = useAppStore();

  const header = (
    <>
      <PageHeader title="Water" description="What should I do about irrigation today?" />
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
  const rows = effectiveSchedule({
    farm: d.farm,
    fields: d.fields,
    cycles: d.cycles,
    events: d.irrigation,
    recommendations: d.recommendations,
    decisions,
    forecast: d.forecast,
  });
  const hoursToRain = d.forecast.rainStartsAt ? Math.round(hoursBetween(DEMO_NOW, new Date(d.forecast.rainStartsAt))) : null;

  const history = d.waterHistory.map((w) => ({ ...w, label: formatDate(w.date, { weekday: "short", day: "numeric" }) }));
  const actual = history.reduce((s, w) => s + w.actualKl, 0);
  const recommended = history.reduce((s, w) => s + w.recommendedKl, 0);
  const avoidablePct = Math.round(((actual - recommended) / actual) * 100);

  return (
    <>
      {header}

      {hoursToRain !== null && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-water/20 bg-water-soft px-4 py-3">
          <CloudRain aria-hidden className="mt-0.5 size-5 shrink-0 text-water" />
          <div className="text-[13px]">
            <div className="font-medium text-ink">
              Rain expected in about {hoursToRain} hours ({formatTime(d.forecast.rainStartsAt!)})
            </div>
            <div className="text-ink-muted">
              {d.forecast.rainProbabilityPct}% chance · {d.forecast.rainfallMm[0]}–{d.forecast.rainfallMm[1]} mm expected ·{" "}
              <SourceBadge source={d.forecast.source} className="align-middle" />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Irrigation plan" subtitle="Your schedule, including changes you have accepted" />
            <ScheduleList rows={rows} />
          </Card>

          <Card>
            <CardHeader title="Soil moisture vs crop need" subtitle="Latest reading per field" action={<SourceBadge source="simulated" />} />
            <ul className="space-y-4 px-5 pb-5 pt-4">
              {d.fields.map((field) => {
                const cycle = d.cycles.find((c) => c.id === field.activeCropCycleId);
                const profile = cycle && stageProfile(cycle.crop, cycle.stage);
                const moisture = d.latestReadings[field.id].soilMoisturePct;
                if (!cycle || !profile) return null;
                const ok = moisture >= profile.minSoilMoisture;
                return (
                  <li key={field.id}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                      <span>
                        <span className="font-medium">{field.name}</span>
                        <span className="text-ink-muted">
                          {" "}
                          · {cycle.crop}, {stageLabel(cycle.stage).toLowerCase()}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums">
                          {moisture}% <span className="text-ink-subtle">/ needs ≥ {profile.minSoilMoisture}%</span>
                        </span>
                        <Badge tone={ok ? "success" : "warning"}>{ok ? "Adequate" : "Below need"}</Badge>
                      </span>
                    </div>
                    <div
                      className="relative h-2 rounded-full bg-water-soft"
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={moisture}
                      aria-label={`${field.name} soil moisture`}
                    >
                      <div className="h-full rounded-full bg-water" style={{ width: `${moisture}%` }} />
                      <div
                        aria-hidden
                        className="absolute -top-1 h-4 w-0.5 rounded bg-ink"
                        style={{ left: `${profile.minSoilMoisture}%` }}
                        title="Crop need"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <ChartCard
            title="Actual vs recommended water use"
            subtitle="Farm #27, last 7 days, kilolitres"
            source="simulated"
            legend={[
              { label: "Actual", color: series[0] },
              { label: "Recommended", color: series[1] },
            ]}
            table={{
              columns: ["Day", "Actual (kL)", "Recommended (kL)"],
              rows: history.map((w) => [w.label, w.actualKl, w.recommendedKl]),
            }}
            footer={
              <>
                About <span className="font-medium text-ink">{formatNumber((actual - recommended) * 1000)} L ({avoidablePct}%)</span> of
                last week's water was above what the crop and weather required — the kind of avoidable use the pilot aims to reduce
                (indicative estimate).
              </>
            }
          >
            <ResponsiveContainer>
              <BarChart data={history} barGap={2} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: chrome.axis }} />
                <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip cursor={{ fill: "rgba(23,32,27,0.04)" }} content={<ChartTooltip unit=" kL" />} />
                <Bar dataKey="actualKl" name="Actual" fill={series[0]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                <Bar dataKey="recommendedKl" name="Recommended" fill={series[1]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <aside className="space-y-4">
          <HowItWorks domain="water" />
          <p className="px-1 text-[12px] text-ink-muted">
            Want help with drip layout or scheduling?{" "}
            <Link to="/farmer/experts?category=irrigation" className="font-medium text-brand-700 hover:underline">
              Ask an irrigation specialist
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
