import { useExpert } from "../../features/expert/useExpert";
import { QueryRow } from "../../features/expert/QueryRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";

export function ConsultationsPage() {
  const x = useExpert();
  const history = x.done.filter((c) => c.status === "completed");
  return (
    <>
      <PageHeader title="Consultations" description="What sessions are coming up, and what came of past ones?" />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Upcoming" subtitle="Open one to record the outcome when it is done" />
          {x.scheduled.length === 0 ? (
            <EmptyState title="No consultations scheduled" description="Schedule one from any farmer's question." />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {x.scheduled.map((c) => (
                <QueryRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Completed" />
          {history.length === 0 ? (
            <EmptyState title="No completed consultations yet" />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {history.map((c) => (
                <QueryRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
