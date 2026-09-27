import { useState } from "react";
import clsx from "clsx";
import { useAppStore } from "../../store/AppStore";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { RecommendationCard } from "../../features/intelligence/RecommendationCard";
import { IntelligenceTabs } from "../../features/intelligence/IntelligenceTabs";
import { orderForObjective } from "../../features/farmer/objective";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";

type Filter = "open" | "reviewed" | "all";
const filters: { id: Filter; label: string }[] = [
  { id: "open", label: "Needs review" },
  { id: "reviewed", label: "Reviewed" },
  { id: "all", label: "All" },
];

export function IntelligencePage() {
  const overview = useFarmerOverview();
  const { decisions, farmerProfile } = useAppStore();
  const [filter, setFilter] = useState<Filter>("open");

  const header = (
    <>
      <PageHeader
        title="Intelligence"
        description="Suggestions built from your farm, weather, simulated sensor, resource and market data. The platform recommends — you decide."
      />
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

  const all = orderForObjective(overview.data.recommendations, farmerProfile.objective);
  const counts = {
    open: all.filter((r) => !decisions[r.id]).length,
    reviewed: all.filter((r) => decisions[r.id]).length,
    all: all.length,
  };
  const visible = all.filter((r) => (filter === "all" ? true : filter === "open" ? !decisions[r.id] : !!decisions[r.id]));

  return (
    <>
      {header}
      <div role="tablist" aria-label="Filter suggestions" className="mb-4 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-[13px]",
              filter === f.id ? "bg-brand-50 font-medium text-brand-800" : "text-ink-muted hover:text-ink",
            )}
          >
            {f.label} <span className="text-ink-subtle">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title={filter === "reviewed" ? "No decisions yet" : "No open suggestions"}
            description={
              filter === "reviewed"
                ? "Suggestions you accept or ignore will be listed here."
                : "Everything has been reviewed. New suggestions appear when conditions change."
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </>
  );
}
