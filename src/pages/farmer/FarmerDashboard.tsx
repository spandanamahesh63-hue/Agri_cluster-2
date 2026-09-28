import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, CloudRain, Sun, Tractor } from "lucide-react";
import type { CropCycle, Field, SensorReading } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { RecommendationCard } from "../../features/intelligence/RecommendationCard";
import { stageLabel } from "../../services/intelligence/engine";
import type { FarmerOverview } from "../../services/api/demoApi";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, SourceBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";
import { DEMO_NOW } from "../../data/mock/clock";
import { objectives } from "../../data/mock/planning";
import { orderForObjective } from "../../features/farmer/objective";
import { SeasonCard } from "../../features/plan/SeasonCard";
import { formatAcres, formatHour, formatTime, greeting } from "../../utils/format";

const MAX_ON_DASHBOARD = 3;

export function FarmerDashboard() {
  const overview = useFarmerOverview();
  const { session, decisions, farmerProfile } = useAppStore();

  if (overview.status === "loading") return <PageSkeleton />;
  if (overview.status === "error") return <ErrorState message={overview.error.message} onRetry={overview.retry} />;

  const data = overview.data;
  const { farm } = data;
  const recommendations = orderForObjective(data.recommendations, farmerProfile.objective);
  const pending = recommendations.filter((r) => !decisions[r.id] && r.priority !== "low");
  const firstName = (session?.name ?? "").split(" ")[0];
  const goal = objectives.find((o) => o.id === farmerProfile.objective);

  return (
    <>
      <PageHeader
        eyebrow={`${farm.label} · ${farm.village} · ${formatAcres(farm.totalAcres)}`}
        title={`${greeting(DEMO_NOW)}, ${firstName}`}
        description="Here is what the data suggests today. You decide what to do."
      />

      {!farmerProfile.onboarded && (
        <Card className="mb-6 flex flex-col gap-3 border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-brand-900">Finish setting up your farm</div>
            <p className="text-[13px] text-brand-800">Tell us your goal, farm and crop — it takes about a minute.</p>
          </div>
          <ButtonLink to="/farmer/plan/assessment" size="sm">
            Continue setup
          </ButtonLink>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="today" className="space-y-3 lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="today" className="text-[15px] font-semibold">
                Today's intelligence
              </h2>
              <p className="text-[13px] text-ink-muted">
                {pending.length === 0
                  ? "Nothing needs your attention right now."
                  : `${pending.length} ${pending.length === 1 ? "action" : "actions"} may need your attention`}
                {goal && pending.length > 1 && <span className="text-ink-subtle"> · ordered for “{goal.title.toLowerCase()}”</span>}
              </p>
            </div>
            <Link to="/farmer/intelligence" className="shrink-0 text-[13px] font-medium text-brand-700 hover:underline">
              All suggestions
            </Link>
          </div>

          {pending.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CircleCheck aria-hidden className="size-5 text-success" />}
                title="You're up to date"
                description="You have reviewed every suggestion for today. New ones appear when conditions change."
                action={
                  <ButtonLink to="/farmer/intelligence" variant="secondary" size="sm">
                    Review past decisions
                  </ButtonLink>
                }
              />
            </Card>
          ) : (
            <>
              {pending.slice(0, MAX_ON_DASHBOARD).map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
              {pending.length > MAX_ON_DASHBOARD && (
                <Link
                  to="/farmer/intelligence"
                  className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong py-3 text-[13px] font-medium text-ink-muted hover:bg-surface hover:text-ink"
                >
                  {pending.length - MAX_ON_DASHBOARD} more in Intelligence
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          <SeasonCard />
          <WeatherCard forecast={data.forecast} />
          <FieldsCard fields={data.fields} cycles={data.cycles} readings={data.latestReadings} />
          <ClusterCard data={data} />
        </aside>
      </div>
    </>
  );
}

function WeatherCard({ forecast }: { forecast: FarmerOverview["forecast"] }) {
  return (
    <Card>
      <CardHeader title="Weather" action={<SourceBadge source={forecast.source} />} />
      <div className="space-y-3 px-5 pb-4 pt-3">
        <div className="flex items-start gap-3">
          <CloudRain aria-hidden className="mt-0.5 size-5 shrink-0 text-water" />
          <div>
            <div className="text-sm font-medium">
              {forecast.rainStartsAt ? `Rain likely from ${formatTime(forecast.rainStartsAt)}` : forecast.condition}
            </div>
            <div className="text-[13px] text-ink-muted">
              {forecast.rainProbabilityPct}% chance · {forecast.rainfallMm[0]}–{forecast.rainfallMm[1]} mm · {forecast.minTempC}–
              {forecast.maxTempC}°C
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Sun aria-hidden className="mt-0.5 size-5 shrink-0 text-energy" />
          <div>
            <div className="text-sm font-medium">Strong sun {formatHour(forecast.solarPeak[0])}–{formatHour(forecast.solarPeak[1])}</div>
            <div className="text-[13px] text-ink-muted">Best window for solar pumping</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FieldsCard({
  fields,
  cycles,
  readings,
}: {
  fields: Field[];
  cycles: CropCycle[];
  readings: Record<string, SensorReading>;
}) {
  return (
    <Card>
      <CardHeader title="My fields" action={<SourceBadge source="simulated" />} />
      <ul className="divide-y divide-line px-5 pb-2 pt-1">
        {fields.map((field) => {
          const cycle = cycles.find((c) => c.id === field.activeCropCycleId);
          const r = readings[field.id];
          const watch = r.cropHealthScore < 75;
          return (
            <li key={field.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {field.name} <span className="font-normal text-ink-muted">· {field.acres} ac</span>
                </div>
                <div className="truncate text-[12px] text-ink-muted">
                  {cycle ? `${cycle.crop}, ${stageLabel(cycle.stage).toLowerCase()}` : "No active crop"}
                </div>
              </div>
              <div className="shrink-0 text-right text-[12px] text-ink-muted">
                <div>Moisture {r.soilMoisturePct}%</div>
                <div className="mt-0.5">
                  {watch ? (
                    <Badge tone="warning">Health {r.cropHealthScore} · watch</Badge>
                  ) : (
                    <span>Health {r.cropHealthScore}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ClusterCard({ data }: { data: FarmerOverview }) {
  const available = data.tractors.total - data.tractors.booked;
  return (
    <Card>
      <CardHeader title="Cluster today" subtitle={data.cluster.name} action={<SourceBadge source="demo" />} />
      <div className="px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Tractor aria-hidden className="size-5 shrink-0 text-resource" />
          <div className="text-[13px]">
            <span className="font-medium text-ink">{available} of {data.tractors.total} tractors free</span>
            <span className="text-ink-muted"> · {data.tractors.booked} booked today</span>
          </div>
        </div>
        <ButtonLink to="/farmer/resources" variant="secondary" size="sm" className="mt-3 w-full">
          Find machinery
        </ButtonLink>
      </div>
    </Card>
  );
}
