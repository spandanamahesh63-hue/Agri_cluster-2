import { useState } from "react";
import { useProvider } from "../../features/provider/useProvider";
import { BookingRow } from "../../features/provider/BookingRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/states";
import { Tabs } from "../../components/navigation/Tabs";

type Tab = "requests" | "upcoming" | "past";

export function BookingsPage() {
  const p = useProvider();
  const [tab, setTab] = useState<Tab>(p.requests.length ? "requests" : "upcoming");
  const rows = p[tab];
  const empty: Record<Tab, string> = {
    requests: "No requests waiting for you.",
    upcoming: "No confirmed bookings coming up.",
    past: "No completed or declined bookings yet.",
  };

  return (
    <>
      <PageHeader title="Bookings" description="Who is using your equipment, and when?" />
      <Tabs<Tab>
        label="Booking status"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "requests", label: "Requests", count: p.requests.length },
          { id: "upcoming", label: "Upcoming", count: p.upcoming.length },
          { id: "past", label: "Past", count: p.past.length },
        ]}
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title={empty[tab]} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((b) => (
              <BookingRow key={b.id} booking={b} machine={p.equipment.find((m) => m.id === b.machineryId)} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
