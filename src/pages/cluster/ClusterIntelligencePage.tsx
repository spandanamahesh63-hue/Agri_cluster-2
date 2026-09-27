import { ClusterPage } from "../../features/cluster/ClusterPage";
import { AlertCard } from "../../features/cluster/AlertCard";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";

const steps = [
  "Farm, sensor, weather, resource and market data is collected for every member farm.",
  "The same rules that advise individual farmers run across the whole cluster.",
  "Signals that repeat across farms — or that compete for shared resources — become cluster alerts.",
  "The coordinator acts on shared resources (machinery, buyers, experts); each farmer decides on their own farm.",
];

export function ClusterIntelligencePage() {
  return (
    <ClusterPage title="Cluster intelligence" description="Which signals across the cluster need coordination, and why?">
      {(v) => (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {v.alerts.length === 0 ? (
              <Card>
                <EmptyState title="No cluster alerts right now" description="Alerts appear when signals repeat across farms or shared resources run short." />
              </Card>
            ) : (
              v.alerts.map((a) => <AlertCard key={a.id} alert={a} defaultOpen={a.priority === "high"} />)
            )}
          </div>
          <aside className="space-y-4">
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-[15px] font-semibold">How cluster intelligence works</h2>
              <ol className="mt-3 space-y-2.5">
                {steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-[13px] leading-snug text-ink-muted">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
            <Card className="p-5 text-[13px]">
              <div className="font-medium">From member farms today</div>
              <p className="mt-1 text-ink-muted">
                {v.activity.decisions} decisions recorded ({v.activity.accepted} accepted) · {v.activity.listings} crop listings ·{" "}
                {v.activity.bookings + v.activity.labourRequests} resource requests · {v.activity.consultations} expert questions.
              </p>
            </Card>
          </aside>
        </div>
      )}
    </ClusterPage>
  );
}
