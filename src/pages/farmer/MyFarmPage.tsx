import { useState } from "react";
import { Droplets, MapPin, Ruler, Zap } from "lucide-react";
import clsx from "clsx";
import type { FarmerObjective, FarmingMethod } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import type { FarmerOverview } from "../../services/api/demoApi";
import { MethodExplainer } from "../../features/farmer/MethodExplainer";
import { investmentPlan, methods, objectives } from "../../data/mock/planning";
import { stageLabel } from "../../services/intelligence/engine";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge, InfoNote, SourceBadge } from "../../components/ui/Badge";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";
import { ChoiceCards } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatDateRange, formatINR } from "../../utils/format";

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
  const { farmerProfile } = useAppStore();
  const facts = [
    { icon: MapPin, label: "Location", value: `${farm.village}, Mysuru` },
    { icon: Ruler, label: "Area", value: `${farm.totalAcres} acres · ${fields.length} fields` },
    { icon: Droplets, label: "Irrigation", value: farm.irrigation === "drip" ? "Drip" : farm.irrigation },
    { icon: Zap, label: "Pump", value: `${farm.pump.powerKw} kW · ${farm.pump.energy.replace("+", " + ")}` },
  ];

  return (
    <div className="space-y-6">
      {farmerProfile.declared && (
        <Card className="p-4 text-[13px]">
          <div className="font-medium">From your setup</div>
          <p className="mt-0.5 text-ink-muted">
            {farmerProfile.declared.acres} acres in {farmerProfile.declared.village} · {farmerProfile.declared.crop} on{" "}
            {farmerProfile.declared.cropAcres} acres, sown {formatDate(farmerProfile.declared.sowingDate)}.
          </p>
          <InfoNote className="mt-2">Prototype: recommendations continue to use the demo farm (Farm #27) so the story stays coherent.</InfoNote>
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
                  <div className="text-ink-muted">{field.acres} acres</div>
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
  const toast = useToast();

  return (
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
  );
}

function InvestmentTab() {
  const { farmerProfile } = useAppStore();
  const total = investmentPlan.reduce((s, l) => s + l.estimate, 0);
  const saveLow = investmentPlan.reduce((s, l) => s + (l.savingRange ? (l.estimate * l.savingRange[0]) / 100 : 0), 0);
  const saveHigh = investmentPlan.reduce((s, l) => s + (l.savingRange ? (l.estimate * l.savingRange[1]) / 100 : 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="text-[13px] text-ink-muted">Estimated season investment · Farm #27</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{formatINR(total)}</div>
          <div className="mt-1 text-[12px] text-ink-subtle">About {formatINR(total / 2.5)} per acre</div>
        </Card>
        <Card className="p-5">
          <div className="text-[13px] text-ink-muted">Potential saving through cluster coordination</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {formatINR(Math.round(saveLow / 100) * 100)}–{formatINR(Math.round(saveHigh / 100) * 100)}
          </div>
          <div className="mt-1 text-[12px] text-ink-subtle">
            {Math.round((saveLow / total) * 100)}–{Math.round((saveHigh / total) * 100)}% of the season plan
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
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Estimate</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Cost-saving opportunity</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Potential saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {investmentPlan.map((l) => {
                const supportsGoal = l.domains.includes(farmerProfile.objective);
                return (
                  <tr key={l.category} className={clsx(supportsGoal && "bg-brand-50/60")}>
                    <td className="px-5 py-3 font-medium">
                      {l.category}
                      {supportsGoal && <span className="sr-only"> (supports your goal)</span>}
                    </td>
                    <td className="px-5 py-3 text-right">{formatINR(l.estimate)}</td>
                    <td className="px-5 py-3 text-ink-muted">{l.opportunity ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {l.savingRange
                        ? `${formatINR((l.estimate * l.savingRange[0]) / 100)}–${formatINR((l.estimate * l.savingRange[1]) / 100)}`
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
