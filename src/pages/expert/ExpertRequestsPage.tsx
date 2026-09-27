import { useState } from "react";
import { useExpert } from "../../features/expert/useExpert";
import { QueryRow } from "../../features/expert/QueryRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";

type Tab = "inbox" | "done";

export function ExpertRequestsPage() {
  const x = useExpert();
  const [tab, setTab] = useState<Tab>("inbox");
  const rows = tab === "inbox" ? x.inbox : x.done;
  return (
    <>
      <PageHeader title="Requests" description="What have farmers asked?" />
      <Tabs<Tab>
        label="Request status"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "inbox", label: "New", count: x.inbox.length },
          { id: "done", label: "Answered", count: x.done.length },
        ]}
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title={tab === "inbox" ? "No new questions" : "Nothing answered yet"} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <QueryRow key={c.id} c={c} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
