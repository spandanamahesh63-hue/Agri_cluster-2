import { useLabour } from "../../features/labour/useLabour";
import { WorkRow } from "../../features/labour/WorkRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";

export function AssignmentsPage() {
  const l = useLabour();
  return (
    <>
      <PageHeader title="Assignments" description="Where are you working, and when?" />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Current and upcoming" />
          {l.assignments.length === 0 ? (
            <EmptyState title="No assignments yet" description="Accepted work requests appear here." />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {l.assignments.map((r) => (
                <WorkRow key={r.id} request={r} profile={l.profile} />
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="History" />
          {l.history.length === 0 ? (
            <EmptyState title="Nothing here yet" />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {l.history.map((r) => (
                <WorkRow key={r.id} request={r} profile={l.profile} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
