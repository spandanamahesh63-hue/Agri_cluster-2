import { useAppStore } from "../../store/AppStore";
import { useExpert } from "../../features/expert/useExpert";
import { QueryRow } from "../../features/expert/QueryRow";
import { StatTile } from "../../features/cluster/StatTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";
import { Badge } from "../../components/ui/Badge";
import { expertCategoryLabels } from "../../data/mock/experts";
import { DEMO_NOW } from "../../data/mock/clock";
import { formatINR, greeting } from "../../utils/format";
import { Link } from "react-router-dom";
import { PublishProfileBanner } from "../../features/accounts/PublishProfileBanner";

export function ExpertDashboard() {
  const { session } = useAppStore();
  const x = useExpert();
  return (
    <>
      <PageHeader eyebrow={x.expert?.title} title={`${greeting(DEMO_NOW)}, ${session?.name}`} description="Which farmers need your help?" />
      {!x.expert && session?.mode === "real" && <PublishProfileBanner what="expert profile (your area, what you help with, your fee)" to="/expert/profile" />}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile label="New questions" value={x.inbox.length} status={x.inbox.length ? "moderate" : "healthy"} to="/expert/requests" />
          <StatTile label="Upcoming consultations" value={x.scheduled.length} to="/expert/consultations" />
          <StatTile label="Answered / completed" value={x.done.length} />
        </div>
        {x.expert && (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px]">
              <div className="font-medium">Your expertise: {expertCategoryLabels[x.expert.category]}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {x.expert.expertise.map((e) => (
                  <Badge key={e}>{e}</Badge>
                ))}
              </div>
              <div className="mt-1 text-ink-muted">
                {x.expert.languages.join(", ")} · consultation {formatINR(x.expert.consultationFee)} (indicative) · questions free through the cluster
              </div>
            </div>
            <Link to="/expert/consultations" className="shrink-0 text-[13px] font-medium text-brand-700 hover:underline">
              View schedule
            </Link>
          </Card>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Waiting for your advice" subtitle="Newest first" />
            {x.inbox.length === 0 ? (
              <EmptyState title="Inbox clear" description="New questions from cluster farmers appear here." />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {x.inbox.map((c) => (
                  <QueryRow key={c.id} c={c} />
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Upcoming sessions" />
            {x.scheduled.length === 0 ? (
              <EmptyState title="Nothing scheduled" />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {x.scheduled.map((c) => (
                  <QueryRow key={c.id} c={c} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
