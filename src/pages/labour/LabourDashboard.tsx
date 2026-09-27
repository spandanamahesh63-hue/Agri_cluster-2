import { Link } from "react-router-dom";
import { useAppStore } from "../../store/AppStore";
import { useLabour } from "../../features/labour/useLabour";
import { WorkRow } from "../../features/labour/WorkRow";
import { StatTile } from "../../features/cluster/StatTile";
import { skillLabels } from "../../data/mock/labour";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { DEMO_NOW } from "../../data/mock/clock";
import { formatDate, formatINR, greeting } from "../../utils/format";

export function LabourDashboard() {
  const { session } = useAppStore();
  const l = useLabour();
  const p = l.profile;
  const days = l.assignments.reduce((s, r) => s + r.days, 0);
  const wages = p ? l.assignments.reduce((s, r) => s + r.workers * r.days * p.dailyWage, 0) : 0;

  return (
    <>
      <PageHeader
        eyebrow={p?.label}
        title={`${greeting(DEMO_NOW)}, ${session?.name}`}
        description="What work is available for your crew?"
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="New work requests" value={l.requests.length} status={l.requests.length ? "moderate" : "healthy"} to="/labour/jobs" />
          <StatTile label="Upcoming assignments" value={l.assignments.length} to="/labour/assignments" />
          <StatTile label="Days booked" value={days} />
          <StatTile label="Expected wages" value={formatINR(wages)} sub="For the whole crew · indicative" />
        </div>

        {p && (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px]">
              <div className="font-medium">
                Your profile: {p.crewSize} workers · {p.village} · {formatINR(p.dailyWage)}/day each
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.skills.map((s) => (
                  <Badge key={s}>{skillLabels[s]}</Badge>
                ))}
                <Badge tone={p.availability === "available" ? "success" : p.availability === "limited" ? "warning" : "neutral"}>
                  {p.availability === "available" ? "Available" : p.availability === "limited" ? "Limited" : "Fully booked"} from {formatDate(p.availableFrom)}
                </Badge>
              </div>
            </div>
            <Link to="/labour/profile" className="shrink-0 text-[13px] font-medium text-brand-700 hover:underline">
              Update skills & availability
            </Link>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="New work requests" subtitle="From farms in the cluster" />
            {l.requests.length === 0 ? (
              <EmptyState title="No new requests" description="Farmers who need your skills will send requests here." />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {l.requests.map((r) => (
                  <WorkRow key={r.id} request={r} profile={p} />
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Upcoming assignments" />
            {l.assignments.length === 0 ? (
              <EmptyState title="No assignments yet" />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {l.assignments.map((r) => (
                  <WorkRow key={r.id} request={r} profile={p} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
