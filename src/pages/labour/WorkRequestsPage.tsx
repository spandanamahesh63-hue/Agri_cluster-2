import { useLabour } from "../../features/labour/useLabour";
import { WorkRow } from "../../features/labour/WorkRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";

export function WorkRequestsPage() {
  const l = useLabour();
  return (
    <>
      <PageHeader title="Work requests" description="Which farms need your skills?" />
      <Card>
        {l.requests.length === 0 ? (
          <EmptyState title="No new requests" description="Keep your skills and availability up to date so farmers can find you." />
        ) : (
          <ul className="divide-y divide-line">
            {l.requests.map((r) => (
              <WorkRow key={r.id} request={r} profile={l.profile} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
