import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, MapPin, Ruler, Zap } from "lucide-react";
import clsx from "clsx";
import type { FarmerObjective, FarmingMethod } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import type { FarmerOverview } from "../../services/api/demoApi";
import { MethodExplainer } from "../../features/farmer/MethodExplainer";
import { clusterSavings, methods, objectives } from "../../data/mock/planning";
import { usePlan } from "../../features/plan/usePlan";
import { ButtonLink } from "../../components/ui/Button";
import { stageLabel } from "../../services/intelligence/engine";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";
import { ChoiceCards } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatAcres, formatDate, formatDateRange, formatINR } from "../../utils/format";

type Tab = "farm" | "approach" | "investment";

export function MyFarmPage() {
  const overview = useFarmerOverview();
  const [tab, setTab] = useState<Tab>("farm");
  const header = <PageHeader title="My Farm" description="Your fields, your goals and how you farm — the basis for every suggestion." />;

  if (overview.status === "loading") return <PageSkeleton />;
  if (overview.status === "error")
    return (
      <>
        {header}
        <ErrorState message={overview.error.message} onRetry={overview.retry} />
      </>
    );

  return (
    <>
      {header}
      <Tabs<Tab>
        label="My farm sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "farm", label: "Farm & fields" },
          { id: "approach", label: "Goal & method" },
          { id: "investment", label: "Season investment" },
        ]}
      />
      {tab === "farm" && <FarmTab data={overview.data} />}
      {tab === "approach" && <ApproachTab />}
      {tab === "investment" && <InvestmentTab />}
    </>
  );
}

function FarmTab({ data }: { data: FarmerOverview }) {
  const { farm, fields, cycles } = data;
  const p = usePlan();
  const a = p.assessment;
  const facts = [
    { icon: MapPin, label: "Location", value: `${farm.village}, Mysuru` },
    { icon: Ruler, label: "Area", value: `${formatAcres(farm.totalAcres)} · ${fields.length} fields` },
    { icon: Droplets, label: "Irrigation", value: farm.irrigation === "drip" ? "Drip" : farm.irrigation },
    { icon: Zap, label: "Pump", value: `${farm.pump.powerKw} kW · ${farm.pump.energy.replace("+", " + ")}` },
  ];

  return (
    <div className="space-y-6">
      {p.done.assessment && (
        <Card className="p-4 text-[13px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-medium">From your farm assessment</div>
            <Link to="/farmer/plan/assessment" className="font-medium text-brand-700 hover:underline">
              Edit farm details
            </Link>
          </div>
          <p className="mt-0.5 text-ink-muted">
            {formatAcres(a.landAcres)} in {a.location} · {a.soilType} soil · {a.irrigation === "rainfed" ? "rainfed" : `${a.irrigation} irrigation`}
            {a.currentCrop && ` · growing ${a.currentCrop.toLowerCase()}`}.
          </p>
          <InfoNote className="mt-2">Prototype: field monitoring continues to use the demo farm (Farm #27) so the story stays coherent.</InfoNote>
        </Card>
      )}

      <Card>
        <CardHeader title={farm.label} subtitle="Shown to other cluster members instead of your name" action={<SourceBadge source="demo" />} />
        <dl className="grid gap-4 px-5 pb-5 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-3">
              <f.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
              <div>
                <dt className="text-[12px] text-ink-subtle">{f.label}</dt>
                <dd className="text-sm font-medium capitalize">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardHeader title="Fields" subtitle="Current crop in each field" />
        <ul className="divide-y divide-line">
          {fields.map((field) => {
            const cycle = cycles.find((c) => c.id === field.activeCropCycleId);
            return (
              <li key={field.id} className="grid gap-2 px-5 py-3.5 text-[13px] sm:grid-cols-[1fr_1fr_1fr]">
                <div>
                  <div className="text-sm font-medium">{field.name}</div>
                  <div className="text-ink-muted">{formatAcres(field.acres)}</div>
                </div>
                <div>
                  <div className="font-medium">
                    {cycle?.crop} <span className="font-normal text-ink-muted">{cycle?.variety}</span>
                  </div>
                  <div className="text-ink-muted">Sown {cycle && formatDate(cycle.sowingDate)}</div>
                </div>
                <div className="sm:text-right">
                  {cycle && <Badge tone="crop">{stageLabel(cycle.stage)}</Badge>}
                  <div className="mt-0.5 text-ink-muted">Harvest {cycle && formatDateRange(cycle.harvestWindow.start, cycle.harvestWindow.end)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function ApproachTab() {
  const { farmerProfile, updateProfile } = useAppStore();
  const p = usePlan();
  const toast = useToast();

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 text-[13px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium">Season plan</div>
          <p className="text-ink-muted">
            {p.crop && p.method ? `${p.crop.name} with ${p.method.name.toLowerCase()}.` : "No crop or method chosen yet."} The plan picks what to grow and how; the
            choices below change how daily suggestions are ordered.
          </p>
        </div>
        <ButtonLink to={p.crop ? "/farmer/plan/method" : "/farmer/plan/crop"} size="sm" variant="secondary" className="shrink-0">
          {p.crop ? "Change crop or method" : "Choose crop and method"}
        </ButtonLink>
      </Card>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <ChoiceCards<FarmerObjective>
          legend="What matters most to you this season?"
          name="objective"
          value={farmerProfile.objective}
          onChange={(objective) => {
            updateProfile({ objective });
            toast(`Suggestions will now be ordered for “${objectives.find((o) => o.id === objective)!.title.toLowerCase()}”.`);
          }}
          options={objectives}
        />
        <InfoNote className="mt-4">Your goal changes the order of suggestions. It never hides one or changes its priority.</InfoNote>
      </Card>
      <Card className="space-y-4 p-5">
        <ChoiceCards<FarmingMethod>
          legend="How do you farm?"
          name="method"
          value={farmerProfile.method}
          onChange={(method) => updateProfile({ method })}
          columns={2}
          options={methods.map((m) => ({ id: m.id, title: m.title, description: m.summary }))}
        />
        <MethodExplainer method={farmerProfile.method} />
      </Card>
    </div>
    </div>
  );
}

function InvestmentTab() {
  const { farmerProfile } = useAppStore();
  const p = usePlan();
  const total = p.budget;
  const rows = p.budgetLines.map((l) => ({ ...l, saving: clusterSavings.find((s) => s.category === l.category) }));
  const saveLow = rows.reduce((s, l) => s + (l.saving ? (l.amount * l.saving.savingRange[0]) / 100 : 0), 0);
  const saveHigh = rows.reduce((s, l) => s + (l.saving ? (l.amount * l.saving.savingRange[1]) / 100 : 0), 0);
  const round = (n: number) => Math.round(n / 100) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="text-[13px] text-ink-muted">{p.done.investment ? "Your season budget" : "Suggested season budget (not saved yet)"}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{formatINR(total)}</div>
          <div className="mt-1 text-[12px] text-ink-subtle">
            {formatAcres(p.assessment.landAcres)}
            {p.crop && ` · ${p.crop.name}`}
            {p.method && ` · ${p.method.name}`} ·{" "}
            <Link to="/farmer/plan/investment" className="font-medium text-brand-700 hover:underline">
              Change in Plan
            </Link>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[13px] text-ink-muted">Potential saving through cluster coordination</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {formatINR(round(saveLow))}–{formatINR(round(saveHigh))}
          </div>
          <div className="mt-1 text-[12px] text-ink-subtle">
            {Math.round((saveLow / total) * 100)}–{Math.round((saveHigh / total) * 100)}% of the season budget
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Where the money goes, and where the cluster can help"
          subtitle="Highlighted rows support your goal"
          action={<SourceBadge source="indicative" />}
        />
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[40rem] text-[13px]">
            <thead>
              <tr className="border-y border-line text-left text-ink-muted">
                <th scope="col" className="px-5 py-2.5 font-medium">Category</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Budget</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Cost-saving opportunity</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Potential saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {rows.map((l) => {
                const supportsGoal = !!l.saving?.domains.includes(farmerProfile.objective);
                return (
                  <tr key={l.category} className={clsx(supportsGoal && "bg-brand-50/60")}>
                    <td className="px-5 py-3 font-medium">
                      {l.category}
                      {supportsGoal && <span className="sr-only"> (supports your goal)</span>}
                    </td>
                    <td className="px-5 py-3 text-right">{formatINR(l.amount)}</td>
                    <td className="px-5 py-3 text-ink-muted">{l.saving?.opportunity ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {l.saving
                        ? `${formatINR(round((l.amount * l.saving.savingRange[0]) / 100))}–${formatINR(round((l.amount * l.saving.savingRange[1]) / 100))}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <InfoNote className="px-5 py-4">
          Indicative estimates / demonstration values for planning only — not guaranteed savings or returns. Actual costs depend on
          local prices, weather and management.
        </InfoNote>
      </Card>
    </div>
  );
}
